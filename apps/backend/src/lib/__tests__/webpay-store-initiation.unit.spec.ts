import { validateBackendEnvironment } from "../env";
import {
  assertIntegrationWebpayEnabled,
  initiateWebpayRequestSchema,
  toStoreWebpayInitiationResponse,
} from "../webpay-store-initiation";

const baseEnvironment = {
  DATABASE_URL: "postgres://localhost/test",
  STORE_CORS: "http://localhost:8000",
  ADMIN_CORS: "http://localhost:9000",
  AUTH_CORS: "http://localhost:8000",
  JWT_SECRET: "test",
  COOKIE_SECRET: "test",
  WEBPAY_ENVIRONMENT: "integration",
  WEBPAY_COMMERCE_CODE: "integration-code",
  WEBPAY_API_KEY_SECRET: "integration-secret",
  WEBPAY_RETURN_URL: "http://localhost:9000/webpay/return-placeholder",
  WEBPAY_RESULT_URL: "http://localhost:8000/cl/checkout",
};

describe("Webpay Store initiation boundary", () => {
  it("accepts only a cart identifier", () => {
    expect(initiateWebpayRequestSchema.parse({ cart_id: "cart_01" })).toEqual({
      cart_id: "cart_01",
    });
    expect(() =>
      initiateWebpayRequestSchema.parse({ cart_id: "cart_01", amount: 1000 }),
    ).toThrow();
  });

  it("allows only the integration environment", () => {
    expect(() =>
      assertIntegrationWebpayEnabled(
        validateBackendEnvironment(baseEnvironment),
        "development",
      ),
    ).not.toThrow();

    expect(() =>
      assertIntegrationWebpayEnabled(
        validateBackendEnvironment(baseEnvironment),
        "production",
      ),
    ).toThrow("only enabled in integration");
  });

  it("returns only a token and trusted Transbank URL", () => {
    expect(
      toStoreWebpayInitiationResponse({
        attempt_id: "wpa_01",
        token: "token-01",
        webpay_url:
          "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
      }),
    ).toEqual({
      token: "token-01",
      webpay_url:
        "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    });
  });

  it.each([
    [{ token: "token-01" }],
    [{ webpay_url: "https://webpay3gint.transbank.cl" }],
    [{ token: "token-01", webpay_url: "https://example.com/pay" }],
    [{ token: "token-01", webpay_url: "not-a-url" }],
  ])("rejects an invalid backend result", (result) => {
    expect(() => toStoreWebpayInitiationResponse(result)).toThrow();
  });
});
