import { describe, expect, it } from "vitest"

import { getPaymentButtonKind } from "../payment-button-kind"

describe("getPaymentButtonKind", () => {
  it("selects the Webpay payment button", () => {
    expect(getPaymentButtonKind("pp_webpay-plus_webpay")).toBe("webpay")
  })

  it("does not treat an unknown provider as Webpay", () => {
    expect(getPaymentButtonKind("pp_unknown_default")).toBe("unsupported")
  })
})
