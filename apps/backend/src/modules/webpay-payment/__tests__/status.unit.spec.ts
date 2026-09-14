import { PaymentSessionStatus } from "@medusajs/framework/utils";

import { statusFromData } from "../service";

describe("Webpay provider payment status", () => {
  it.each([
    ["creating", PaymentSessionStatus.PENDING],
    ["committing", PaymentSessionStatus.PENDING],
    ["approved_validated", PaymentSessionStatus.AUTHORIZED],
    ["completed", PaymentSessionStatus.AUTHORIZED],
    ["cancelled", PaymentSessionStatus.CANCELED],
    ["expired", PaymentSessionStatus.CANCELED],
    ["rejected", PaymentSessionStatus.ERROR],
    ["recovery_required", PaymentSessionStatus.ERROR],
    ["manual_review", PaymentSessionStatus.ERROR],
  ])("maps %s to %s", (state, expected) => {
    expect(statusFromData({ webpay_state: state })).toBe(expected);
  });
});
