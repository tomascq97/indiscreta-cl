import { SHIPIT_FULFILLMENT_PROVIDER_ID } from "./constants";

export type ShipitOrderFulfillmentSnapshot = {
  id: string;
  items?: Array<{
    id?: string;
    quantity?: unknown;
    fulfilled_quantity?: unknown;
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
};

export type EnsureShipitFulfillmentDependencies = {
  lockingService: {
    execute(
      key: string,
      callback: () => Promise<EnsureShipitFulfillmentResult>,
    ): Promise<EnsureShipitFulfillmentResult>;
  };
  loadOrder(
    orderId: string,
  ): Promise<ShipitOrderFulfillmentSnapshot | undefined>;
  createFulfillment(input: {
    order_id: string;
    items: Array<{
      id: string;
      quantity: number;
    }>;
  }): Promise<{ id?: string }>;
};

export type EnsureShipitFulfillmentResult =
  | {
      status: "existing" | "created";
      fulfillment_id: string;
    }
  | {
      status: "skipped";
      reason: "no_shipping_method" | "non_shipit_shipping_method";
    };

export async function ensureShipitFulfillment(
  dependencies: EnsureShipitFulfillmentDependencies,
  orderId: string,
): Promise<EnsureShipitFulfillmentResult> {
  return dependencies.lockingService.execute(
    `shipit:fulfillment:${orderId}`,
    async () => {
      const order = await dependencies.loadOrder(orderId);

      if (!order) {
        throw new Error(`Shipit order not found: ${orderId}`);
      }

      const existing = order.fulfillments?.find(
        (fulfillment) =>
          fulfillment.provider_id === SHIPIT_FULFILLMENT_PROVIDER_ID &&
          Boolean(fulfillment.id),
      );

      if (existing?.id) {
        return {
          status: "existing",
          fulfillment_id: existing.id,
        };
      }

      const shippingMethods = order.shipping_methods ?? [];

      if (shippingMethods.length === 0) {
        return {
          status: "skipped",
          reason: "no_shipping_method",
        };
      }

      if (shippingMethods.length > 1) {
        throw new Error(
          `Shipit order has ambiguous shipping methods: ${orderId}`,
        );
      }

      const providerId =
        shippingMethods[0]?.shipping_option?.provider_id ??
        shippingMethods[0]?.data?.provider_id;

      if (providerId !== SHIPIT_FULFILLMENT_PROVIDER_ID) {
        return {
          status: "skipped",
          reason: "non_shipit_shipping_method",
        };
      }

      if ((order.fulfillments?.length ?? 0) > 0) {
        throw new Error(
          `Shipit order already has a non-Shipit fulfillment: ${orderId}`,
        );
      }

      const hasPreviouslyFulfilledItems =
        order.items?.some(
          (item) => Number(item.fulfilled_quantity ?? 0) > 0,
        ) ?? false;

      if (hasPreviouslyFulfilledItems) {
        throw new Error(
          `Shipit order is already partially fulfilled: ${orderId}`,
        );
      }

      const items =
        order.items?.map((item) => ({
          id: item.id ?? "",
          quantity: Number(item.quantity),
        })) ?? [];

      if (
        items.length === 0 ||
        items.some(
          (item) =>
            !item.id ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0,
        )
      ) {
        throw new Error(
          `Shipit order has no fulfillable items: ${orderId}`,
        );
      }

      const fulfillment = await dependencies.createFulfillment({
        order_id: orderId,
        items,
      });

      if (!fulfillment?.id) {
        throw new Error(
          `Shipit fulfillment was not created for order: ${orderId}`,
        );
      }

      return {
        status: "created",
        fulfillment_id: fulfillment.id,
      };
    },
  );
}