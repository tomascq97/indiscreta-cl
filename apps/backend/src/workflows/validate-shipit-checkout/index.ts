import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import {
  buildShipitQuoteSelection,
  SHIPIT_FULFILLMENT_PROVIDER_ID,
} from "../../modules/shipit-fulfillment/service";
import { quoteShipitShippingWorkflow } from "../quote-shipit-shipping";
import { assertShipitCheckoutQuote } from "./operation";

type ShipitCheckoutSelection =
  ReturnType<typeof buildShipitQuoteSelection>;

type ShipitCheckoutCurrentQuote =
  Parameters<
    typeof assertShipitCheckoutQuote
  >[0]["current"];

type ShipitCheckoutQuoteRunner = (input: {
  cartId: string;
  selection: ShipitCheckoutSelection;
}) => Promise<ShipitCheckoutCurrentQuote>;

export async function validateShipitCheckoutBeforeWebpay(
  container: {
    resolve<T>(key: string): T;
  },
  cartId: string,
  dependencies: {
    quote?: ShipitCheckoutQuoteRunner;
  } = {},
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
  const methodData = methods[0]?.data ?? {};

  const selection = buildShipitQuoteSelection(
    methodData,
    methodData,
  );

  const quote: ShipitCheckoutQuoteRunner =
    dependencies.quote ??
    (async (input) => {
      const { result } =
        await quoteShipitShippingWorkflow(
          container as never,
        ).run({
          input,
        });

      return result;
    });

  const current = await quote({
    cartId,
    selection,
  });

  assertShipitCheckoutQuote({
    methods,
    current,
  });
}
