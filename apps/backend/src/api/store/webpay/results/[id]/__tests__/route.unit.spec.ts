import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { GET } from "../route";

function response() {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

function request(retrieveWebpayAttempt: jest.Mock) {
  return {
    params: { id: "wpa_public" },
    scope: {
      resolve: jest.fn(() => ({ retrieveWebpayAttempt })),
    },
  } as unknown as MedusaRequest;
}

describe("GET /store/webpay/results/:id", () => {
  it("returns only the sanitized result and refresh has no side effects", async () => {
    const retrieve = jest.fn().mockResolvedValue({
      id: "wpa_public",
      state: "completed",
      amount: 15990,
      currency_code: "clp",
      order_id: "order_123",
      transaction_date: new Date("2026-08-14T12:00:00.000Z"),
      payment_type_code: "VD",
      installments_number: 0,
      card_last_four: "6623",
      token: "token-secret",
      buy_order: "buy-secret",
      session_id: "session-secret",
      payment_session_id: "payses-secret",
      payment_collection_id: "paycol-secret",
    });
    const req = request(retrieve);
    const first = response();
    const second = response();

    await GET(req, first as unknown as MedusaResponse);
    await GET(req, second as unknown as MedusaResponse);

    expect(retrieve).toHaveBeenCalledTimes(2);
    expect(first.status).toHaveBeenCalledWith(200);
    expect(first.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store, max-age=0",
    );
    const serialized = JSON.stringify(first.json.mock.calls[0][0]);
    expect(serialized).toContain('"state":"approved"');
    expect(serialized).not.toContain("token-secret");
    expect(serialized).not.toContain("buy-secret");
    expect(serialized).not.toContain("session-secret");
    expect(serialized).not.toContain("payses-secret");
    expect(serialized).not.toContain("paycol-secret");
  });

  it("returns a sanitized unavailable result for an unknown attempt", async () => {
    const req = request(jest.fn().mockRejectedValue(new Error("not found")));
    const res = response();

    await GET(req, res as unknown as MedusaResponse);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      result: expect.objectContaining({
        id: null,
        state: "unavailable",
        order_id: null,
      }),
    });
  });
});
