import { z } from "@medusajs/framework/zod";

import type { ShipitConfiguration } from "../../env";
import { shipitRateRequestSchema } from "../contracts";
import { ShipitApiClient } from "../clients";
import { ShipitError } from "../errors";
import { ShipitHttpClient } from "../http-client";
import { sanitizeShipitValue } from "../sanitize";

const configuration: ShipitConfiguration = {
  enabled: true,
  shipmentCreationEnabled: false,
  sandbox: true,
  apiBaseUrl: "https://api.shipit.cl",
  pricesBaseUrl: "https://prices.shipit.cl",
  trackingBaseUrl: "https://courierstatus.shipit.cl",
  email: "account@example.invalid",
  accessToken: "private-token",
  timeoutMs: 1_000,
  readMaxRetries: 1,
  originCommuneId: 308,
  quoteMaxAgeSeconds: 900,
  catalogCacheTtlSeconds: 21_600,
  ratesAreNet: true,
};

describe("Shipit B1 core", () => {
  it("validates explicit Shipit parcel units", () => {
    expect(
      shipitRateRequestSchema.parse({
        parcel: {
          length: 10,
          height: 5,
          width: 4,
          weight: 0.5,
          origin_id: 308,
          destiny_id: 410,
          type_of_destiny: "domicilio",
        },
      }).parcel.weight,
    ).toBe(0.5);
    expect(() =>
      shipitRateRequestSchema.parse({ parcel: { weight: -1 } }),
    ).toThrow();
  });

  it("redacts credentials and recipient PII recursively", () => {
    expect(
      sanitizeShipitValue({
        authorization: "Bearer secret",
        destiny: { full_name: "Person", phone: "123", safe: "ok" },
      }),
    ).toEqual({
      authorization: "[REDACTED]",
      destiny: {
        full_name: "[REDACTED]",
        phone: "[REDACTED]",
        safe: "ok",
      },
    });
  });

  it("sends v4 credentials only to an allowlisted Shipit URL", async () => {
    const fetcher = jest.fn(async (_url: URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Accept: "application/vnd.shipit.v4",
        "X-Shipit-Email": configuration.email,
        "X-Shipit-Access-Token": configuration.accessToken,
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
    const client = new ShipitHttpClient(configuration, fetcher);
    await expect(
      client.request({
        baseUrl: configuration.apiBaseUrl,
        path: "/v/example",
        schema: z.object({ ok: z.boolean() }),
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects untrusted origins before sending credentials", async () => {
    const fetcher = jest.fn() as unknown as typeof fetch;
    const client = new ShipitHttpClient(configuration, fetcher);
    await expect(
      client.request({
        baseUrl: "https://attacker.invalid",
        path: "/v/rates",
        schema: z.unknown(),
      }),
    ).rejects.toMatchObject<Partial<ShipitError>>({
      code: "CONFIGURATION_ERROR",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not leak credentials in transport failures", async () => {
    const client = new ShipitHttpClient(
      configuration,
      jest.fn(async () => {
        throw new Error(configuration.accessToken);
      }) as unknown as typeof fetch,
    );
    try {
      await client.request({
        baseUrl: configuration.apiBaseUrl,
        path: "/v/communes",
        schema: z.unknown(),
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(configuration.accessToken);
      expect((error as ShipitError).code).toBe("REQUEST_FAILED");
    }
  });

  it("retries retryable GET failures only", async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ) as unknown as typeof fetch;
    const client = new ShipitHttpClient(configuration, fetcher);
    await expect(
      client.request({
        baseUrl: configuration.apiBaseUrl,
        path: "/v/example",
        schema: z.object({ ok: z.boolean() }),
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("never retries POST requests", async () => {
    const fetcher = jest.fn(
      async () => new Response("temporary", { status: 503 }),
    ) as unknown as typeof fetch;
    const client = new ShipitHttpClient(configuration, fetcher);
    await expect(
      client.request({
        baseUrl: configuration.apiBaseUrl,
        path: "/v/rates",
        method: "POST",
        body: {},
        schema: z.unknown(),
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("blocks shipment creation behind its independent feature flag", () => {
    const api = new ShipitApiClient(configuration);
    expect(() => api.createShipment({} as never)).toThrow(
      "Shipit shipment creation is disabled",
    );
  });
});
