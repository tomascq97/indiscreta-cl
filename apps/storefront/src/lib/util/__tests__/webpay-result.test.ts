import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { getWebpayResultView, type WebpayResult } from "../webpay-result"

const result = (state: WebpayResult["state"]): WebpayResult => ({
  id: "wpa_public",
  state,
  order_id: state === "approved" ? "order_123" : null,
  amount: 15990,
  currency_code: "clp",
  date: "2026-08-14T12:00:00.000Z",
  payment_type: "VD",
  installments: null,
  card_last_four: "6623",
  message: "Mensaje seguro",
})

describe("Webpay result UX", () => {
  it.each([
    ["approved", true, false],
    ["rejected", false, true],
    ["cancelled", false, true],
    ["review", false, false],
    ["unavailable", false, false],
  ] as const)(
    "maps %s to safe actions",
    (state, canOpenOrder, canReturnToCheckout) => {
      expect(getWebpayResultView(result(state))).toMatchObject({
        canOpenOrder,
        canReturnToCheckout,
      })
    },
  )

  it("refreshes through a read-only request without payment side effects", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/lib/data/webpay-result.ts"),
      "utf8",
    )

    expect(source).toContain('method: "GET"')
    expect(source).toContain('cache: "no-store"')
    expect(source).not.toContain("commit(")
    expect(source).not.toContain("initiateWebpayPayment")
    expect(source).not.toContain("placeOrder")
  })
})
