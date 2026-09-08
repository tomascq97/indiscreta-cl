import {
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
});
