import {
  ensureShipitFulfillment,
  type EnsureShipitFulfillmentResult,
} from "../ensure-fulfillment";

describe("ensureShipitFulfillment", () => {
  it("creates a Shipit fulfillment when none exists", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const loadOrder = jest.fn().mockResolvedValue({
      id: "order_1",
      items: [{ id: "item_1", quantity: 2 }],
      fulfillments: [],
      shipping_methods: [
        {
          shipping_option: {
            provider_id: "shipit_shipit",
          },
        },
      ],
    });

    const createFulfillment = jest.fn().mockResolvedValue({
      id: "ful_1",
    });

    const result = await ensureShipitFulfillment(
      {
        lockingService: { execute },
        loadOrder,
        createFulfillment,
      },
      "order_1",
    );

    expect(execute).toHaveBeenCalledWith(
      "shipit:fulfillment:order_1",
      expect.any(Function),
    );
    expect(createFulfillment).toHaveBeenCalledWith({
      order_id: "order_1",
      items: [{ id: "item_1", quantity: 2 }],
    });
    expect(result).toEqual({
      status: "created",
      fulfillment_id: "ful_1",
    });
  });

  it("returns an existing Shipit fulfillment without creating another", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const loadOrder = jest.fn().mockResolvedValue({
      id: "order_1",
      items: [{ id: "item_1", quantity: 1 }],
      fulfillments: [
        {
          id: "ful_existing",
          provider_id: "shipit_shipit",
        },
      ],
    });

    const createFulfillment = jest.fn();

    const result = await ensureShipitFulfillment(
      {
        lockingService: { execute },
        loadOrder,
        createFulfillment,
      },
      "order_1",
    );

    expect(createFulfillment).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "existing",
      fulfillment_id: "ful_existing",
    });
  });

  it("fails closed when the order does not exist", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    await expect(
      ensureShipitFulfillment(
        {
          lockingService: { execute },
          loadOrder: jest.fn().mockResolvedValue(undefined),
          createFulfillment: jest.fn(),
        },
        "order_missing",
      ),
    ).rejects.toThrow("Shipit order not found: order_missing");
  });

  it("fails closed when the order has no valid fulfillable items", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    await expect(
      ensureShipitFulfillment(
        {
          lockingService: { execute },
          loadOrder: jest.fn().mockResolvedValue({
            id: "order_1",
            items: [{ id: "", quantity: 0 }],
            fulfillments: [],
            shipping_methods: [
              {
                shipping_option: {
                  provider_id: "shipit_shipit",
                },
              },
            ],
          }),
          createFulfillment,
        },
        "order_1",
      ),
    ).rejects.toThrow("Shipit order has no fulfillable items: order_1");

    expect(createFulfillment).not.toHaveBeenCalled();
  });

  it("fails closed when another fulfillment already exists", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    await expect(
      ensureShipitFulfillment(
        {
          lockingService: { execute },
          loadOrder: jest.fn().mockResolvedValue({
            id: "order_1",
            items: [
              {
                id: "item_1",
                quantity: 2,
                fulfilled_quantity: 0,
              },
            ],
            fulfillments: [
              {
                id: "ful_other",
                provider_id: "manual_manual",
              },
            ],
            shipping_methods: [
              {
                shipping_option: {
                  provider_id: "shipit_shipit",
                },
              },
            ],
          }),
          createFulfillment,
        },
        "order_1",
      ),
    ).rejects.toThrow(
      "Shipit order already has a non-Shipit fulfillment: order_1",
    );

    expect(createFulfillment).not.toHaveBeenCalled();
  });

  it("fails closed when an item is already partially fulfilled", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    await expect(
      ensureShipitFulfillment(
        {
          lockingService: { execute },
          loadOrder: jest.fn().mockResolvedValue({
            id: "order_1",
            items: [
              {
                id: "item_1",
                quantity: 2,
                fulfilled_quantity: 1,
              },
            ],
            fulfillments: [],
            shipping_methods: [
              {
                shipping_option: {
                  provider_id: "shipit_shipit",
                },
              },
            ],
          }),
          createFulfillment,
        },
        "order_1",
      ),
    ).rejects.toThrow(
      "Shipit order is already partially fulfilled: order_1",
    );

    expect(createFulfillment).not.toHaveBeenCalled();
  });
  it("skips when the order has no shipping method", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    const result = await ensureShipitFulfillment(
      {
        lockingService: { execute },
        loadOrder: jest.fn().mockResolvedValue({
          id: "order_1",
          items: [{ id: "item_1", quantity: 1 }],
          fulfillments: [],
        }),
        createFulfillment,
      },
      "order_1",
    );

    expect(result).toEqual({
      status: "skipped",
      reason: "no_shipping_method",
    });
    expect(createFulfillment).not.toHaveBeenCalled();
  });

  it("skips when the shipping method is not Shipit", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    const result = await ensureShipitFulfillment(
      {
        lockingService: { execute },
        loadOrder: jest.fn().mockResolvedValue({
          id: "order_1",
          items: [{ id: "item_1", quantity: 1 }],
          fulfillments: [],
          shipping_methods: [
            {
              shipping_option: {
                provider_id: "manual_manual",
              },
            },
          ],
        }),
        createFulfillment,
      },
      "order_1",
    );

    expect(result).toEqual({
      status: "skipped",
      reason: "non_shipit_shipping_method",
    });
    expect(createFulfillment).not.toHaveBeenCalled();
  });

  it("fails closed when the order has multiple shipping methods", async () => {
    const execute = jest.fn(
      async (
        _key: string,
        callback: () => Promise<EnsureShipitFulfillmentResult>,
      ): Promise<EnsureShipitFulfillmentResult> => callback(),
    );

    const createFulfillment = jest.fn();

    await expect(
      ensureShipitFulfillment(
        {
          lockingService: { execute },
          loadOrder: jest.fn().mockResolvedValue({
            id: "order_1",
            items: [{ id: "item_1", quantity: 1 }],
            fulfillments: [],
            shipping_methods: [
              {
                shipping_option: {
                  provider_id: "shipit_shipit",
                },
              },
              {
                shipping_option: {
                  provider_id: "shipit_shipit",
                },
              },
            ],
          }),
          createFulfillment,
        },
        "order_1",
      ),
    ).rejects.toThrow(
      "Shipit order has ambiguous shipping methods: order_1",
    );

    expect(createFulfillment).not.toHaveBeenCalled();
  });});