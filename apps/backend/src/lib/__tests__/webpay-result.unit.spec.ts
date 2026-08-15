import {
  sanitizeWebpayResult,
  unavailableWebpayResult,
} from "../webpay-result";

const attempt = {
  id: "wpa_public",
  state: "completed",
  amount: 15990,
  currency_code: "CLP",
  order_id: "order_123",
  payment_type_code: "VD",
  installments_number: 0,
  transaction_date: new Date("2026-08-14T12:00:00.000Z"),
  card_last_four: "6623",
  token: "secret-token",
  session_id: "internal-session",
  buy_order: "internal-order",
  payment_session_id: "payses_123",
  payment_collection_id: "pay_col_123",
  authorization_code: "1213",
};

describe("sanitizeWebpayResult", () => {
  it("returns the approved allow-list", () => {
    expect(sanitizeWebpayResult(attempt)).toEqual({
      id: "wpa_public",
      state: "approved",
      order_id: "order_123",
      amount: 15990,
      currency_code: "clp",
      date: "2026-08-14T12:00:00.000Z",
      payment_type: "VD",
      installments: null,
      card_last_four: "6623",
      message: "Tu pago fue aprobado y tu pedido quedó confirmado.",
    });
  });

  it.each([
    ["rejected", "rejected"],
    ["cancelled", "cancelled"],
    ["recovery_required", "review"],
  ])("maps %s to the public state %s", (internalState, publicState) => {
    const result = sanitizeWebpayResult({
      ...attempt,
      state: internalState,
      order_id: null,
    });

    expect(result.state).toBe(publicState);
    expect(result.order_id).toBeNull();
  });

  it("never exposes transaction or Medusa correlation identifiers", () => {
    const serialized = JSON.stringify(sanitizeWebpayResult(attempt));

    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("internal-session");
    expect(serialized).not.toContain("internal-order");
    expect(serialized).not.toContain("payses_123");
    expect(serialized).not.toContain("pay_col_123");
    expect(serialized).not.toContain("1213");
  });

  it("returns a stable unavailable result", () => {
    expect(unavailableWebpayResult()).toMatchObject({
      id: null,
      state: "unavailable",
      order_id: null,
      amount: null,
    });
  });
});
