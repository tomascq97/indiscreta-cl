const run = jest.fn();

jest.mock("@medusajs/medusa/core-flows", () => ({
  createOrderFulfillmentWorkflow: jest.fn(() => ({
    run,
  })),
}));

import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows";

import { ensureMedusaShipitFulfillment } from "../ensure-medusa-fulfillment";

describe("ensureMedusaShipitFulfillment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the order and creates a Medusa fulfillment", async () => {
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "order_1",
          items: [
            {
              id: "item_1",
              detail: {
                quantity: 2,
                fulfilled_quantity: 0,
              },
            },
          ],
          fulfillments: [],
          shipping_methods: [
            {
              data: {
                provider_id: "shipit_shipit",
              },
            },
          ],
        },
      ],
    });

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    );

    const resolve = jest.fn((key: string) => {
      if (key === Modules.LOCKING) {
        return { execute };
      }

      if (key === ContainerRegistrationKeys.QUERY) {
        return { graph };
      }

      throw new Error(`Unexpected resolve key: ${key}`);
    });

    run.mockResolvedValue({
      result: {
        id: "ful_1",
      },
    });

    const result = await ensureMedusaShipitFulfillment(
      { resolve } as never,
      "order_1",
    );

    expect(graph).toHaveBeenCalledWith({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "items.quantity",
        "items.fulfilled_quantity",
        "items.detail.quantity",
        "items.detail.fulfilled_quantity",
        "fulfillments.id",
        "fulfillments.provider_id",
        "shipping_methods.shipping_option.provider_id",
        "shipping_methods.data.provider_id",
      ],
      filters: { id: "order_1" },
    });

    expect(createOrderFulfillmentWorkflow).toHaveBeenCalledTimes(1);

    expect(run).toHaveBeenCalledWith({
      input: {
        order_id: "order_1",
        items: [
          {
            id: "item_1",
            quantity: 2,
          },
        ],
      },
    });

    expect(result).toEqual({
      status: "created",
      fulfillment_id: "ful_1",
    });
  });

  it("does not create another fulfillment when Shipit already exists", async () => {
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "order_1",
          items: [
            {
              id: "item_1",
              quantity: 1,
              fulfilled_quantity: 1,
            },
          ],
          fulfillments: [
            {
              id: "ful_existing",
              provider_id: "shipit_shipit",
            },
          ],
        },
      ],
    });

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    );

    const resolve = jest.fn((key: string) => {
      if (key === Modules.LOCKING) {
        return { execute };
      }

      if (key === ContainerRegistrationKeys.QUERY) {
        return { graph };
      }

      throw new Error(`Unexpected resolve key: ${key}`);
    });

    const result = await ensureMedusaShipitFulfillment(
      { resolve } as never,
      "order_1",
    );

    expect(createOrderFulfillmentWorkflow).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: "existing",
      fulfillment_id: "ful_existing",
    });
  });

  it("skips Medusa fulfillment when the order shipping provider is not Shipit", async () => {
    const graph = jest.fn().mockResolvedValue({
      data: [
        {
          id: "order_1",
          items: [
            {
              id: "item_1",
              quantity: 1,
              fulfilled_quantity: 0,
            },
          ],
          fulfillments: [],
          shipping_methods: [
            {
              shipping_option: {
                provider_id: "manual_manual",
              },
            },
          ],
        },
      ],
    });

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    );

    const resolve = jest.fn((key: string) => {
      if (key === Modules.LOCKING) {
        return { execute };
      }

      if (key === ContainerRegistrationKeys.QUERY) {
        return { graph };
      }

      throw new Error(`Unexpected resolve key: ${key}`);
    });

    const result = await ensureMedusaShipitFulfillment(
      { resolve } as never,
      "order_1",
    );

    expect(createOrderFulfillmentWorkflow).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();

    expect(result).toEqual({
      status: "skipped",
      reason: "non_shipit_shipping_method",
    });
  });});
