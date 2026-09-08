import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import type { IFulfillmentModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import { SHIPIT_MODULE } from "../modules/shipit";
import type ShipitModuleService from "../modules/shipit/service";

type FulfillmentCreated = { id: string };

export default async function persistShipitFulfillment({
  event,
  container,
}: SubscriberArgs<FulfillmentCreated>) {
  const fulfillmentService = container.resolve<IFulfillmentModuleService>(
    Modules.FULFILLMENT,
  );
  const fulfillment = await fulfillmentService.retrieveFulfillment(
    event.data.id,
  );
  const data = fulfillment.data ?? {};
  if (!data.shipit_id || !data.shipit_reference || !data.shipit_order_id)
    return;

  const service = container.resolve<ShipitModuleService>(SHIPIT_MODULE);
  await service.createShipitShipments({
    fulfillment_id: fulfillment.id,
    order_id: String(data.shipit_order_id),
    shipit_id: Number(data.shipit_id),
    reference: String(data.shipit_reference),
    status: String(data.shipit_status),
    courier_status: data.shipit_courier_status
      ? String(data.shipit_courier_status)
      : null,
    tracking_number: data.shipit_tracking_number
      ? String(data.shipit_tracking_number)
      : null,
    shipit_created_at: null,
    shipit_updated_at: new Date(String(data.shipit_updated_at)),
    sandbox: data.shipit_sandbox !== false,
  });
}

export const config: SubscriberConfig = { event: "fulfillment.created" };
