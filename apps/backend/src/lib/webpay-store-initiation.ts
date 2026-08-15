import { MedusaError } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";

import type { BackendEnvironment } from "./env";

export const initiateWebpayRequestSchema = z
  .object({
    cart_id: z.string().trim().min(1).max(255),
  })
  .strict();

export type StoreWebpayInitiationResponse = {
  token: string;
  webpay_url: string;
};

export function assertIntegrationWebpayEnabled(
  environment: BackendEnvironment,
  nodeEnvironment = process.env.NODE_ENV,
): asserts environment is BackendEnvironment & {
  WEBPAY: NonNullable<BackendEnvironment["WEBPAY"]>;
} {
  if (
    nodeEnvironment === "production" ||
    environment.WEBPAY?.environment !== "integration"
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Webpay checkout initiation is only enabled in integration",
    );
  }
}

export function toStoreWebpayInitiationResponse(
  result: Record<string, unknown>,
): StoreWebpayInitiationResponse {
  const token = result.token;
  const webpayUrl = result.webpay_url;

  if (typeof token !== "string" || typeof webpayUrl !== "string") {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Webpay initiation did not return redirect data",
    );
  }

  let url: URL;
  try {
    url = new URL(webpayUrl);
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Webpay initiation returned an invalid URL",
    );
  }

  if (
    url.protocol !== "https:" ||
    (url.hostname !== "transbank.cl" && !url.hostname.endsWith(".transbank.cl"))
  ) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Webpay initiation returned an untrusted URL",
    );
  }

  return { token, webpay_url: url.toString() };
}
