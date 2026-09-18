import type {
  IFulfillmentModuleService,
  ILockingModule,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import {
  persistShipitShipmentIdempotently,
  type PersistShipitShipmentResult,
} from "./persist-shipment";
import { SHIPIT_MODULE } from "../../modules/shipit";
import type ShipitModuleService from "../../modules/shipit/service";

type MedusaContainer = {
  resolve<T = unknown>(key: string): T;
};

export type PersistMedusaShipitFulfillmentResult =
  | PersistShipitShipmentResult
  | {
      status: "skipped";
      reason: "missing_shipit_metadata";
    };

export async function persistMedusaShipitFulfillment(
  container: MedusaContainer,
  fulfillmentId: string,
): Promise<PersistMedusaShipitFulfillmentResult> {
  const fulfillmentService =
    container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT,
    );

  const fulfillment =
    await fulfillmentService.retrieveFulfillment(fulfillmentId);

  const data = fulfillment.data ?? {};

  if (
    !data.shipit_id ||
    !data.shipit_reference ||
    !data.shipit_order_id
  ) {
    return {
      status: "skipped",
      reason: "missing_shipit_metadata",
    };
  }

  const service =
    container.resolve<ShipitModuleService>(SHIPIT_MODULE);

  const lockingService =
    container.resolve<ILockingModule>(Modules.LOCKING);

  return persistShipitShipmentIdempotently(
    {
      lockingService,
      listShipments: (filters) =>
        service.listShipitShipments(filters as never),
      createShipment: (input) =>
        service.createShipitShipments(input),
    },
    {
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
      shipit_updated_at: new Date(
        String(data.shipit_updated_at),
      ),
      sandbox: data.shipit_sandbox !== false,
    },
  );
}