import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import {
  sanitizeWebpayResult,
  unavailableWebpayResult,
} from "../../../../../lib/webpay-result";
import { WEBPAY_MODULE } from "../../../../../modules/webpay";
import type WebpayModuleService from "../../../../../modules/webpay/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

  try {
    const service = req.scope.resolve<WebpayModuleService>(WEBPAY_MODULE);
    const attempt = await service.retrieveWebpayAttempt(req.params.id);
    res.status(200).json({ result: sanitizeWebpayResult(attempt) });
  } catch {
    res.status(404).json({ result: unavailableWebpayResult() });
  }
}
