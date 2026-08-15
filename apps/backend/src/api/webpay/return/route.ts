import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../lib/env";
import { processWebpayReturnWorkflow } from "../../../workflows/process-webpay-return";

function requestValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const environment = validateBackendEnvironment(process.env);
  if (!environment.WEBPAY) {
    res.status(503).json({ type: "webpay_not_configured" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const input = {
    token_ws: requestValue(body.token_ws),
    TBK_TOKEN: requestValue(body.TBK_TOKEN),
    TBK_ORDEN_COMPRA: requestValue(body.TBK_ORDEN_COMPRA),
    TBK_ID_SESION: requestValue(body.TBK_ID_SESION),
  };

  let resultId = "unavailable";
  try {
    const { result } = await processWebpayReturnWorkflow(req.scope).run({
      input,
    });
    resultId = result.id;
  } catch {
    // The browser receives no internal error or transaction identifier.
  }

  const resultUrl = new URL(environment.WEBPAY.resultUrl);
  resultUrl.searchParams.set("webpay_result", resultId);
  res.redirect(303, resultUrl.toString());
}
