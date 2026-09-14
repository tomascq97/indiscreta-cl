import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";

export type PasswordResetData = {
  entity_id: string;
  token: string;
  actor_type: string;
};

export function buildCustomerPasswordResetUrl(
  storefrontUrl: string,
  email: string,
  token: string,
  isProduction = process.env.NODE_ENV === "production",
) {
  const storefront = new URL(storefrontUrl);

  if (
    !["http:", "https:"].includes(storefront.protocol) ||
    (isProduction &&
      (storefront.hostname === "localhost" ||
        storefront.hostname === "127.0.0.1" ||
        storefront.hostname === "::1"))
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A trusted storefront URL is required for password reset.",
    );
  }

  const resetUrl = new URL(
    `${storefront.toString().replace(/\/$/, "")}/account/reset-password`,
  );
  resetUrl.searchParams.set("token", token);
  resetUrl.searchParams.set("email", email);
  return resetUrl.toString();
}

export function buildAdminPasswordResetUrl(
  backendUrl: string,
  adminPath: string,
  email: string,
  token: string,
) {
  const resetUrl = new URL(
    `${backendUrl.replace(/\/$/, "")}/${adminPath.replace(/^\//, "").replace(/\/$/, "")}/reset-password`,
  );
  resetUrl.searchParams.set("token", token);
  resetUrl.searchParams.set("email", email);
  return resetUrl.toString();
}

export default async function passwordResetHandler({
  event: {
    data: { entity_id: email, token, actor_type: actorType },
  },
  container,
}: SubscriberArgs<PasswordResetData>) {
  if (actorType !== "customer" && actorType !== "user") {
    return;
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE);
  const urlPrefix =
    actorType === "user"
      ? config.admin.backendUrl
      : config.admin.storefrontUrl;

  if (!urlPrefix) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A trusted URL is required for password reset.",
    );
  }

  const resetUrl =
    actorType === "user"
      ? buildAdminPasswordResetUrl(
          urlPrefix,
          config.admin.path || "/app",
          email,
          token,
        )
      : buildCustomerPasswordResetUrl(urlPrefix, email, token);

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "password-reset",
    data: {
      reset_url: resetUrl,
    },
  });
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
