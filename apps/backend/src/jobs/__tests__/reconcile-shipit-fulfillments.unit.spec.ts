import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import reconcileShipitFulfillments, {
  config,
} from "../reconcile-shipit-fulfillments";
import { ensureMedusaShipitFulfillment } from "../../lib/shipit/ensure-medusa-fulfillment";
import { WEBPAY_MODULE } from "../../modules/webpay";

jest.mock("../../lib/shipit/ensure-medusa-fulfillment", () => ({
  ensureMedusaShipitFulfillment: jest.fn(),
}));

const ensureFulfillmentMock =
  ensureMedusaShipitFulfillment as jest.MockedFunction<
    typeof ensureMedusaShipitFulfillment
  >;

function makeAttempt(index: number, orderId: string | null = `order_${index}`) {
  return {
    id: `attempt_${index}`,
    order_id: orderId,
  };
}

describe("reconcileShipitFulfillments job", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs every five minutes", () => {
    expect(config).toEqual({
      name: "reconcile-shipit-fulfillments",
      schedule: "*/5 * * * *",
    });
  });

  it("paginates all completed attempts in batches of 50", async () => {
    const firstPage = Array.from(
      { length: 50 },
      (_, index) => makeAttempt(index),
    );
    const secondPage = [
      makeAttempt(50),
      makeAttempt(51),
    ];

    const listWebpayAttempts = jest
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const container = {
      resolve: jest.fn((key: string) => {
        if (key === ContainerRegistrationKeys.LOGGER) return logger;
        if (key === WEBPAY_MODULE) {
          return { listWebpayAttempts };
        }

        throw new Error(`Unexpected dependency: ${key}`);
      }),
    };

    ensureFulfillmentMock.mockResolvedValue({
      status: "existing",
    } as never);

    await reconcileShipitFulfillments(container as never);

    expect(listWebpayAttempts).toHaveBeenNthCalledWith(
      1,
      { state: "completed" },
      { skip: 0, take: 50 },
    );
    expect(listWebpayAttempts).toHaveBeenNthCalledWith(
      2,
      { state: "completed" },
      { skip: 50, take: 50 },
    );

    expect(ensureFulfillmentMock).toHaveBeenCalledTimes(52);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "shipit.reconciliation.completed scanned=52 created=0 existing=52 skipped=0 missing_order_id=0 failed=0",
    );
  });

  it("skips missing order ids and continues after one order fails", async () => {
    const listWebpayAttempts = jest.fn().mockResolvedValue([
      makeAttempt(1),
      makeAttempt(2, null),
      makeAttempt(3),
      makeAttempt(4),
      makeAttempt(5),
    ]);

    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const container = {
      resolve: jest.fn((key: string) => {
        if (key === ContainerRegistrationKeys.LOGGER) return logger;
        if (key === WEBPAY_MODULE) {
          return { listWebpayAttempts };
        }

        throw new Error(`Unexpected dependency: ${key}`);
      }),
    };

    ensureFulfillmentMock
      .mockResolvedValueOnce({ status: "existing" } as never)
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce({ status: "created" } as never)
      .mockResolvedValueOnce({
        status: "skipped",
        reason: "non_shipit_shipping_method",
      } as never);

    await reconcileShipitFulfillments(container as never);

    expect(ensureFulfillmentMock).toHaveBeenCalledTimes(4);
    expect(ensureFulfillmentMock.mock.calls.map((call) => call[1])).toEqual([
      "order_1",
      "order_3",
      "order_4",
      "order_5",
    ]);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toContain(
      "order_id=order_3",
    );
    expect(logger.error.mock.calls[0][0]).toContain(
      "attempt_id=attempt_3",
    );

    expect(logger.info).toHaveBeenCalledWith(
      "shipit.reconciliation.completed scanned=5 created=1 existing=1 skipped=1 missing_order_id=1 failed=1",
    );
  });
});
