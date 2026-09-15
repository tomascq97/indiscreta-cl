import ShipitFulfillmentProviderService, {
  buildShipitQuoteSelection,
  buildShipitShippingMethodData,
  shipitBranchOfficeOption,
  shipitHomeEconomyOption,
} from "../service";

describe("Shipit fulfillment provider", () => {
  it("exposes both Shipit fulfillment options", async () => {
    const service =
      new ShipitFulfillmentProviderService({});

    await expect(
      service.getFulfillmentOptions(),
    ).resolves.toEqual([
      shipitHomeEconomyOption,
      shipitBranchOfficeOption,
    ]);
  });

  it("builds the home-delivery selection", () => {
    expect(
      buildShipitQuoteSelection(
        shipitHomeEconomyOption,
        {},
      ),
    ).toEqual({
      destinationKind: "home_delivery",
    });
  });

  it("builds a branch-office selection", () => {
    expect(
      buildShipitQuoteSelection(
        shipitBranchOfficeOption,
        {
          courier: "chilexpress",
          courier_id: 1,
          branch_office_id: 940,
          branch_office_name:
            "Concepcion Maipu Dos",
          branch_office_address: "Maipu 583",
          destination_commune_id: 146,
        },
      ),
    ).toEqual({
      destinationKind:
        "courier_branch_office",
      courierId: 1,
      branchOfficeId: 940,
      destinationCommuneId: 146,
    });
  });

  it("rejects incomplete branch-office data", () => {
    expect(() =>
      buildShipitQuoteSelection(
        shipitBranchOfficeOption,
        {
          courier: "chilexpress",
          courier_id: 1,
          destination_commune_id: 146,
        },
      ),
    ).toThrow(
      "Invalid Shipit branch-office branch_office_id",
    );
  });

  it("stores authoritative home quote metadata", () => {
    expect(
      buildShipitShippingMethodData({
        quote_id: "shq_1",
        quote_hash: "hash",
        courier: "bluexpress",
        service: "normal",
        delivery_days: 2,
      }),
    ).toMatchObject({
      ...shipitHomeEconomyOption,
      shipit_quote_id: "shq_1",
      shipit_quote_hash: "hash",
      courier: "bluexpress",
      service: "normal",
      delivery_days: 2,
    });
  });

  it("stores selected branch metadata", () => {
    const selection = {
      destinationKind:
        "courier_branch_office" as const,
      courierId: 1,
      branchOfficeId: 940,
      destinationCommuneId: 146,
    };

    expect(
      buildShipitShippingMethodData(
        {
          quote_hash: "branch-hash",
          courier: "chilexpress",
          service: "normal",
          delivery_days: 2,
          destination_commune_id: 146,
          destination_commune_name:
            "CONCEPCION",
          courier_id: 1,
          branch_office_id: 940,
          branch_office_name:
            "Concepcion Maipu Dos",
          branch_office_address: "Maipu 583",
        },
        selection,
      ),
    ).toMatchObject({
      ...shipitBranchOfficeOption,
      destination_commune_id: 146,
      branch_office_id: 940,
      branch_office_name:
        "Concepcion Maipu Dos",
      branch_office_address: "Maipu 583",
      courier: "chilexpress",
      shipit_quote_hash: "branch-hash",
    });
  });

  it("returns zero without quoting Shipit when the cart has no items", async () => {
    const service =
      new ShipitFulfillmentProviderService({});

    (
      service as unknown as {
        quote: () => Promise<never>;
      }
    ).quote = async () => {
      throw new Error(
        "Shipit quote must not run for an empty cart",
      );
    };

    const result = await service.calculatePrice(
      shipitHomeEconomyOption as never,
      {} as never,
      {
        items: [],
      } as never,
    );

    expect(result).toEqual({
      calculated_amount: 0,
      is_calculated_price_tax_inclusive: true,
    });
  });

  it("passes home selection to the quote", async () => {
    const service =
      new ShipitFulfillmentProviderService({});

    const quote = jest.fn(async () => ({
      totals: {
        netPrice: 6613,
        grossPrice: 7869,
      },
    }));

    (
      service as unknown as {
        quote: typeof quote;
      }
    ).quote = quote;

    const result = await service.calculatePrice(
      shipitHomeEconomyOption as never,
      {} as never,
      {
        items: [{ quantity: 1 }],
      } as never,
    );

    expect(quote).toHaveBeenCalledWith(
      expect.anything(),
      {
        destinationKind: "home_delivery",
      },
    );

    expect(result.calculated_amount).toBe(7869);
    expect(result.is_calculated_price_tax_inclusive).toBe(true);
  });

  it("passes branch selection to the quote", async () => {
    const service =
      new ShipitFulfillmentProviderService({});

    const quote = jest.fn(async () => ({
      totals: {
        netPrice: 5557,
        grossPrice: 6613,
      },
    }));

    (
      service as unknown as {
        quote: typeof quote;
      }
    ).quote = quote;

    const result = await service.calculatePrice(
      shipitBranchOfficeOption as never,
      {
        courier: "chilexpress",
        courier_id: 1,
        branch_office_id: 940,
        branch_office_name:
          "Concepcion Maipu Dos",
        branch_office_address: "Maipu 583",
        destination_commune_id: 146,
      } as never,
      {
        items: [{ quantity: 1 }],
      } as never,
    );

    expect(quote).toHaveBeenCalledWith(
      expect.anything(),
      {
        destinationKind:
          "courier_branch_office",
        courierId: 1,
        branchOfficeId: 940,
        destinationCommuneId: 146,
      },
    );

    expect(result.calculated_amount).toBe(6613);
    expect(result.is_calculated_price_tax_inclusive).toBe(true);
  });

  it("quotes a branch using cached catalogs and only calls Shipit rates", async () => {
    const originalFetch = global.fetch;

    const cachedCatalogs = new Map<string, unknown>([
      [
        "shipit:catalog:communes",
        {
          serialized: JSON.stringify([
            {
              id: 146,
              name: "CONCEPCION",
              is_available: true,
            },
          ]),
        },
      ],
      [
        "shipit:catalog:couriers",
        {
          serialized: JSON.stringify([
            {
              id: 1,
              name: "chilexpress",
              available_to_ship: true,
            },
          ]),
        },
      ],
      [
        "shipit:catalog:branch-offices:1",
        {
          serialized: JSON.stringify([
            {
              id: 940,
              address: "Maipu 583",
              commune_id: 146,
              courier_bo_id: "CXP-940",
              courier_id: 1,
              name: "Concepcion Maipu Dos",
            },
          ]),
        },
      ],
    ]);

    const caching = {
      get: jest.fn(async ({ key }: { key: string }) =>
        cachedCatalogs.get(key) ?? null,
      ),
      set: jest.fn(async () => undefined),
      clear: jest.fn(async () => undefined),
    };

    const ratesResponse = {
      algorithm: "1",
      algorithm_days: null,
      courier_for_client: null,
      prices: [
        {
          courier: {
            name: "chilexpress",
            packet_from: "concepcion",
            packet_to: "concepcion",
          },
          original_courier: "chilexpress",
          name: "normal",
          price: 6613,
          days: 2,
          available_to_shipping: true,
          volumetric_weight: 0,
          destiny: {
            id: 146,
            name: "CONCEPCION",
            description: "Concepcion",
            type_of_destiny: "courier_branch_office",
            payable: true,
            available: true,
            commune_id: 146,
            courier_branch_office_id: 940,
            courier_branch_office: {
              id: 940,
              name: "Concepcion Maipu Dos",
              commune_id: 146,
              address: "Maipu 583",
              courier_bo_id: "CXP-940",
            },
          },
        },
      ],
    };

    const fetchMock = jest.fn(async (input: URL | RequestInfo) => {
      const url = String(input);

      if (url.endsWith("/v/rates")) {
        return new Response(JSON.stringify(ratesResponse), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        });
      }

      throw new Error(`Unexpected Shipit HTTP request: ${url}`);
    }) as unknown as typeof fetch;

    global.fetch = fetchMock;

    const service = new ShipitFulfillmentProviderService({
      caching,
    });

    try {
      const result = await service.calculatePrice(
        shipitBranchOfficeOption as never,
        {
          courier: "chilexpress",
          courier_id: 1,
          branch_office_id: 940,
          branch_office_name: "Concepcion Maipu Dos",
          branch_office_address: "Maipu 583",
          destination_commune_id: 146,
        } as never,
        {
          id: "cart_branch",
          currency_code: "clp",
          shipping_address: {
            country_code: "cl",
            city: "Concepcion",
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
        } as never,
      );

      expect(result.calculated_amount).toBe(7869);
      expect(result.is_calculated_price_tax_inclusive).toBe(true);

      expect(caching.get).toHaveBeenCalledWith({
        key: "shipit:catalog:communes",
      });
      expect(caching.get).toHaveBeenCalledWith({
        key: "shipit:catalog:couriers",
      });
      expect(caching.get).toHaveBeenCalledWith({
        key: "shipit:catalog:branch-offices:1",
      });

      expect(caching.set).not.toHaveBeenCalled();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0].toString()).toContain("/v/rates");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
