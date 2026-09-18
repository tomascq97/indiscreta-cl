import type { Logger, MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { ensureMedusaShipitFulfillment } from "../lib/shipit/ensure-medusa-fulfillment";
import { persistMedusaShipitFulfillment } from "../lib/shipit/persist-medusa-fulfillment";
import { WEBPAY_MODULE } from "../modules/webpay";
import type WebpayModuleService from "../modules/webpay/service";

const PAGE_SIZE = 50;

export default async function reconcileShipitFulfillments(
  container: MedusaContainer,
) {
  const logger = container.resolve<Logger>(
    ContainerRegistrationKeys.LOGGER,
  );

  const webpayService =
    container.resolve<WebpayModuleService>(WEBPAY_MODULE);

  let skip = 0;
  let scanned = 0;
  let created = 0;
  let existing = 0;
  let skipped = 0;
  let missingOrderId = 0;
  let failed = 0;

  while (true) {
    const attempts = await webpayService.listWebpayAttempts(
      { state: "completed" },
      {
        skip,
        take: PAGE_SIZE,
      },
    );

    if (!attempts.length) break;

    for (const attempt of attempts) {
      scanned += 1;

      if (!attempt.order_id) {
        missingOrderId += 1;
        continue;
      }

      try {
        const result = await ensureMedusaShipitFulfillment(
          container,
          attempt.order_id,
        );

        if (result.status === "created") {
          created += 1;

          await persistMedusaShipitFulfillment(
            container,
            result.fulfillment_id,
          );
        } else if (result.status === "existing") {
          existing += 1;

          await persistMedusaShipitFulfillment(
            container,
            result.fulfillment_id,
          );
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;

        logger.error(
          `shipit.reconciliation.failed order_id=${attempt.order_id} attempt_id=${attempt.id} error=${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (attempts.length < PAGE_SIZE) break;

    skip += attempts.length;
  }

  logger.info(
    `shipit.reconciliation.completed scanned=${scanned} created=${created} existing=${existing} skipped=${skipped} missing_order_id=${missingOrderId} failed=${failed}`,
  );
}

export const config = {
  name: "reconcile-shipit-fulfillments",
  schedule: "*/5 * * * *",
};
