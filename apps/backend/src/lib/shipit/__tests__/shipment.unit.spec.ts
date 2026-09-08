import type { ShipitConfiguration } from "../../env";
import {
  createIdempotentShipitShipment,
  createShipitReference,
  splitStreetAndNumber,
} from "../shipment";

const configuration = {
  enabled: true,
  shipmentCreationEnabled: true,
  sandbox: true,
} as ShipitConfiguration;

const order = {
  id: "order_01TEST",
  email: "buyer@example.invalid",
  shipping_address: {
    first_name: "Ada",
    last_name: "Lovelace",
    address_1: "Barros Arana 1234",
    address_2: "Depto 5",
    phone: "+56911111111",
  },
};

const data = {
  courier: "Chilexpress",
  destination_commune_id: 146,
  destination_commune_name: "CONCEPCION",
  parcel: {
    length_cm: 20,
    width_cm: 15,
    height_cm: 5,
    weight_kg: 0.5,
    items: 1,
  },
};

const shipment = {
  id: 123,
  reference: createShipitReference(order.id),
  status: "in_preparation",
  tracking_number: null,
  courier_status: null,
  created_at: "2026-09-07T10:00:00Z",
  updated_at: "2026-09-07T10:00:00Z",
};

describe("Shipit shipment creation", () => {
  it("creates stable references within Shipit's 15 character limit", () => {
    expect(createShipitReference(order.id)).toHaveLength(15);
    expect(createShipitReference(order.id)).toBe(
      createShipitReference(order.id),
    );
  });

  it("splits a Chilean street address from its number", () => {
    expect(splitStreetAndNumber("Barros Arana 1234")).toEqual({
      street: "Barros Arana",
      number: "1234",
    });
  });

  it("reuses an existing shipment without issuing a POST", async () => {
    const createShipment = jest.fn();
    const result = await createIdempotentShipitShipment({
      api: {
        shipmentByReference: jest.fn().mockResolvedValue(shipment),
        createShipment,
      },
      prices: { couriers: jest.fn() },
      configuration,
      data,
      order,
    });

    expect(result).toBe(shipment);
    expect(createShipment).not.toHaveBeenCalled();
  });

  it("creates a sandbox shipment with the quoted courier", async () => {
    const createShipment = jest.fn().mockResolvedValue(shipment);
    await createIdempotentShipitShipment({
      api: {
        shipmentByReference: jest
          .fn()
          .mockRejectedValue(new Error("not found")),
        createShipment,
      },
      prices: {
        couriers: jest
          .fn()
          .mockResolvedValue([
            { id: 7, name: "Chilexpress", available_to_ship: true },
          ]),
      },
      configuration,
      data,
      order,
    });

    expect(createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: createShipitReference(order.id),
        sandbox: true,
        courier: expect.objectContaining({ id: 7 }),
      }),
    );
  });
});
