import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../../lib/env";
import { SHIPIT_MODULE } from "../../../../modules/shipit";
import { POST, PUT } from "../route";

jest.mock("../../../../lib/env", () => ({
  validateBackendEnvironment: jest.fn(),
}));

const validateEnvironment = validateBackendEnvironment as jest.Mock;

function response() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);

  return res;
}

function request(input: {
  authorization?: string;
  body?: Record<string, unknown>;
  listShipitShipments?: jest.Mock;
  updateShipitShipments?: jest.Mock;
}) {
  const listShipitShipments =
    input.listShipitShipments ?? jest.fn().mockResolvedValue([]);
  const updateShipitShipments =
    input.updateShipitShipments ?? jest.fn().mockResolvedValue(undefined);

  const resolve = jest.fn((key: string) => {
    if (key === SHIPIT_MODULE) {
      return {
        listShipitShipments,
        updateShipitShipments,
      };
    }

    throw new Error(`Unexpected resolve key: ${key}`);
  });

  return {
    req: {
      headers: {
        authorization: input.authorization,
      },
      body: input.body ?? {},
      scope: { resolve },
    } as unknown as MedusaRequest,
    listShipitShipments,
    updateShipitShipments,
    resolve,
  };
}

const payload = {
  id: 123,
  reference: "TEST-reference",
  status: "in_transit",
  courier_status: "on_route",
  tracking_number: "TRACK-123",
  updated_at: "2026-09-15T12:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();

  validateEnvironment.mockReturnValue({
    SHIPIT: {
      webhookToken: "secret",
    },
  });
});

describe("Shipit webhook route", () => {
  it("rejects an invalid Bearer token before resolving the Shipit module", async () => {
    const { req, resolve } = request({
      authorization: "Bearer wrong",
      body: payload,
    });
    const res = response();

    await POST(req, res as unknown as MedusaResponse);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unauthorized",
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it("acknowledges an unknown shipment without mutating local state", async () => {
    const { req, updateShipitShipments } = request({
      authorization: "Bearer secret",
      body: payload,
      listShipitShipments: jest.fn().mockResolvedValue([]),
    });
    const res = response();

    await POST(req, res as unknown as MedusaResponse);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(updateShipitShipments).not.toHaveBeenCalled();
  });

  it("acknowledges a reference with a mismatched Shipit id without mutation", async () => {
    const { req, updateShipitShipments } = request({
      authorization: "Bearer secret",
      body: payload,
      listShipitShipments: jest.fn().mockResolvedValue([
        {
          id: "shs_1",
          shipit_id: 999,
          shipit_updated_at: new Date(
            "2026-09-15T11:00:00.000Z",
          ),
        },
      ]),
    });
    const res = response();

    await POST(req, res as unknown as MedusaResponse);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(updateShipitShipments).not.toHaveBeenCalled();
  });

  it("updates a matching shipment when the webhook is newer", async () => {
    const listShipitShipments = jest.fn().mockResolvedValue([
      {
        id: "shs_1",
        shipit_id: 123,
        shipit_updated_at: new Date(
          "2026-09-15T11:00:00.000Z",
        ),
      },
    ]);

    const { req, updateShipitShipments } = request({
      authorization: "Bearer secret",
      body: payload,
      listShipitShipments,
    });
    const res = response();

    await POST(req, res as unknown as MedusaResponse);

    expect(listShipitShipments).toHaveBeenCalledWith({
      reference: "TEST-reference",
    });
    expect(updateShipitShipments).toHaveBeenCalledWith({
      id: "shs_1",
      status: "in_transit",
      courier_status: "on_route",
      tracking_number: "TRACK-123",
      shipit_updated_at: new Date(
        "2026-09-15T12:00:00.000Z",
      ),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("does not let an older webhook overwrite newer local state", async () => {
    const { req, updateShipitShipments } = request({
      authorization: "Bearer secret",
      body: payload,
      listShipitShipments: jest.fn().mockResolvedValue([
        {
          id: "shs_1",
          shipit_id: 123,
          shipit_updated_at: new Date(
            "2026-09-15T13:00:00.000Z",
          ),
        },
      ]),
    });
    const res = response();

    await POST(req, res as unknown as MedusaResponse);

    expect(updateShipitShipments).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("uses the same handler behavior for PUT", async () => {
    const { req, updateShipitShipments } = request({
      authorization: "Bearer secret",
      body: payload,
      listShipitShipments: jest.fn().mockResolvedValue([
        {
          id: "shs_1",
          shipit_id: 123,
          shipit_updated_at: new Date(
            "2026-09-15T11:00:00.000Z",
          ),
        },
      ]),
    });
    const res = response();

    await PUT(req, res as unknown as MedusaResponse);

    expect(updateShipitShipments).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
