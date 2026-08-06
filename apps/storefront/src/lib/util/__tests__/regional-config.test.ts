import { describe, expect, it } from "vitest"

import { storefrontRegionalConfig } from "../../regional-config"
import { convertToLocale } from "../money"

describe("storefrontRegionalConfig", () => {
  it("keeps language, locale, territory, and currency distinct", () => {
    expect(storefrontRegionalConfig).toMatchObject({
      presentationLocale: "es-CL",
      defaultCountryCode: "cl",
      expectedCurrencyCode: "CLP",
      htmlLanguage: "es-CL",
    })
  })
})

describe("convertToLocale", () => {
  it.each([0, 15990])(
    "formats CLP amount %s without artificial decimals",
    (amount) => {
      const formatted = convertToLocale({ amount, currency_code: "CLP" })
      expect(formatted).toBe(
        new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
        }).format(amount),
      )
      expect(formatted).not.toMatch(/[,.]00$/)
    },
  )

  it("preserves the currency supplied by Medusa", () => {
    expect(convertToLocale({ amount: 12.5, currency_code: "USD" })).toBe(
      new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "USD",
      }).format(12.5),
    )
  })
})
