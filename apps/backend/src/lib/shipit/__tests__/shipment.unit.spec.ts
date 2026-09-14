import type { ShipitConfiguration } from "../../env";
import { ShipitError } from "../errors";
import {
  createIdempotentShipitShipment,
  createShipitReference,
  splitBranchOfficeAddress,
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
  reference: createShipitReference(order.id, true),
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

  it("uses TEST- references in sandbox mode", () => {
    const reference = createShipitReference(
      order.id,
      true,
    );

    expect(reference).toHaveLength(15);
    expect(reference).toMatch(/^TEST-[a-f0-9]{10}$/);
    expect(reference).toBe(
      createShipitReference(order.id, true),
    );
  });

  it("keeps production references free of the TEST prefix", () => {
    const reference = createShipitReference(
      order.id,
      false,
    );

    expect(reference).toHaveLength(15);
    expect(reference).toMatch(/^I[a-f0-9]{14}$/);
    expect(reference.startsWith("TEST-")).toBe(false);
  });

  it("splits a Chilean street address from its number", () => {
    expect(splitStreetAndNumber("Barros Arana 1234")).toEqual({
      street: "Barros Arana",
      number: "1234",
    });
  });

  it("parses Shipit's branch-office address with local information", () => {
    expect(
      splitBranchOfficeAddress(
        "maipu - 583 - local 1",
      ),
    ).toEqual({
      street: "maipu",
      number: "583",
    });
  });

  it("parses Shipit's branch-office address with a trailing separator", () => {
    expect(
      splitBranchOfficeAddress(
        "avenida espana - 12 -",
      ),
    ).toEqual({
      street: "avenida espana",
      number: "12",
    });
  });

  it("also accepts a conventional branch-office address", () => {
    expect(
      splitBranchOfficeAddress(
        "Colo Colo 430",
      ),
    ).toEqual({
      street: "Colo Colo",
      number: "430",
    });
  });

  it("reuses an existing shipment without issuing a POST", async () => {
    const createShipment = jest.fn();
    const result = await createIdempotentShipitShipment({
      api: {
        shipmentByReference: jest.fn().mockResolvedValue(shipment),
        createShipment,
      },
      prices: {
        couriers: jest.fn(),
        branchOffices: jest.fn(),
      },
      configuration,
      data,
      order,
    });

    expect(result).toBe(shipment);
    expect(createShipment).not.toHaveBeenCalled();
  });

  it("creates a branch-office shipment with the canonical Shipit branch", async () => {
    const createShipment =
      jest.fn().mockResolvedValue(shipment);

    await createIdempotentShipitShipment({
      api: {
        shipmentByReference: jest
          .fn()
          .mockRejectedValue(new ShipitError("REQUEST_FAILED", "not found", 404)),
        createShipment,
      },
      prices: {
        couriers: jest.fn().mockResolvedValue([
          {
            id: 7,
            name: "Chilexpress",
            available_to_ship: true,
          },
        ]),
        branchOffices: jest.fn().mockResolvedValue([
          {
            id: 940,
            address: "maipu - 583 - local 1",
            commune_id: 146,
            courier_bo_id: "CXP-940",
            courier_id: 7,
            name: "Concepcion Maipu Dos",
          },
        ]),
      },
      configuration,
      data: {
        ...data,
        destination_kind:
          "courier_branch_office",
        courier_id: 7,
        branch_office_id: 940,

        /*
         * Estos datos descriptivos no deben tener autoridad.
         * El shipment debe reconstruirlos desde Shipit.
         */
        branch_office_name: "MANIPULADO",
        branch_office_address: "FALSO 999",
      },
      order,
    });

    expect(createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: createShipitReference(order.id, true),
        destiny: expect.objectContaining({
          kind: "courier_branch_office",
          courier_branch_office_id: 940,
          street: "maipu",
          number: "583",
          complement: "Concepcion Maipu Dos",
          commune_id: 146,
        }),
        courier: expect.objectContaining({
          id: 7,
          client: "Chilexpress",
        }),
      }),
    );
  });

  it("rejects a branch-office shipment when the selected branch is not in Shipit", async () => {
    const createShipment = jest.fn();

    await expect(
      createIdempotentShipitShipment({
        api: {
          shipmentByReference: jest
            .fn()
            .mockRejectedValue(
              new ShipitError("REQUEST_FAILED", "not found", 404),
            ),
          createShipment,
        },
        prices: {
          couriers: jest.fn().mockResolvedValue([
            {
              id: 7,
              name: "Chilexpress",
              available_to_ship: true,
            },
          ]),
          branchOffices: jest
            .fn()
            .mockResolvedValue([]),
        },
        configuration,
        data: {
          ...data,
          destination_kind:
            "courier_branch_office",
          courier_id: 7,
          branch_office_id: 940,
        },
        order,
      }),
    ).rejects.toThrow(
      "Quoted Shipit branch office is unavailable",
    );

    expect(createShipment).not.toHaveBeenCalled();
  });

  it("creates a sandbox shipment with the quoted courier", async () => {
    const createShipment = jest.fn().mockResolvedValue(shipment);
    await createIdempotentShipitShipment({
      api: {
        shipmentByReference: jest
          .fn()
          .mockRejectedValue(new ShipitError("REQUEST_FAILED", "not found", 404)),
        createShipment,
      },
      prices: {
        couriers: jest
          .fn()
          .mockResolvedValue([
            {
              id: 7,
              name: "Chilexpress",
              available_to_ship: true,
            },
          ]),
        branchOffices: jest.fn(),
      },
      configuration,
      data,
      order,
    });

    expect(createShipment).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: createShipitReference(order.id, true),
        sandbox: true,
        courier: expect.objectContaining({ id: 7 }),
      }),
    );
  });


  it("reconciles an ambiguous shipment creation by reference without a second POST", async () => {
    const lookup404 = new ShipitError(
      "REQUEST_FAILED",
      "not found",
      404,
    );
    const creationError = new ShipitError(
      "TIMEOUT",
      "Shipit shipment creation timed out",
    );

    const shipmentByReference = jest
      .fn()
      .mockRejectedValueOnce(lookup404)
      .mockResolvedValueOnce(shipment);

    const createShipment = jest
      .fn()
      .mockRejectedValueOnce(creationError);

    const result = await createIdempotentShipitShipment({
      api: {
        shipmentByReference,
        createShipment,
      },
      prices: {
        couriers: jest.fn().mockResolvedValue([
          {
            id: 7,
            name: "Chilexpress",
            available_to_ship: true,
          },
        ]),
        branchOffices: jest.fn(),
      },
      configuration,
      data,
      order,
    });

    expect(result).toBe(shipment);
    expect(shipmentByReference).toHaveBeenCalledTimes(2);
    expect(createShipment).toHaveBeenCalledTimes(1);
  });

  it("rethrows the creation error when reconciliation cannot confirm the shipment", async () => {
    const lookup404 = new ShipitError(
      "REQUEST_FAILED",
      "not found",
      404,
    );
    const creationError = new ShipitError(
      "TIMEOUT",
      "Shipit shipment creation timed out",
    );
    const reconciliationError = new ShipitError(
      "TIMEOUT",
      "Shipit reconciliation timed out",
    );

    const shipmentByReference = jest
      .fn()
      .mockRejectedValueOnce(lookup404)
      .mockRejectedValueOnce(reconciliationError);

    const createShipment = jest
      .fn()
      .mockRejectedValueOnce(creationError);

    await expect(
      createIdempotentShipitShipment({
        api: {
          shipmentByReference,
          createShipment,
        },
        prices: {
          couriers: jest.fn().mockResolvedValue([
            {
              id: 7,
              name: "Chilexpress",
              available_to_ship: true,
            },
          ]),
          branchOffices: jest.fn(),
        },
        configuration,
        data,
        order,
      }),
    ).rejects.toBe(creationError);

    expect(shipmentByReference).toHaveBeenCalledTimes(2);
    expect(createShipment).toHaveBeenCalledTimes(1);
  });
  it.each([
    [
      "timeout",
      new ShipitError("TIMEOUT", "Shipit request timed out"),
    ],
    [
      "401",
      new ShipitError(
        "REQUEST_FAILED",
        "Shipit request failed with status 401",
        401,
      ),
    ],
    [
      "403",
      new ShipitError(
        "REQUEST_FAILED",
        "Shipit request failed with status 403",
        403,
      ),
    ],
    [
      "503",
      new ShipitError(
        "REQUEST_FAILED",
        "Shipit request failed with status 503",
        503,
      ),
    ],
    [
      "invalid response",
      new ShipitError(
        "INVALID_RESPONSE",
        "Invalid Shipit response",
      ),
    ],
  ])(
    "does not create a shipment when the initial lookup fails: %s",
    async (_label, lookupError) => {
      const createShipment = jest.fn();
      const couriers = jest.fn();
      const branchOffices = jest.fn();

      await expect(
        createIdempotentShipitShipment({
          api: {
            shipmentByReference: jest
              .fn()
              .mockRejectedValue(lookupError),
            createShipment,
          },
          prices: {
            couriers,
            branchOffices,
          },
          configuration,
          data,
          order,
        }),
      ).rejects.toBe(lookupError);

      expect(createShipment).not.toHaveBeenCalled();
      expect(couriers).not.toHaveBeenCalled();
      expect(branchOffices).not.toHaveBeenCalled();
    },
  );
});
