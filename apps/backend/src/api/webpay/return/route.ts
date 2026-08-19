import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../lib/env";
import { processWebpayReturnWorkflow } from "../../../workflows/process-webpay-return";

function requestValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

export function normalizeWebpayReturnParameters(
  source: Record<string, unknown>,
) {
  return {
    token_ws: requestValue(source.token_ws),
    TBK_TOKEN: requestValue(source.TBK_TOKEN),
    TBK_ORDEN_COMPRA: requestValue(source.TBK_ORDEN_COMPRA),
    TBK_ID_SESION: requestValue(source.TBK_ID_SESION),
  };
}

function redactRequestUrl(req: MedusaRequest) {
  const request = req as MedusaRequest & {
    originalUrl?: string;
    url?: string;
  };
  const cleanPath = request.originalUrl?.split("?", 1)[0] ?? "/webpay/return";
  request.originalUrl = cleanPath;
  request.url = cleanPath;
}

async function handleWebpayReturn(
  req: MedusaRequest,
  res: MedusaResponse,
  source: Record<string, unknown>,
) {
  // Medusa's access logger runs after the handler. Remove the query string as
  // early as possible so token_ws is not retained in application access logs.
  redactRequestUrl(req);

  const environment = validateBackendEnvironment(process.env);
  if (!environment.WEBPAY) {
    res.status(503).json({ type: "webpay_not_configured" });
    return;
  }

  const input = normalizeWebpayReturnParameters(source);

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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return handleWebpayReturn(
    req,
    res,
    (req.query ?? {}) as Record<string, unknown>,
  );
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return handleWebpayReturn(
    req,
    res,
    (req.body ?? {}) as Record<string, unknown>,
  );
}
