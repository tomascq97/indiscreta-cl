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
});
