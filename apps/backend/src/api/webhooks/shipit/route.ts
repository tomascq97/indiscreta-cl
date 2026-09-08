import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../lib/env";
import { shipitWebhookSchema } from "../../../lib/shipit/contracts";
import { isValidShipitWebhookAuthorization } from "../../../lib/shipit/webhook";
import { SHIPIT_MODULE } from "../../../modules/shipit";
import type ShipitModuleService from "../../../modules/shipit/service";

async function handle(req: MedusaRequest, res: MedusaResponse) {
  const configuration = validateBackendEnvironment(process.env).SHIPIT;
  if (
    !configuration ||
    !isValidShipitWebhookAuthorization(
      req.headers.authorization,
      configuration.webhookToken,
    )
  ) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const payload = shipitWebhookSchema.parse(req.body);
  const service = req.scope.resolve<ShipitModuleService>(SHIPIT_MODULE);
  const [shipment] = await service.listShipitShipments({
    reference: payload.reference,
  });
  if (!shipment || shipment.shipit_id !== payload.id) {
    res.status(202).json({ received: true });
    return;
  }

  if (new Date(payload.updated_at) >= new Date(shipment.shipit_updated_at)) {
    await service.updateShipitShipments({
      id: shipment.id,
      status: payload.status,
      courier_status: payload.courier_status ?? null,
      tracking_number: payload.tracking_number ?? null,
      shipit_updated_at: new Date(payload.updated_at),
    });
  }
  res.status(200).json({ received: true });
}

export const POST = handle;
export const PUT = handle;
