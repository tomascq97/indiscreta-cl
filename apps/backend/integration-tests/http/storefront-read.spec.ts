import { getHttpTestConfiguration } from "./http-test-helpers";

describe("running Medusa HTTP contracts", () => {
  const configuration = getHttpTestConfiguration();

  jest.setTimeout(15_000);

  it("reports a healthy backend", async () => {
    const response = await fetch(`${configuration.backendUrl}/health`);

    expect(response.status).toBe(200);
  });

  it("reports a ready backend with its dependencies available", async () => {
    const response = await fetch(`${configuration.backendUrl}/ready`);
    const payload = (await response.json()) as unknown;

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: "ready" });
  });

  it("lists seeded products with a stable minimum structure", async () => {
    const response = await fetch(`${configuration.backendUrl}/store/products`, {
      headers: {
        "x-publishable-api-key": configuration.publishableKey,
      },
    });
    const payload = (await response.json()) as {
      products?: unknown[];
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.products)).toBe(true);
    expect(payload.products?.length).toBeGreaterThan(0);
    expect(payload.products?.[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        handle: expect.any(String),
      }),
    );
  });

  it("returns 404 for an unknown store endpoint", async () => {
    const response = await fetch(
      `${configuration.backendUrl}/store/p1-http-contract-missing`,
      {
        headers: {
          "x-publishable-api-key": configuration.publishableKey,
        },
      },
    );

    expect(response.status).toBe(404);
  });
});
