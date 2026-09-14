import type { ShipitConfiguration } from "../../lib/env";
import type { ShipitCatalogCache } from "../../lib/shipit/catalog-cache";
import { loadCachedShipitCatalog } from "../../lib/shipit/catalog-cache";
import type { ShipitApiClient, ShipitPricesClient } from "../../lib/shipit/clients";
import {
  findCanonicalBranchOffice,
  type ShipitBranchOffice,
} from "../../lib/shipit/branch-offices";
import {
  createShipitDestinationContext,
  resolveShipitCommune,
} from "../../lib/shipit/location";
import { cartItemsToShipitParcel } from "../../lib/shipit/parcel";
import { createShipitQuoteHash } from "../../lib/shipit/quote-hash";
import {
  buildShipitBranchOfficeRateRequest,
  buildShipitHomeRateRequest,
} from "../../lib/shipit/quote-request";
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
  prices: Pick<ShipitPricesClient, "couriers" | "branchOffices">;
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

export type ShipitQuoteSelection =
  | {
      destinationKind: "home_delivery";
    }
  | {
      destinationKind: "courier_branch_office";
      courierId: number;
      branchOfficeId: number;
      destinationCommuneId: number;
    };

export async function calculateShipitShippingQuote(
  dependencies: Pick<QuoteShipitDependencies, "api" | "configuration"> & {
    loadCommunes: () => ReturnType<ShipitApiClient["communes"]>;
    loadCouriers: () => ReturnType<ShipitPricesClient["couriers"]>;
    loadBranchOffices: (
      courierId: number,
    ) => ReturnType<ShipitPricesClient["branchOffices"]>;
  },
  cart: ShipitQuoteCart,
  selection: ShipitQuoteSelection = {
    destinationKind: "home_delivery",
  },
) {
  const address = cart.shipping_address;

  if (
    cart.currency_code.toLowerCase() !== "clp" ||
    address?.country_code?.toLowerCase() !== "cl"
  ) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Invalid Shipit checkout cart",
    );
  }

  if (
    selection.destinationKind === "home_delivery" &&
    (!address.city?.trim() || !address.address_1?.trim())
  ) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Invalid Shipit checkout cart",
    );
  }

  const parcel = cartItemsToShipitParcel(cart.items ?? [], {
    sandbox: dependencies.configuration.sandbox,
  });

  const communes = await dependencies.loadCommunes();

  const destination =
    selection.destinationKind === "home_delivery"
      ? resolveShipitCommune(address.city!, communes)
      : communes.find(
          (commune) =>
            commune.id === selection.destinationCommuneId &&
            commune.is_available !== false,
        );

  if (!destination) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Shipit branch-office commune was not found",
    );
  }

  let canonicalCourier: {
    id: number;
    name: string;
    available_to_ship: boolean;
  } | null = null;

  let canonicalBranchOffice: ShipitBranchOffice | null = null;

  if (selection.destinationKind === "courier_branch_office") {
    if (
      !Number.isSafeInteger(selection.courierId) ||
      selection.courierId <= 0 ||
      !Number.isSafeInteger(selection.branchOfficeId) ||
      selection.branchOfficeId <= 0 ||
      !Number.isSafeInteger(selection.destinationCommuneId) ||
      selection.destinationCommuneId <= 0
    ) {
      throw new ShipitError(
        "INVALID_RESPONSE",
        "Invalid Shipit branch-office selection",
      );
    }

    const couriers = await dependencies.loadCouriers();

    canonicalCourier =
      couriers.find(
        (courier) =>
          courier.id === selection.courierId &&
          courier.available_to_ship,
      ) ?? null;

    if (!canonicalCourier) {
      throw new ShipitError(
        "INVALID_RESPONSE",
        "Shipit courier is not available",
      );
    }

    const branches = await dependencies.loadBranchOffices(
      canonicalCourier.id,
    );

    canonicalBranchOffice = findCanonicalBranchOffice({
      branches,
      courierId: canonicalCourier.id,
      communeId: destination.id,
      branchOfficeId: selection.branchOfficeId,
    });

    if (!canonicalBranchOffice) {
      throw new ShipitError(
        "INVALID_RESPONSE",
        "Invalid Shipit branch-office selection",
      );
    }
  }

  const rateRequest =
    selection.destinationKind === "home_delivery"
      ? buildShipitHomeRateRequest({
          parcel,
          originCommuneId: dependencies.configuration.originCommuneId,
          destinationCommuneId: destination.id,
        })
      : buildShipitBranchOfficeRateRequest({
          parcel,
          originCommuneId: dependencies.configuration.originCommuneId,
          destinationCommuneId: destination.id,
          courier: canonicalCourier!.name,
        });

  const response = await dependencies.api.rates(rateRequest);

  const rate =
    selection.destinationKind === "home_delivery"
      ? selectCheapestShipitRate({
          rates: response.prices,
          communeId: destination.id,
          destinationKind: "domicilio",
        })
      : selectCheapestShipitRate({
          rates: response.prices,
          communeId: destination.id,
          destinationKind: "courier_branch_office",
          courier: canonicalCourier!.name,
        });

  const totals = addChileIvaToNetClp(rate.price);

  const destinationContext =
    selection.destinationKind === "home_delivery"
      ? createShipitDestinationContext(address)
      : createShipitDestinationContext({
          country_code: "cl",
          city: destination.name,
          address_1: canonicalBranchOffice!.address,
          address_2: `${canonicalBranchOffice!.name}|${canonicalBranchOffice!.id}`,
        });

  const courierId =
    selection.destinationKind === "courier_branch_office"
      ? canonicalCourier!.id
      : null;

  const branchOfficeId =
    selection.destinationKind === "courier_branch_office"
      ? canonicalBranchOffice!.id
      : null;

  const quoteHash = createShipitQuoteHash({
    cartId: cart.id,
    contentsKey: parcel.contentsKey,
    quantity: parcel.items,
    packingPolicy: parcel.packingPolicy,
    weightKg: parcel.weightKg,
    lengthCm: parcel.lengthCm,
    widthCm: parcel.widthCm,
    heightCm: parcel.heightCm,
    originCommuneId: dependencies.configuration.originCommuneId,
    destinationCommuneId: destination.id,
    destinationKind: selection.destinationKind,
    destinationContext,
    courier: rate.original_courier,
    service: rate.name,
    shipitDestinyId: rate.destiny?.id ?? destination.id,
    branchOfficeId,
    price: totals.grossPrice,
    days: rate.days,
    contractVersion: "v4-net-iva19",
  });

  return {
    parcel,
    destination,
    rate,
    totals,
    destinationContext,
    quoteHash,
    destinationKind: selection.destinationKind,
    courierId,
    branchOfficeId,
    branchOfficeName:
      selection.destinationKind === "courier_branch_office"
        ? canonicalBranchOffice!.name
        : null,
    branchOfficeAddress:
      selection.destinationKind === "courier_branch_office"
        ? canonicalBranchOffice!.address
        : null,
  };
}

export async function quoteShipitShippingOperation(
  dependencies: QuoteShipitDependencies,
  input: {
    cartId: string;
    selection?: ShipitQuoteSelection;
  },
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
  const {
    parcel,
    destination,
    rate,
    totals,
    destinationContext,
    quoteHash,
    destinationKind,
    courierId,
    branchOfficeId,
  } =
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
        loadCouriers: () =>
          loadCachedShipitCatalog({
            cache: dependencies.cache,
            key: "couriers",
            ttlSeconds: dependencies.configuration.catalogCacheTtlSeconds,
            load: () => dependencies.prices.couriers(),
          }),
        loadBranchOffices: (courierId) =>
          loadCachedShipitCatalog({
            cache: dependencies.cache,
            key: `branch-offices:${courierId}`,
            ttlSeconds: dependencies.configuration.catalogCacheTtlSeconds,
            load: () =>
              dependencies.prices.branchOffices(courierId),
          }),
      },
      cart,
      input.selection,
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
              destination_kind: destinationKind,
              destination_context: destinationContext,
              courier_id: courierId,
              courier_name: rate.original_courier,
              service_name: rate.name,
              shipit_destiny_id: rate.destiny?.id ?? destination.id,
              branch_office_id: branchOfficeId,
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
