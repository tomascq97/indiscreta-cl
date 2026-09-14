import { isValidShipitWebhookAuthorization } from "../webhook";

describe("Shipit webhook authorization", () => {
  it("accepts only the configured Bearer token", () => {
    expect(isValidShipitWebhookAuthorization("Bearer secret", "secret")).toBe(
      true,
    );
    expect(isValidShipitWebhookAuthorization("Bearer wrong", "secret")).toBe(
      false,
    );
    expect(isValidShipitWebhookAuthorization(undefined, "secret")).toBe(false);
    expect(isValidShipitWebhookAuthorization("Bearer secret", undefined)).toBe(
      false,
    );
  });
});
