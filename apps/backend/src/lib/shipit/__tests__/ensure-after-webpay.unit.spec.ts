import { ensureShipitAfterCompletedWebpay } from "../ensure-after-webpay";

describe("ensureShipitAfterCompletedWebpay", () => {
  it("ensures fulfillment once for a completed attempt with order_id", async () => {
    const ensureFulfillment = jest.fn().mockResolvedValue({
      status: "created",
      fulfillment_id: "ful_1",
    });
    const logger = { error: jest.fn() };

    await ensureShipitAfterCompletedWebpay({
      attempt: {
        state: "completed",
        order_id: "order_1",
      },
      ensureFulfillment,
      logger,
    });

    expect(ensureFulfillment).toHaveBeenCalledTimes(1);
    expect(ensureFulfillment).toHaveBeenCalledWith("order_1");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    ["manual_review", "order_1"],
    ["rejected", "order_1"],
    ["cancelled", "order_1"],
    ["recovery_required", "order_1"],
    ["completed", null],
    ["completed", undefined],
  ])(
    "does not ensure fulfillment for state=%s order_id=%s",
    async (state, order_id) => {
      const ensureFulfillment = jest.fn();
      const logger = { error: jest.fn() };

      await ensureShipitAfterCompletedWebpay({
        attempt: { state, order_id },
        ensureFulfillment,
        logger,
      });

      expect(ensureFulfillment).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it("does not turn a fulfillment failure into a Webpay failure", async () => {
    const ensureFulfillment = jest
      .fn()
      .mockRejectedValue(new Error("Shipit unavailable"));
    const logger = { error: jest.fn() };

    await expect(
      ensureShipitAfterCompletedWebpay({
        attempt: {
          state: "completed",
          order_id: "order_1",
        },
        ensureFulfillment,
        logger,
      }),
    ).resolves.toBeUndefined();

    expect(ensureFulfillment).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(
      logger.error.mock.calls[0][0] as string,
    );

    expect(payload).toEqual({
      event: "shipit.fulfillment.ensure_failed",
      order_id: "order_1",
      error_name: "Error",
    });
  });
});