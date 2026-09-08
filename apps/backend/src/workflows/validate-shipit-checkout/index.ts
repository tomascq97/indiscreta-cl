import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { SHIPIT_FULFILLMENT_PROVIDER_ID } from "../../modules/shipit-fulfillment/service";
import { quoteShipitShippingWorkflow } from "../quote-shipit-shipping";
import { assertShipitCheckoutQuote } from "./operation";

export async function validateShipitCheckoutBeforeWebpay(
  container: {
    resolve<T>(key: string): T;
  },
  cartId: string,
) {
  const query = container.resolve<{
    graph(input: Record<string, unknown>): Promise<{ data: unknown[] }>;
  }>(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "shipping_methods.id",
      "shipping_methods.amount",
      "shipping_methods.data",
      "shipping_methods.shipping_option.provider_id",
      "shipping_methods.shipping_option.price_type",
    ],
    filters: { id: cartId },
    options: { isList: false },
  });
  const cart = data[0] as
    | {
        shipping_methods?: Parameters<
          typeof assertShipitCheckoutQuote
        >[0]["methods"];
      }
    | undefined;
  const methods = cart?.shipping_methods ?? [];
  if (
    methods[0]?.shipping_option?.provider_id !== SHIPIT_FULFILLMENT_PROVIDER_ID
  ) {
    return;
  }
  const { result } = await quoteShipitShippingWorkflow(container as never).run({
    input: { cartId },
  });
  assertShipitCheckoutQuote({ methods, current: result });
}
