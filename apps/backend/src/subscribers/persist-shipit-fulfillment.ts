import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

import { persistMedusaShipitFulfillment } from "../lib/shipit/persist-medusa-fulfillment";

type FulfillmentCreated = {
  order_id: string;
  fulfillment_id: string;
  no_notification?: boolean;
};

export default async function persistShipitFulfillment({
  event,
  container,
}: SubscriberArgs<FulfillmentCreated>) {
  await persistMedusaShipitFulfillment(
    container,
    event.data.fulfillment_id,
  );
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};
