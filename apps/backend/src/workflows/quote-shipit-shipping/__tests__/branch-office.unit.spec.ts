import type { ShipitConfiguration } from "../../../lib/env";
import { calculateShipitShippingQuote } from "../operation";

const configuration: ShipitConfiguration = {
  enabled: true,
  shipmentCreationEnabled: false,
  sandbox: true,
  apiBaseUrl: "https://api.shipit.cl",
  pricesBaseUrl: "https://prices.shipit.cl",
  trackingBaseUrl: "https://courierstatus.shipit.cl",
  email: "account@example.invalid",
  accessToken: "test-token",
  timeoutMs: 1000,
  readMaxRetries: 0,
  originCommuneId: 308,
  quoteMaxAgeSeconds: 900,
  catalogCacheTtlSeconds: 3600,
  ratesAreNet: true,
};

const cart = {
  id: "cart_branch",
  currency_code: "clp",
  shipping_address: {
    country_code: "cl",
    city: "ConcepciÃƒÂ³n",
    address_1: "Cliente 123",
  },
  items: [
    {
      quantity: 1,
      variant: {
        id: "variant_1",
        weight: 500,
        length: 20,
        width: 15,
        height: 5,
      },
    },
  ],
};

function dependencies() {
  return {
    configuration,
    loadCommunes: async () =>
      [
        {
          id: 146,
          name: "CONCEPCION",
          is_available: true,
        },
      ] as never,
    loadCouriers: async () =>
      [
        {
          id: 1,
          name: "chilexpress",
          available_to_ship: true,
        },
      ] as never,
    loadBranchOffices: async (courierId: number) =>
      [
        {
          id: 940,
          address: "Maipu 583",
          commune_id: 146,
          courier_bo_id: "CXP-940",
          courier_id: courierId,
          name: "Concepcion Maipu Dos",
        },
        {
          id: 941,
          address: "Jorge Alessandri 3177",
          commune_id: 146,
          courier_bo_id: "CXP-941",
          courier_id: courierId,
          name: "Concepcion Mall El Trebol",
        },
      ] as never,
    api: {
      rates: jest.fn(async () => ({
        algorithm: "1",
        prices: [
          {
            courier: { name: "chilexpress" },
            original_courier: "chilexpress",
            name: "normal",
            price: 6613,
            days: 2,
            available_to_shipping: true,
            destiny: null,
          },
        ],
      })) as never,
    },
  };
}

describe("Shipit branch-office quote", () => {
  it("uses courier_branch_office and the selected courier", async () => {
    const deps = dependencies();

    const result = await calculateShipitShippingQuote(
      deps as never,
      cart,
      {
        destinationKind: "courier_branch_office",
        courierId: 1,
        branchOfficeId: 940,
        destinationCommuneId: 146,
      },
    );

    expect(deps.api.rates).toHaveBeenCalledWith({
      parcel: expect.objectContaining({
        destiny_id: 146,
        type_of_destiny: "courier_branch_office",
        courier_for_client: "chilexpress",
      }),
    });

    expect(result.destinationKind).toBe("courier_branch_office");
    expect(result.courierId).toBe(1);
    expect(result.branchOfficeId).toBe(940);
    expect(result.branchOfficeName).toBe(
      "Concepcion Maipu Dos",
    );
    expect(result.branchOfficeAddress).toBe("Maipu 583");
    expect(result.destinationContext).toEqual(
      expect.any(String),
    );
    expect(result.destinationContext.length).toBeGreaterThan(0);
    expect(result.rate.original_courier).toBe("chilexpress");
  });

  it("rejects a courier that is not available in the canonical catalog", async () => {
    const deps = dependencies();

    deps.loadCouriers = async () =>
      [
        {
          id: 1,
          name: "chilexpress",
          available_to_ship: false,
        },
      ] as never;

    await expect(
      calculateShipitShippingQuote(
        deps as never,
        cart,
        {
          destinationKind: "courier_branch_office",
          courierId: 1,
          branchOfficeId: 940,
          destinationCommuneId: 146,
        },
      ),
    ).rejects.toThrow("Shipit courier is not available");

    expect(deps.api.rates).not.toHaveBeenCalled();
  });

  it("changes the quote hash when the selected branch changes", async () => {
    const deps = dependencies();

    const first = await calculateShipitShippingQuote(
      deps as never,
      cart,
      {
        destinationKind: "courier_branch_office",
        courierId: 1,
        branchOfficeId: 940,
        destinationCommuneId: 146,
      },
    );

    const second = await calculateShipitShippingQuote(
      deps as never,
      cart,
      {
        destinationKind: "courier_branch_office",
        courierId: 1,
        branchOfficeId: 941,
        destinationCommuneId: 146,
      },
    );

    expect(first.totals.grossPrice).toBe(second.totals.grossPrice);
    expect(first.quoteHash).not.toBe(second.quoteHash);
  });

  it("rejects an unavailable branch commune", async () => {
    const deps = dependencies();

    await expect(
      calculateShipitShippingQuote(
        deps as never,
        cart,
        {
          destinationKind: "courier_branch_office",
          courierId: 1,
          branchOfficeId: 940,
          destinationCommuneId: 999,
        },
      ),
    ).rejects.toThrow("Shipit branch-office commune was not found");
  });
});
