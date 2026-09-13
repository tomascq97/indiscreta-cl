import ShipitFulfillmentProviderService, {
  buildShipitShippingMethodData,
  shipitHomeEconomyOption,
} from "../service";

describe("Shipit fulfillment provider", () => {
  it("stores only authoritative quote selection metadata", () => {
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

  it("returns zero without quoting Shipit when the cart has no items", async () => {
    const service = new ShipitFulfillmentProviderService({});

    (service as unknown as { quote: () => Promise<never> }).quote = async () => {
      throw new Error("Shipit quote must not run for an empty cart");
    };

    const result = await service.calculatePrice(
      {} as never,
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

  it("uses the Shipit quote amount for a non-empty cart", async () => {
    const service = new ShipitFulfillmentProviderService({});

    (service as unknown as {
      quote: () => Promise<{ totals: { grossPrice: number } }>;
    }).quote = async () => ({
      totals: {
        grossPrice: 7869,
      },
    });

    const result = await service.calculatePrice(
      {} as never,
      {} as never,
      {
        items: [
          {
            quantity: 1,
          },
        ],
      } as never,
    );

    expect(result).toEqual({
      calculated_amount: 7869,
      is_calculated_price_tax_inclusive: true,
    });
  });
});
