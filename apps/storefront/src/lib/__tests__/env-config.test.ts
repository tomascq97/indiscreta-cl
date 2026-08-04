import { describe, expect, it } from "vitest"

import {
  conditionalEnvironmentVariables,
  optionalEnvironmentVariables,
  requiredEnvironmentVariables,
  validateStorefrontEnvironment,
} from "../env-config"

const validProductionEnvironment = {
  NODE_ENV: "production",
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test",
  NEXT_PUBLIC_MEDUSA_BACKEND_URL: "https://backend.invalid",
  NEXT_PUBLIC_BASE_URL: "https://store.invalid",
}

describe("validateStorefrontEnvironment", () => {
  it("returns a valid typed production configuration", () => {
    expect(
      validateStorefrontEnvironment(validProductionEnvironment),
    ).toMatchObject(validProductionEnvironment)
  })

  it("reports missing required variables by name", () => {
    expect(() =>
      validateStorefrontEnvironment({ NODE_ENV: "development" }),
    ).toThrow(
      "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY; Missing required environment variable: NEXT_PUBLIC_MEDUSA_BACKEND_URL",
    )
  })

  it("accepts absent optional and provider-specific variables", () => {
    const environment = validateStorefrontEnvironment({
      NODE_ENV: "development",
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test",
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://localhost:9000",
    })

    expect(environment.NEXT_PUBLIC_STRIPE_KEY).toBeUndefined()
    expect(environment.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID).toBeUndefined()
    expect(optionalEnvironmentVariables).toContain("NEXT_PUBLIC_STRIPE_KEY")
    expect(conditionalEnvironmentVariables.medusaPayments).toHaveLength(2)
  })

  it("rejects localhost backend and base URLs in production", () => {
    expect(() =>
      validateStorefrontEnvironment({
        ...validProductionEnvironment,
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://localhost:9000",
        NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:8000",
      }),
    ).toThrow(
      "NEXT_PUBLIC_MEDUSA_BACKEND_URL must not use localhost in production; NEXT_PUBLIC_BASE_URL must not use localhost in production",
    )
  })

  it("accepts localhost URLs in development", () => {
    expect(() =>
      validateStorefrontEnvironment({
        NODE_ENV: "development",
        NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test",
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://localhost:9000",
        NEXT_PUBLIC_BASE_URL: "http://127.0.0.1:8000",
      }),
    ).not.toThrow()
  })

  it("rejects IPv6 loopback URLs in production", () => {
    expect(() =>
      validateStorefrontEnvironment({
        ...validProductionEnvironment,
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "http://[::1]:9000",
      }),
    ).toThrow(
      "NEXT_PUBLIC_MEDUSA_BACKEND_URL must not use localhost in production",
    )
  })

  it("rejects localhost with a trailing dot in production", () => {
    expect(() =>
      validateStorefrontEnvironment({
        ...validProductionEnvironment,
        NEXT_PUBLIC_BASE_URL: "https://LOCALHOST.:8000",
      }),
    ).toThrow("NEXT_PUBLIC_BASE_URL must not use localhost in production")
  })

  it("rejects non-HTTP URL protocols in every environment", () => {
    expect(() =>
      validateStorefrontEnvironment({
        NODE_ENV: "development",
        NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_test",
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "ftp://backend.invalid",
      }),
    ).toThrow("NEXT_PUBLIC_MEDUSA_BACKEND_URL must use http: or https:")
  })

  it("accepts valid HTTPS URLs", () => {
    expect(() =>
      validateStorefrontEnvironment({
        ...validProductionEnvironment,
        NEXT_PUBLIC_MEDUSA_BACKEND_URL: "https://api.example.invalid",
        NEXT_PUBLIC_BASE_URL: "https://shop.example.invalid",
      }),
    ).not.toThrow()
  })

  it("keeps required, optional, and conditional rules separate", () => {
    expect(requiredEnvironmentVariables).not.toContain("NEXT_PUBLIC_STRIPE_KEY")
    expect(optionalEnvironmentVariables).toContain("NEXT_PUBLIC_STRIPE_KEY")
    expect(conditionalEnvironmentVariables.medusaCloudS3).toEqual([
      "MEDUSA_CLOUD_S3_HOSTNAME",
      "MEDUSA_CLOUD_S3_PATHNAME",
    ])
  })
})
