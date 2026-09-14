import type { ILockingModule } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows";

import { ensureShipitFulfillment } from "./ensure-fulfillment";

type MedusaContainer = {
  resolve<T = unknown>(key: string): T;
};

type QueryLike = {
  graph(input: Record<string, unknown>): Promise<{
    data: unknown[];
  }>;
};

export async function ensureMedusaShipitFulfillment(
  container: MedusaContainer,
  orderId: string,
) {
  const lockingService =
    container.resolve<ILockingModule>(Modules.LOCKING);

  const query = container.resolve<QueryLike>(
    ContainerRegistrationKeys.QUERY,
  );

  return ensureShipitFulfillment(
    {
      lockingService,
      loadOrder: async (id) => {
        const { data } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "items.id",
            "items.quantity",
            "items.fulfilled_quantity",
            "items.detail.quantity",
            "items.detail.fulfilled_quantity",
            "fulfillments.id",
            "fulfillments.provider_id",
            "shipping_methods.shipping_option.provider_id",
            "shipping_methods.data.provider_id",
          ],
          filters: { id },
        });

        const order = data[0] as
          | {
              id: string;
              items?: Array<{
                id?: string;
                quantity?: unknown;
                fulfilled_quantity?: unknown;
                detail?: {
                  quantity?: unknown;
                  fulfilled_quantity?: unknown;
                } | null;
              }>;
              fulfillments?: Array<{
                id?: string;
                provider_id?: string;
              }>;
              shipping_methods?: Array<{
                shipping_option?: {
                  provider_id?: string;
                } | null;
                data?: {
                  provider_id?: string;
                } | null;
              }>;
            }
          | undefined;

        if (!order) return undefined;

        return {
          ...order,
          items: order.items?.map((item) => ({
            id: item.id,
            quantity: item.quantity ?? item.detail?.quantity,
            fulfilled_quantity:
              item.fulfilled_quantity ?? item.detail?.fulfilled_quantity,
          })),
        };
      },
      createFulfillment: async (input) => {
        const { result } = await createOrderFulfillmentWorkflow(
          container as never,
        ).run({
          input,
        });

        return result as { id?: string };
      },
    },
    orderId,
  );
}
