import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const readConsumer = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8")

describe("representative dictionary consumers", () => {
  it("uses the semantic order date key in the account overview", () => {
    const source = readConsumer(
      "../../../modules/account/components/overview/index.tsx",
    )

    expect(source).toContain('from "@lib/translations/es-cl"')
    expect(source).toContain("esCl.orders.datePlaced")
    expect(source).not.toContain(">Total</span>")
  })

  it("uses the complete payment-test warning key", () => {
    const source = readConsumer(
      "../../../modules/checkout/components/payment-test/index.tsx",
    )

    expect(source).toContain('from "@lib/translations/es-cl"')
    expect(source).toContain("esCl.checkout.paymentTestNotice")
    expect(source).not.toMatch(/For testing purposes/i)
  })
})
