import { Modules } from "@medusajs/framework/utils";

import { SHIPIT_MODULE } from "../../modules/shipit";
import persistShipitFulfillment, {
  config,
} from "../persist-shipit-fulfillment";

describe("persist Shipit fulfillment subscriber", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("subscribes to order.fulfillment_created", () => {
    expect(config).toEqual({ event: "order.fulfillment_created" });
  });

  it("persists Shipit fulfillment metadata through the locking service", async () => {
    const fulfillment = {
      id: "ful_1",
      data: {
        shipit_id: 123,
        shipit_order_id: "order_1",
        shipit_reference: "TEST-reference",
        shipit_status: "pending",
        shipit_courier_status: "in_transit",
        shipit_tracking_number: "TRACK-123",
        shipit_updated_at: "2026-09-15T12:00:00.000Z",
        shipit_sandbox: true,
      },
    };

    const retrieveFulfillment = jest.fn().mockResolvedValue(fulfillment);

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    );

    const listShipitShipments = jest.fn().mockResolvedValue([]);
    const createShipitShipments = jest.fn().mockResolvedValue({
      id: "shs_1",
    });

    const resolve = jest.fn((key: string) => {
      if (key === Modules.FULFILLMENT) {
        return { retrieveFulfillment };
      }

      if (key === Modules.LOCKING) {
        return { execute };
      }

      if (key === SHIPIT_MODULE) {
        return {
          listShipitShipments,
          createShipitShipments,
        };
      }

      throw new Error(`Unexpected resolve key: ${key}`);
    });

    await persistShipitFulfillment({
      event: {
        name: "order.fulfillment_created",
        data: {
          order_id: "order_1",
          fulfillment_id: "ful_1",
          no_notification: false,
        },
      },
      container: { resolve },
    } as never);

    expect(retrieveFulfillment).toHaveBeenCalledWith("ful_1");

    expect(execute).toHaveBeenCalledWith(
      "shipit:shipment-persist:ful_1",
      expect.any(Function),
    );

    expect(listShipitShipments).toHaveBeenNthCalledWith(1, {
      fulfillment_id: "ful_1",
    });
    expect(listShipitShipments).toHaveBeenNthCalledWith(2, {
      shipit_id: 123,
    });
    expect(listShipitShipments).toHaveBeenNthCalledWith(3, {
      reference: "TEST-reference",
    });

    expect(createShipitShipments).toHaveBeenCalledWith({
      fulfillment_id: "ful_1",
      order_id: "order_1",
      shipit_id: 123,
      reference: "TEST-reference",
      status: "pending",
      courier_status: "in_transit",
      tracking_number: "TRACK-123",
      shipit_created_at: null,
      shipit_updated_at: new Date("2026-09-15T12:00:00.000Z"),
      sandbox: true,
    });
  });

  it("ignores fulfillments without Shipit metadata", async () => {
    const retrieveFulfillment = jest.fn().mockResolvedValue({
      id: "ful_manual",
      data: {},
    });

    const resolve = jest.fn((key: string) => {
      if (key === Modules.FULFILLMENT) {
        return { retrieveFulfillment };
      }

      throw new Error(`Unexpected resolve key: ${key}`);
    });

    await persistShipitFulfillment({
      event: {
        name: "order.fulfillment_created",
        data: {
          order_id: "order_manual",
          fulfillment_id: "ful_manual",
          no_notification: false,
        },
      },
      container: { resolve },
    } as never);

    expect(retrieveFulfillment).toHaveBeenCalledWith("ful_manual");
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith(Modules.FULFILLMENT);
  });
});
