import { loadCachedShipitCatalog } from "../catalog-cache";
import { cartItemsToShipitParcel } from "../parcel";
import { createShipitQuoteHash } from "../quote-hash";
import { createOrReuseShipitQuote } from "../quote-reuse";
import {
  selectCheapestShipitRate,
  selectEligibleShipitRates,
} from "../rate-selector";
import { addChileIvaToNetClp } from "../tax";

describe("Shipit quote foundations", () => {
  it("adds and rounds 19 percent IVA to a net CLP rate", () => {
    expect(addChileIvaToNetClp(4000)).toEqual({
      netPrice: 4000,
      taxAmount: 760,
      grossPrice: 4760,
      taxRateBps: 1900,
      taxInclusive: true,
    });
    expect(addChileIvaToNetClp(4001).grossPrice).toBe(4761);
  });
  it("converts the single-item policy from grams to kilograms", () => {
    expect(
      cartItemsToShipitParcel([
        {
          quantity: 1,
          variant: {
            id: "variant_1",
            weight: 500,
            length: 20,
            width: 10,
            height: 5,
          },
        },
      ]),
    ).toMatchObject({
      weightKg: 0.5,
      items: 1,
      packingPolicy: "single-item-v1",
    });
  });

  it("fails closed for multi-unit carts until packing is approved", () => {
    expect(() =>
      cartItemsToShipitParcel([{ quantity: 2, variant: null }]),
    ).toThrow("supports one physical unit only");
  });

  it("filters, deduplicates and sorts rates deterministically", () => {
    const rate = (courier: string, price: number, available = true) => ({
      courier: { name: courier },
      original_courier: courier,
      name: "normal",
      price,
      days: 2,
      available_to_shipping: available,
      destiny: {
        id: 1,
        type_of_destiny: "domicilio",
        available: true,
        commune_id: 308,
      },
    });
    expect(
      selectEligibleShipitRates({
        rates: [
          rate("b", 5000),
          rate("a", 4000),
          rate("a", 4000),
          rate("x", 1, false),
        ],
        communeId: 308,
        destinationKind: "domicilio",
      }).map((item) => item.original_courier),
    ).toEqual(["a", "b"]);
  });

  it("selects the cheapest eligible rate with deterministic tie breaking", () => {
    const candidate = (courier: string, price: number, days: number) => ({
      courier: { name: courier },
      original_courier: courier,
      name: "normal",
      price,
      days,
      available_to_shipping: true,
      destiny: {
        id: 1,
        type_of_destiny: "domicilio",
        available: true,
        commune_id: 308,
      },
    });
    expect(
      selectCheapestShipitRate({
        rates: [
          candidate("slow", 4000, 4),
          candidate("fast", 4000, 2),
          candidate("expensive", 5000, 1),
        ],
        communeId: 308,
        destinationKind: "domicilio",
      }).original_courier,
    ).toBe("fast");
  });

  it("creates stable hashes and changes them with quote inputs", () => {
    const input = {
      cartId: "cart_1",
      variantId: "variant_1",
      quantity: 1,
      packingPolicy: "single-item-v1",
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 10,
      heightCm: 5,
      originCommuneId: 10,
      destinationCommuneId: 20,
      destinationKind: "domicilio",
      destinationContext: "address-hash",
      courier: "courier",
      service: "normal",
      shipitDestinyId: 1,
      price: 4000,
      days: 2,
      contractVersion: "v4",
    };
    expect(createShipitQuoteHash(input)).toBe(
      createShipitQuoteHash({ ...input }),
    );
    expect(createShipitQuoteHash(input)).not.toBe(
      createShipitQuoteHash({ ...input, price: 4001 }),
    );
  });

  it("caches catalogs under the Shipit namespace", async () => {
    const cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      invalidate: jest.fn(),
    };
    await expect(
      loadCachedShipitCatalog({
        cache,
        key: "communes",
        ttlSeconds: 60,
        load: async () => [1],
      }),
    ).resolves.toEqual([1]);
    expect(cache.set).toHaveBeenCalledWith("shipit:catalog:communes", [1], 60);
  });

  it("reuses only a valid quote within the configured TTL", async () => {
    const existing = {
      id: "shq_1",
      cart_id: "cart_1",
      quote_hash: "hash",
      quoted_at: new Date("2026-09-07T12:00:00Z"),
      invalidated_at: null,
    };
    const store = {
      findByCartAndHash: jest.fn().mockResolvedValue([existing]),
      create: jest.fn(),
    };
    await expect(
      createOrReuseShipitQuote({
        cartId: "cart_1",
        quoteHash: "hash",
        maxAgeSeconds: 900,
        create: existing,
        store,
        now: new Date("2026-09-07T12:10:00Z"),
      }),
    ).resolves.toEqual({ quote: existing, reused: true });
    expect(store.create).not.toHaveBeenCalled();
  });
});
