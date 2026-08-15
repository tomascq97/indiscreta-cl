import { describe, expect, it } from "vitest"

import { selectActivePaymentSession } from "../payment-session"

const cart = (paymentSessions: Array<Record<string, unknown>>) => ({
  payment_collection: { payment_sessions: paymentSessions },
})

describe("selectActivePaymentSession", () => {
  it("selects Webpay by provider and active status regardless of array order", () => {
    const webpay = {
      id: "payses_webpay",
      provider_id: "pp_webpay-plus_webpay",
      status: "pending",
    }
    const other = {
      id: "payses_system",
      provider_id: "pp_system_default",
      status: "pending",
    }

    expect(
      selectActivePaymentSession(cart([other, webpay]), {
        providerId: "pp_webpay-plus_webpay",
      }),
    ).toBe(webpay)
    expect(
      selectActivePaymentSession(cart([webpay, other]), {
        providerId: "pp_webpay-plus_webpay",
      }),
    ).toBe(webpay)
  })

  it("ignores an old terminal session", () => {
    const pending = {
      id: "payses_new",
      provider_id: "pp_webpay-plus_webpay",
      status: "pending",
    }

    expect(
      selectActivePaymentSession(
        cart([
          {
            id: "payses_old",
            provider_id: "pp_webpay-plus_webpay",
            status: "canceled",
          },
          pending,
        ]),
        { providerId: "pp_webpay-plus_webpay" },
      ),
    ).toBe(pending)
  })

  it("returns no session for a missing or incorrect provider", () => {
    expect(
      selectActivePaymentSession(
        cart([
          {
            id: "payses_system",
            provider_id: "pp_system_default",
            status: "pending",
          },
        ]),
        { providerId: "pp_webpay-plus_webpay" },
      ),
    ).toBeUndefined()
  })

  it("returns no session when duplicate active sessions are ambiguous", () => {
    expect(
      selectActivePaymentSession(
        cart([
          {
            id: "payses_a",
            provider_id: "pp_webpay-plus_webpay",
            status: "pending",
          },
          {
            id: "payses_b",
            provider_id: "pp_webpay-plus_webpay",
            status: "pending",
          },
        ]),
        { providerId: "pp_webpay-plus_webpay" },
      ),
    ).toBeUndefined()
  })
})
