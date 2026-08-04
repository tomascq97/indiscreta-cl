const requiredEnvironmentVariables = [
  "TEST_BACKEND_URL",
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
] as const;

type HttpTestConfiguration = {
  backendUrl: string;
  publishableKey: string;
};

function getHttpTestConfiguration(): HttpTestConfiguration {
  const missingVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new Error(
      `Missing required HTTP test environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const backendUrl = new URL(process.env.TEST_BACKEND_URL!);
  const hostname = backendUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    !["http:", "https:"].includes(backendUrl.protocol) ||
    !(
      hostname === "localhost" ||
      hostname === "::1" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname)
    )
  ) {
    throw new Error(
      "TEST_BACKEND_URL must use HTTP and resolve to a loopback host",
    );
  }

  return {
    backendUrl: backendUrl.toString().replace(/\/$/, ""),
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  };
}

describe("running Medusa HTTP contracts", () => {
  const configuration = getHttpTestConfiguration();

  jest.setTimeout(15_000);

  it("reports a healthy backend", async () => {
    const response = await fetch(`${configuration.backendUrl}/health`);

    expect(response.status).toBe(200);
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
