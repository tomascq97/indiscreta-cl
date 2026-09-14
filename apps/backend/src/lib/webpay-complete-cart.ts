export type WebpayCompleteCartResult = {
  id?: string;
  total: number;
};

type QueryLike = {
  graph(input: Record<string, unknown>): Promise<{
    data: unknown[];
  }>;
};

async function loadOrderById(
  query: QueryLike,
  orderId: string,
): Promise<WebpayCompleteCartResult> {
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "total"],
      filters: { id: orderId },
    });

    const order = data[0] as
      | {
          id?: unknown;
          total?: unknown;
        }
      | undefined;

    return {
      id:
        typeof order?.id === "string" && order.id
          ? order.id
          : orderId,
      total: Number(order?.total),
    };
  } catch {
    return {
      id: orderId,
      total: Number.NaN,
    };
  }
}

async function findOrderIdByCart(
  query: QueryLike,
  cartId: string,
): Promise<string | undefined> {
  const { data } = await query.graph({
    entity: "order_cart",
    fields: ["order_id"],
    filters: { cart_id: cartId },
  });

  const link = data[0] as
    | {
        order_id?: unknown;
      }
    | undefined;

  return typeof link?.order_id === "string" && link.order_id
    ? link.order_id
    : undefined;
}

export async function completeWebpayCartIdempotently(input: {
  cartId: string;
  query: QueryLike;
  completeCart(cartId: string): Promise<{ id?: string }>;
}): Promise<WebpayCompleteCartResult> {
  const { cartId, query, completeCart } = input;

  const existingOrderId = await findOrderIdByCart(query, cartId);

  if (existingOrderId) {
    return loadOrderById(query, existingOrderId);
  }

  try {
    const completed = await completeCart(cartId);
    const orderId = completed.id;

    if (!orderId) {
      return {
        id: undefined,
        total: Number.NaN,
      };
    }

    return loadOrderById(query, orderId);
  } catch (error) {
    try {
      const reconciledOrderId = await findOrderIdByCart(
        query,
        cartId,
      );

      if (reconciledOrderId) {
        return loadOrderById(query, reconciledOrderId);
      }
    } catch {
      // Preserve the original completeCart failure when reconciliation
      // itself cannot determine whether an order was created.
    }

    throw error;
  }
}