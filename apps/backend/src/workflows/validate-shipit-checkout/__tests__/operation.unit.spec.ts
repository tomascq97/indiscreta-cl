import { assertShipitCheckoutQuote } from "../operation";
import { SHIPIT_FULFILLMENT_PROVIDER_ID } from "../../../modules/shipit-fulfillment/service";

describe("Shipit pre-Webpay gate", () => {
  const method = {
    id: "sm_1",
    amount: 4760,
    data: { shipit_quote_id: "shq_1", shipit_quote_hash: "hash" },
    shipping_option: {
      provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
      price_type: "calculated",
    },
  };

  it("accepts the current gross quote", () => {
    expect(() =>
      assertShipitCheckoutQuote({
        methods: [method],
        current: {
          quote_id: "shq_1",
          quote_hash: "hash",
          calculated_amount: 4760,
        },
      }),
    ).not.toThrow();
  });

  it("blocks Webpay when the gross shipping amount changed", () => {
    expect(() =>
      assertShipitCheckoutQuote({
        methods: [method],
        current: {
          quote_id: "shq_1",
          quote_hash: "hash",
          calculated_amount: 4761,
        },
      }),
    ).toThrow("El despacho cambió");
  });
});
