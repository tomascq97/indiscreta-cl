import passwordResetHandler, {
  buildAdminPasswordResetUrl,
  buildCustomerPasswordResetUrl,
  config,
} from "../send-password-reset";

describe("password reset subscriber", () => {
  it("builds the customer URL from the trusted configured storefront URL", () => {
    const url = new URL(
      buildCustomerPasswordResetUrl(
        "https://indiscreta.cl/cl",
        "cliente+test@example.com",
        "token+/=",
      ),
    );

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://indiscreta.cl/cl/account/reset-password",
    );
    expect(url.searchParams.get("email")).toBe("cliente+test@example.com");
    expect(url.searchParams.get("token")).toBe("token+/=");
  });

  it("subscribes to auth.password_reset", () => {
    expect(config).toEqual({ event: "auth.password_reset" });
  });

  it("builds an admin URL in the Medusa dashboard", () => {
    expect(
      buildAdminPasswordResetUrl(
        "https://backend.example.com",
        "/app",
        "admin@example.com",
        "secret-reset-token",
      ),
    ).toBe(
      "https://backend.example.com/app/reset-password?token=secret-reset-token&email=admin%40example.com",
    );
  });

  it("rejects a localhost reset URL in production", () => {
    expect(() =>
      buildCustomerPasswordResetUrl(
        "http://localhost:8000/cl",
        "cliente@example.com",
        "token",
        true,
      ),
    ).toThrow("A trusted storefront URL is required for password reset.");
  });

  it("sends a customer notification using the password-reset template", async () => {
    const createNotifications = jest.fn().mockResolvedValue(undefined);
    const container = {
      resolve: jest.fn((key: string) =>
        key === "configModule"
          ? { admin: { storefrontUrl: "https://indiscreta.cl/cl" } }
          : { createNotifications },
      ),
    };

    await passwordResetHandler({
      event: {
        name: "auth.password_reset",
        data: {
          actor_type: "customer",
          entity_id: "cliente@example.com",
          token: "secret-reset-token",
        },
      },
      container,
    } as never);

    expect(createNotifications).toHaveBeenCalledWith({
      to: "cliente@example.com",
      channel: "email",
      template: "password-reset",
      data: {
        reset_url:
          "https://indiscreta.cl/cl/account/reset-password?token=secret-reset-token&email=cliente%40example.com",
      },
    });
  });

  it("sends an admin reset link to the Medusa dashboard", async () => {
    const createNotifications = jest.fn().mockResolvedValue(undefined);
    const container = {
      resolve: jest.fn((key: string) =>
        key === "configModule"
          ? {
              admin: {
                backendUrl: "https://backend.example.com",
                path: "/app",
              },
            }
          : { createNotifications },
      ),
    };
    await passwordResetHandler({
      event: {
        name: "auth.password_reset",
        data: {
          actor_type: "user",
          entity_id: "admin@example.com",
          token: "token",
        },
      },
      container,
    } as never);
    expect(createNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        data: {
          reset_url:
            "https://backend.example.com/app/reset-password?token=token&email=admin%40example.com",
        },
      }),
    );
  });
});
