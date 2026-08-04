import { medusaWorkerModes, validateBackendEnvironment } from "../env";

const validEnvironment = {
  DATABASE_URL: "postgresql://database.invalid/medusa",
  STORE_CORS: "https://store.invalid",
  ADMIN_CORS: "https://admin.invalid",
  AUTH_CORS: "https://store.invalid,https://admin.invalid",
  JWT_SECRET: "jwt-test-secret",
  COOKIE_SECRET: "cookie-test-secret",
};

describe("validateBackendEnvironment", () => {
  it("defaults to shared mode in development", () => {
    expect(validateBackendEnvironment(validEnvironment)).toEqual({
      ...validEnvironment,
      MEDUSA_WORKER_MODE: "shared",
    });
  });

  it("allows development without Redis", () => {
    expect(
      validateBackendEnvironment(validEnvironment).REDIS_URL,
    ).toBeUndefined();
  });

  it("reports every base variable missing by name", () => {
    expect(() => validateBackendEnvironment({})).toThrow(
      "DATABASE_URL, STORE_CORS, ADMIN_CORS, AUTH_CORS, JWT_SECRET, COOKIE_SECRET",
    );
  });

  it("rejects production without an explicit worker mode", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        REDIS_URL: "redis://redis.invalid:6379",
      }),
    ).toThrow("MEDUSA_WORKER_MODE");
  });

  it("rejects an invalid production worker mode without echoing it", () => {
    const invalidMode = "invalid-worker-mode";

    try {
      validateBackendEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        MEDUSA_WORKER_MODE: invalidMode,
        REDIS_URL: "redis://redis.invalid:6379",
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toContain("MEDUSA_WORKER_MODE");
      expect(message).toContain(medusaWorkerModes.join(", "));
      expect(message).not.toContain(invalidMode);
    }
  });

  it("rejects production without Redis", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        MEDUSA_WORKER_MODE: "server",
      }),
    ).toThrow("REDIS_URL");
  });

  it.each(["redis://redis.invalid:6379", "rediss://redis.invalid:6379"])(
    "accepts the supported Redis URL %s",
    (redisUrl) => {
      expect(
        validateBackendEnvironment({
          ...validEnvironment,
          REDIS_URL: redisUrl,
        }).REDIS_URL,
      ).toBe(redisUrl);
    },
  );

  it("rejects a non-Redis URL protocol", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        REDIS_URL: "https://redis.invalid",
      }),
    ).toThrow("redis: or rediss:");
  });

  it("rejects a malformed Redis URL without echoing it", () => {
    const sensitiveRedisUrl = "not-a-url-with-secret-data";

    try {
      validateBackendEnvironment({
        ...validEnvironment,
        REDIS_URL: sensitiveRedisUrl,
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toContain("REDIS_URL");
      expect(message).not.toContain(sensitiveRedisUrl);
    }
  });

  it.each(medusaWorkerModes)("accepts the %s worker mode", (workerMode) => {
    expect(
      validateBackendEnvironment({
        ...validEnvironment,
        MEDUSA_WORKER_MODE: workerMode,
      }).MEDUSA_WORKER_MODE,
    ).toBe(workerMode);
  });

  it("does not include another secret value when a secret is missing", () => {
    const sensitiveValue = "must-not-appear-in-errors";

    try {
      validateBackendEnvironment({
        ...validEnvironment,
        JWT_SECRET: undefined,
        COOKIE_SECRET: sensitiveValue,
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toContain("JWT_SECRET");
      expect(message).not.toContain(sensitiveValue);
    }
  });
});
