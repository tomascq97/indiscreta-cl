import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../lib/env";
import { assertIntegrationWebpayEnabled } from "../../../lib/webpay-store-initiation";

export async function POST(_req: MedusaRequest, res: MedusaResponse) {
  const environment = validateBackendEnvironment(process.env);
  assertIntegrationWebpayEnabled(environment);

  res.status(501).json({
    type: "webpay_return_not_implemented",
    message: "El retorno de Webpay estará disponible en la Etapa 6.",
  });
}
