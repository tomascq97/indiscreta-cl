import {
  createInitiationKey,
  generateBuyOrder,
  generateWebpaySessionId,
} from "../identifiers";

describe("Webpay identifiers", () => {
  it("generates opaque identifiers within Transbank limits", () => {
    const buyOrders = new Set(Array.from({ length: 100 }, generateBuyOrder));
    const sessionIds = new Set(
      Array.from({ length: 100 }, generateWebpaySessionId),
    );

    expect(buyOrders.size).toBe(100);
    expect(sessionIds.size).toBe(100);
    for (const value of buyOrders) {
      expect(value).toMatch(/^I[0-9A-HJKMNP-TV-Z]+$/);
      expect(value.length).toBeLessThanOrEqual(26);
    }
    for (const value of sessionIds) {
      expect(value).toMatch(/^S[0-9A-HJKMNP-TV-Z]+$/);
      expect(value.length).toBeLessThanOrEqual(61);
    }
  });

  it("creates a deterministic key from the server-side correlation", () => {
    const input = {
      providerId: "pp_webpay-plus_webpay",
      paymentSessionId: "payses_01",
      amount: 15990,
      currencyCode: "clp",
    };

    expect(createInitiationKey(input)).toBe(createInitiationKey(input));
    expect(createInitiationKey({ ...input, amount: 15991 })).not.toBe(
      createInitiationKey(input),
    );
  });
});
