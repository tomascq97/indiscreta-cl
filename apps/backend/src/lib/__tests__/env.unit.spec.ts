import { validateBackendEnvironment } from "../env";

const validEnvironment = {
  DATABASE_URL: "postgresql://database.invalid/medusa",
  STORE_CORS: "https://store.invalid",
  ADMIN_CORS: "https://admin.invalid",
  AUTH_CORS: "https://store.invalid,https://admin.invalid",
  JWT_SECRET: "jwt-test-secret",
  COOKIE_SECRET: "cookie-test-secret",
};

describe("validateBackendEnvironment", () => {
  it("returns a typed configuration when all required variables exist", () => {
    expect(validateBackendEnvironment(validEnvironment)).toEqual(
      validEnvironment,
    );
  });

  it("reports every missing required variable by name", () => {
    expect(() => validateBackendEnvironment({})).toThrow(
      "DATABASE_URL, STORE_CORS, ADMIN_CORS, AUTH_CORS, JWT_SECRET, COOKIE_SECRET",
    );
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
