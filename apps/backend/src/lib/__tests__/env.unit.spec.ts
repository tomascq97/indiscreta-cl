import { medusaWorkerModes, validateBackendEnvironment } from "../env";

const validEnvironment = {
  DATABASE_URL: "postgresql://database.invalid/medusa",
  STORE_CORS: "https://store.invalid",
  ADMIN_CORS: "https://admin.invalid",
  AUTH_CORS: "https://store.invalid,https://admin.invalid",
  JWT_SECRET: "jwt-test-secret",
  COOKIE_SECRET: "cookie-test-secret",
};

const validS3Environment = {
  S3_FILE_URL: "https://assets.invalid/bucket",
  S3_ACCESS_KEY_ID: "test-access-key",
  S3_SECRET_ACCESS_KEY: "test-secret-key",
  S3_REGION: "test-region-1",
  S3_BUCKET: "test-bucket",
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

  it("allows development to use local file storage without S3", () => {
    expect(validateBackendEnvironment(validEnvironment).S3).toBeUndefined();
  });

  it("accepts a complete S3-compatible configuration", () => {
    expect(
      validateBackendEnvironment({
        ...validEnvironment,
        ...validS3Environment,
        S3_ENDPOINT: "https://s3-api.invalid",
        S3_FORCE_PATH_STYLE: "true",
      }).S3,
    ).toEqual({
      fileUrl: validS3Environment.S3_FILE_URL,
      accessKeyId: validS3Environment.S3_ACCESS_KEY_ID,
      secretAccessKey: validS3Environment.S3_SECRET_ACCESS_KEY,
      region: validS3Environment.S3_REGION,
      bucket: validS3Environment.S3_BUCKET,
      endpoint: "https://s3-api.invalid",
      forcePathStyle: true,
    });
  });

  it("rejects production without S3 configuration", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        MEDUSA_WORKER_MODE: "server",
        MEDUSA_FF_CACHING: "true",
        REDIS_URL: "redis://redis.invalid:6379",
      }),
    ).toThrow("S3_FILE_URL");
  });

  it("rejects a partial S3 configuration", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        S3_BUCKET: "partial-bucket",
      }),
    ).toThrow("S3_FILE_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION");
  });

  it("rejects invalid S3 URLs without echoing credentials", () => {
    const sensitiveValue = "sensitive-s3-secret";

    try {
      validateBackendEnvironment({
        ...validEnvironment,
        ...validS3Environment,
        S3_FILE_URL: "file:///private/assets",
        S3_SECRET_ACCESS_KEY: sensitiveValue,
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      const message = (error as Error).message;

      expect(message).toContain("S3_FILE_URL");
      expect(message).not.toContain(sensitiveValue);
      expect(message).not.toContain("file:///private/assets");
    }
  });

  it("requires an endpoint when path-style access is enabled", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        ...validS3Environment,
        S3_FORCE_PATH_STYLE: "true",
      }),
    ).toThrow("S3_ENDPOINT");
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
        MEDUSA_FF_CACHING: "true",
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
        MEDUSA_FF_CACHING: "true",
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
        MEDUSA_FF_CACHING: "true",
      }),
    ).toThrow("REDIS_URL");
  });

  it("rejects production without the Caching feature flag", () => {
    expect(() =>
      validateBackendEnvironment({
        ...validEnvironment,
        NODE_ENV: "production",
        MEDUSA_WORKER_MODE: "server",
        REDIS_URL: "redis://redis.invalid:6379",
      }),
    ).toThrow("MEDUSA_FF_CACHING");
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
