import type { ShipitConfiguration } from "../../lib/env";
import type { ShipitCatalogCache } from "../../lib/shipit/catalog-cache";
import { loadCachedShipitCatalog } from "../../lib/shipit/catalog-cache";
import type { ShipitApiClient } from "../../lib/shipit/clients";
import {
  createShipitDestinationContext,
  resolveShipitCommune,
} from "../../lib/shipit/location";
import { cartItemsToShipitParcel } from "../../lib/shipit/parcel";
import { createShipitQuoteHash } from "../../lib/shipit/quote-hash";
import { buildShipitHomeRateRequest } from "../../lib/shipit/quote-request";
import { createOrReuseShipitQuote } from "../../lib/shipit/quote-reuse";
import { selectCheapestShipitRate } from "../../lib/shipit/rate-selector";
import { addChileIvaToNetClp } from "../../lib/shipit/tax";
import { ShipitError } from "../../lib/shipit/errors";

type Query = {
  graph(input: Record<string, unknown>): Promise<{ data: unknown[] }>;
};

type Locking = {
  execute<T>(key: string, job: () => Promise<T>): Promise<T>;
};

type Quote = {
  id: string;
  cart_id: string;
  quote_hash: string;
  quoted_at: Date;
  invalidated_at: Date | null;
  price: unknown;
  net_price: unknown;
  tax_amount: unknown;
  courier_name: string;
  service_name: string;
  delivery_days: number;
};

type QuoteStore = {
  findByCartAndHash(cartId: string, hash: string): Promise<Quote[]>;
  create(data: Record<string, unknown>): Promise<Quote>;
};

export type QuoteShipitDependencies = {
  query: Query;
  api: Pick<ShipitApiClient, "communes" | "rates">;
  cache: ShipitCatalogCache;
  locking: Locking;
  store: QuoteStore;
  configuration: ShipitConfiguration;
};

export type ShipitQuoteCart = {
  id: string;
  currency_code: string;
  shipping_address?: {
    country_code?: string | null;
    city?: string | null;
    province?: string | null;
    address_1?: string | null;
    address_2?: string | null;
    postal_code?: string | null;
  } | null;
  items?: Parameters<typeof cartItemsToShipitParcel>[0];
};

export async function calculateShipitShippingQuote(
  dependencies: Pick<QuoteShipitDependencies, "api" | "configuration"> & {
    loadCommunes: () => ReturnType<ShipitApiClient["communes"]>
  },
  cart: ShipitQuoteCart,
) {
  const address = cart.shipping_address
  if (
    cart.currency_code.toLowerCase() !== "clp" ||
    address?.country_code?.toLowerCase() !== "cl" ||
    !address.city?.trim() ||
    !address.address_1?.trim()
  ) {
    throw new ShipitError("INVALID_RESPONSE", "Invalid Shipit checkout cart")
  }

  const parcel = cartItemsToShipitParcel(cart.items ?? [])
  const communes = await dependencies.loadCommunes()
  const destination = resolveShipitCommune(address.city, communes)
  const response = await dependencies.api.rates(
    buildShipitHomeRateRequest({
      parcel,
      originCommuneId: dependencies.configuration.originCommuneId,
      destinationCommuneId: destination.id,
    }),
  )
  const rate = selectCheapestShipitRate({
    rates: response.prices,
    communeId: destination.id,
    destinationKind: "domicilio",
  })
  const totals = addChileIvaToNetClp(rate.price)
  const destinationContext = createShipitDestinationContext(address)
  const quoteHash = createShipitQuoteHash({
    cartId: cart.id,
    variantId: parcel.variantId,
    quantity: parcel.items,
    packingPolicy: parcel.packingPolicy,
    weightKg: parcel.weightKg,
    lengthCm: parcel.lengthCm,
    widthCm: parcel.widthCm,
    heightCm: parcel.heightCm,
    originCommuneId: dependencies.configuration.originCommuneId,
    destinationCommuneId: destination.id,
    destinationKind: "home_delivery",
    destinationContext,
    courier: rate.original_courier,
    service: rate.name,
    shipitDestinyId: rate.destiny?.id ?? destination.id,
    price: totals.grossPrice,
    days: rate.days,
    contractVersion: "v4-net-iva19",
  })
  return { parcel, destination, rate, totals, destinationContext, quoteHash }
}

export async function quoteShipitShippingOperation(
  dependencies: QuoteShipitDependencies,
  input: { cartId: string },
) {
  const { data } = await dependencies.query.graph({
    entity: "cart",
    fields: [
      "id",
      "currency_code",
      "shipping_address.country_code",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.postal_code",
      "items.quantity",
      "items.variant.id",
      "items.variant.weight",
      "items.variant.length",
      "items.variant.width",
      "items.variant.height",
    ],
    filters: { id: input.cartId },
    options: { isList: false },
  });
  const cart = data[0] as ShipitQuoteCart | undefined;
  if (!cart || cart.id !== input.cartId) {
    throw new ShipitError("INVALID_RESPONSE", "Invalid Shipit checkout cart");
  }
  const { parcel, destination, rate, totals, destinationContext, quoteHash } =
    await calculateShipitShippingQuote(
      {
        api: dependencies.api,
        configuration: dependencies.configuration,
        loadCommunes: () =>
          loadCachedShipitCatalog({
            cache: dependencies.cache,
            key: "communes",
            ttlSeconds: dependencies.configuration.catalogCacheTtlSeconds,
            load: () => dependencies.api.communes(),
          }),
      },
      cart,
    )

  return dependencies.locking.execute(
    `shipit:quote:${cart.id}:${quoteHash}`,
    async () => {
      const stored = await createOrReuseShipitQuote({
        cartId: cart.id,
        quoteHash,
        maxAgeSeconds: dependencies.configuration.quoteMaxAgeSeconds,
        create: {},
        store: {
          findByCartAndHash: dependencies.store.findByCartAndHash,
          create: () =>
            dependencies.store.create({
              cart_id: cart.id,
              quote_hash: quoteHash,
              contract_version: "v4-net-iva19",
              packing_policy: parcel.packingPolicy,
              origin_commune_id: dependencies.configuration.originCommuneId,
              destination_commune_id: destination.id,
              destination_kind: "home_delivery",
              destination_context: destinationContext,
              courier_id: null,
              courier_name: rate.original_courier,
              service_name: rate.name,
              shipit_destiny_id: rate.destiny?.id ?? destination.id,
              branch_office_id: null,
              length_cm: parcel.lengthCm,
              width_cm: parcel.widthCm,
              height_cm: parcel.heightCm,
              weight_kg: parcel.weightKg,
              net_price: totals.netPrice,
              tax_amount: totals.taxAmount,
              tax_rate_bps: totals.taxRateBps,
              price: totals.grossPrice,
              currency_code: "clp",
              tax_inclusive: true,
              delivery_days: rate.days,
              quoted_at: new Date(),
            }),
        },
      });
      return {
        quote_id: stored.quote.id,
        quote_hash: stored.quote.quote_hash,
        calculated_amount: Number(stored.quote.price),
        net_amount: Number(stored.quote.net_price),
        tax_amount: Number(stored.quote.tax_amount),
        is_calculated_price_tax_inclusive: true as const,
        currency_code: "clp" as const,
        courier: stored.quote.courier_name,
        service: stored.quote.service_name,
        delivery_days: stored.quote.delivery_days,
        reused: stored.reused,
      };
    },
  );
}
