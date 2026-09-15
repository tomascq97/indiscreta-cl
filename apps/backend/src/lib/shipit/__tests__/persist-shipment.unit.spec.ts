import {
  persistShipitShipmentIdempotently,
  type ShipitShipmentPersistenceInput,
} from "../persist-shipment";

const input: ShipitShipmentPersistenceInput = {
  fulfillment_id: "ful_1",
  order_id: "order_1",
  shipit_id: 123,
  reference: "TEST-reference",
  status: "pending",
  courier_status: null,
  tracking_number: null,
  shipit_created_at: null,
  shipit_updated_at: new Date("2026-09-15T12:00:00.000Z"),
  sandbox: true,
};

describe("persistShipitShipmentIdempotently", () => {
  it("creates the local shipment when no identity already exists", async () => {
    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    ) as jest.MockedFunction<
      <T>(key: string, callback: () => Promise<T>) => Promise<T>
    >;
    const listShipments = jest.fn().mockResolvedValue([]);
    const createShipment = jest.fn().mockResolvedValue({
      id: "shs_1",
    });

    const result = await persistShipitShipmentIdempotently(
      {
        lockingService: { execute },
        listShipments,
        createShipment,
      },
      input,
    );

    expect(execute).toHaveBeenCalledWith(
      "shipit:shipment-persist:ful_1",
      expect.any(Function),
    );
    expect(listShipments).toHaveBeenNthCalledWith(1, {
      fulfillment_id: "ful_1",
    });
    expect(listShipments).toHaveBeenNthCalledWith(2, {
      shipit_id: 123,
    });
    expect(listShipments).toHaveBeenNthCalledWith(3, {
      reference: "TEST-reference",
    });
    expect(createShipment).toHaveBeenCalledTimes(1);
    expect(createShipment).toHaveBeenCalledWith(input);
    expect(result).toEqual({ status: "created" });
  });

  it("treats an identical existing shipment as an idempotent redelivery", async () => {
    const existing = {
      id: "shs_1",
      fulfillment_id: "ful_1",
      shipit_id: 123,
      reference: "TEST-reference",
    };

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    ) as jest.MockedFunction<
      <T>(key: string, callback: () => Promise<T>) => Promise<T>
    >;
    const listShipments = jest
      .fn()
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([existing]);
    const createShipment = jest.fn();

    const result = await persistShipitShipmentIdempotently(
      {
        lockingService: { execute },
        listShipments,
        createShipment,
      },
      input,
    );

    expect(createShipment).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "existing",
      shipment_id: "shs_1",
    });
  });

  it("reuses a matching shipment found by only one unique identity", async () => {
    const existing = {
      id: "shs_1",
      fulfillment_id: "ful_1",
      shipit_id: 123,
      reference: "TEST-reference",
    };

    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    ) as jest.MockedFunction<
      <T>(key: string, callback: () => Promise<T>) => Promise<T>
    >;

    const listShipments = jest
      .fn()
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const createShipment = jest.fn();

    const result = await persistShipitShipmentIdempotently(
      {
        lockingService: { execute },
        listShipments,
        createShipment,
      },
      input,
    );

    expect(createShipment).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "existing",
      shipment_id: "shs_1",
    });
  });
  it("rejects conflicting shipment identities", async () => {
    const execute = jest.fn(
      async (_key: string, callback: () => Promise<unknown>) =>
        callback(),
    ) as jest.MockedFunction<
      <T>(key: string, callback: () => Promise<T>) => Promise<T>
    >;
    const listShipments = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "shs_1",
          fulfillment_id: "ful_1",
          shipit_id: 123,
          reference: "TEST-reference",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "shs_2",
          fulfillment_id: "ful_2",
          shipit_id: 123,
          reference: "TEST-other",
        },
      ])
      .mockResolvedValueOnce([]);
    const createShipment = jest.fn();

    await expect(
      persistShipitShipmentIdempotently(
        {
          lockingService: { execute },
          listShipments,
          createShipment,
        },
        input,
      ),
    ).rejects.toThrow(
      "Conflicting Shipit shipment identity for fulfillment ful_1",
    );

    expect(createShipment).not.toHaveBeenCalled();
  });
});
