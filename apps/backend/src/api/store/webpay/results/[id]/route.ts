import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
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

    let orderDisplayId: number | null = null;

    if (attempt.state === "completed" && attempt.order_id) {
      try {
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

        const { data: orders } = await query.graph({
          entity: "order",
          fields: ["id", "display_id"],
          filters: {
            id: attempt.order_id,
          },
        });

        const order = orders[0];

        if (order?.display_id != null) {
          orderDisplayId = Number(order.display_id);
        }
      } catch {
        // The public payment result must remain available even if
        // the order display ID cannot be enriched.
      }
    }

    res.status(200).json({
      result: sanitizeWebpayResult(attempt, orderDisplayId),
    });
  } catch {
    res.status(404).json({ result: unavailableWebpayResult() });
  }
}
