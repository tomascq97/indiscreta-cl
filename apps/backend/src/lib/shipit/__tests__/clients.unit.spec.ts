import { ShipitApiClient } from "../clients";
import { ShipitError } from "../errors";
import { ShipitHttpClient } from "../http-client";
import type { ShipitConfiguration } from "../../env";

const configuration = {
  enabled: true,
  shipmentCreationEnabled: true,
  sandbox: true,
  apiBaseUrl: "https://api.shipit.cl",
  pricesBaseUrl: "https://prices.shipit.cl",
  trackingBaseUrl: "https://courierstatus.shipit.cl",
  email: "test@example.invalid",
  accessToken: "secret",
  timeoutMs: 5000,
  readMaxRetries: 1,
  originCommuneId: 146,
  quoteMaxAgeSeconds: 900,
  catalogCacheTtlSeconds: 21600,
  ratesAreNet: true,
} as ShipitConfiguration;

describe("ShipitApiClient shipment lookup negotiation", () => {
  it("uses the vendor representation first and returns an existing shipment without fallback", async () => {
    const shipment = {
      id: 8931636,
      reference: "TEST-existing01",
      status: "created",
    };

    const request = jest.fn().mockResolvedValue({
      shipments: [shipment],
    });

    const http = { request } as unknown as ShipitHttpClient;
    const client = new ShipitApiClient(configuration, http);

    await expect(
      client.shipmentByReference("TEST-existing01"),
    ).resolves.toBe(shipment);

    expect(request).toHaveBeenCalledTimes(1);

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        baseUrl: configuration.apiBaseUrl,
        path: "/v/shipments/reference/TEST-existing01",
      }),
    );

    expect(request.mock.calls[0][0]).not.toHaveProperty("accept");
  });

  it("probes application/json only after an exact vendor 400 and preserves the resulting 404", async () => {
    const vendor400 = new ShipitError(
      "REQUEST_FAILED",
      "Shipit request failed with status 400",
      400,
    );

    const json404 = new ShipitError(
      "REQUEST_FAILED",
      "Shipit request failed with status 404",
      404,
    );

    const request = jest
      .fn()
      .mockRejectedValueOnce(vendor400)
      .mockRejectedValueOnce(json404);

    const http = { request } as unknown as ShipitHttpClient;
    const client = new ShipitApiClient(configuration, http);

    await expect(
      client.shipmentByReference("TEST-missing0001"),
    ).rejects.toBe(json404);

    expect(request).toHaveBeenCalledTimes(2);

    expect(request.mock.calls[0][0]).not.toHaveProperty("accept");

    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: "/v/shipments/reference/TEST-missing0001",
        accept: "application/json",
      }),
    );
  });

  it.each([
    ["timeout", new ShipitError("TIMEOUT", "timeout")],
    [
      "401",
      new ShipitError(
        "REQUEST_FAILED",
        "unauthorized",
        401,
      ),
    ],
    [
      "403",
      new ShipitError(
        "REQUEST_FAILED",
        "forbidden",
        403,
      ),
    ],
    [
      "503",
      new ShipitError(
        "REQUEST_FAILED",
        "unavailable",
        503,
      ),
    ],
    [
      "invalid response",
      new ShipitError(
        "INVALID_RESPONSE",
        "invalid",
      ),
    ],
  ])(
    "does not perform the JSON fallback for %s",
    async (_label, lookupError) => {
      const request = jest.fn().mockRejectedValue(lookupError);

      const http = { request } as unknown as ShipitHttpClient;
      const client = new ShipitApiClient(configuration, http);

      await expect(
        client.shipmentByReference("TEST-failclosed1"),
      ).rejects.toBe(lookupError);

      expect(request).toHaveBeenCalledTimes(1);
    },
  );
});