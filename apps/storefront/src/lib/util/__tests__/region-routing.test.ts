import { describe, expect, it } from "vitest"

import { buildCountryRedirectUrl, resolveCountryCode } from "../region-routing"

describe("resolveCountryCode", () => {
  it("uses cl when a route has no country code", () => {
    expect(resolveCountryCode({ availableCountryCodes: ["cl", "pe"] })).toBe(
      "cl",
    )
  })

  it("keeps cl and additional valid country routes without redirecting them", () => {
    expect(
      resolveCountryCode({
        availableCountryCodes: ["cl", "pe"],
        urlCountryCode: "cl",
      }),
    ).toBe("cl")
    expect(
      resolveCountryCode({
        availableCountryCodes: ["cl", "pe"],
        urlCountryCode: "PE",
      }),
    ).toBe("pe")
  })

  it("uses valid deployment geography before the product default", () => {
    expect(
      resolveCountryCode({
        availableCountryCodes: ["cl", "pe"],
        cloudflareCountryCode: "pe",
      }),
    ).toBe("pe")
  })

  it("fails explicitly instead of selecting another market when cl is unavailable", () => {
    expect(() =>
      resolveCountryCode({ availableCountryCodes: ["dk", "pe"] }),
    ).toThrow(/configured default country \(cl\)/)
  })
})

describe("buildCountryRedirectUrl", () => {
  it("preserves pathname and query string", () => {
    expect(
      buildCountryRedirectUrl({
        origin: "https://indiscreta.example",
        pathname: "/products/top",
        search: "?color=negro&page=2",
        countryCode: "cl",
      }),
    ).toBe("https://indiscreta.example/cl/products/top?color=negro&page=2")
  })

  it("builds the deterministic root redirect", () => {
    expect(
      buildCountryRedirectUrl({
        origin: "https://indiscreta.example",
        pathname: "/",
        search: "",
        countryCode: "cl",
      }),
    ).toBe("https://indiscreta.example/cl")
  })
})
