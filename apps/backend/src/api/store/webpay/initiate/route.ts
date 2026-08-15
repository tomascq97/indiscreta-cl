import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../../lib/env";
import {
  assertIntegrationWebpayEnabled,
  initiateWebpayRequestSchema,
  toStoreWebpayInitiationResponse,
} from "../../../../lib/webpay-store-initiation";
import { initiateWebpayWorkflow } from "../../../../workflows/initiate-webpay";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const environment = validateBackendEnvironment(process.env);
  assertIntegrationWebpayEnabled(environment);
  const input = initiateWebpayRequestSchema.parse(req.body);
  const { result } = await initiateWebpayWorkflow(req.scope).run({ input });

  res.status(200).json(toStoreWebpayInitiationResponse(result));
}
