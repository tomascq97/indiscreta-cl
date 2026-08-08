import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";

type VerificationRequestedData = {
  entity_id: string;
  entity_type: string;
  code_provider: string;
  auth_identity_id: string;
  code: string;
  expires_at: string;
  metadata?: Record<string, unknown>;
};

export default async function verificationRequestedHandler({
  event: {
    data: { entity_id: email, entity_type, code },
  },
  container,
}: SubscriberArgs<VerificationRequestedData>) {
  if (entity_type !== "email") {
    return;
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const config = container.resolve("configModule");
  const urlPrefix = config.admin.storefrontUrl || "http://localhost:8000/cl";

  const verificationUrl =
    `${urlPrefix}/verify-account` +
    `?token=${encodeURIComponent(code)}` +
    `&email=${encodeURIComponent(email)}`;

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "email-verification",
    data: {
      verification_url: verificationUrl,
    },
  });
}

export const config: SubscriberConfig = {
  event: "auth.verification_requested",
};
