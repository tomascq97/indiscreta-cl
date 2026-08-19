import type { MedusaContainer } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows";

const WEBPAY_PROVIDER_ID = "pp_webpay-plus_webpay";
const PRODUCT_HANDLE = "webpay-e2e-test-product-no-vender";
const PRODUCT_SKU = "WEBPAY-E2E-001";

function assertSafeEnvironment() {
  const database = new URL(process.env.DATABASE_URL ?? "");
  const redis = new URL(process.env.REDIS_URL ?? "");

  if (
    !["localhost", "127.0.0.1", "[::1]", "::1"].includes(database.hostname) ||
    database.pathname !== "/medusa_webpay_e2e"
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "E2E setup requires the dedicated local PostgreSQL database",
    );
  }

  if (
    redis.hostname !== "127.0.0.1" ||
    redis.port !== "6380" ||
    process.env.WEBPAY_ENVIRONMENT !== "integration"
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "E2E setup requires local Redis and Webpay Integration",
    );
  }
}

export default async function setupWebpayE2e({
  container,
}: {
  container: MedusaContainer;
}) {
  assertSafeEnvironment();

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
    filters: { name: "Chile" },
  });
  const region = regions[0];
  if (!region) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Chile E2E region is missing",
    );
  }

  const providerIds = new Set(
    (region.payment_providers ?? [])
      .map((provider) => provider?.id)
      .filter((id): id is string => Boolean(id)),
  );
  if (!providerIds.has(WEBPAY_PROVIDER_ID)) {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: {
          payment_providers: ["pp_system_default", WEBPAY_PROVIDER_ID],
        },
      },
    });
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: PRODUCT_HANDLE },
  });

  if (!existingProducts.length) {
    const [{ data: profiles }, { data: channels }] = await Promise.all([
      query.graph({ entity: "shipping_profile", fields: ["id"] }),
      query.graph({ entity: "sales_channel", fields: ["id"] }),
    ]);

    if (!profiles[0] || !channels[0]) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "E2E shipping profile or sales channel is missing",
      );
    }

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "WEBPAY E2E TEST PRODUCT - NO VENDER",
            handle: PRODUCT_HANDLE,
            description: "Producto ficticio exclusivo para Webpay Integration.",
            status: ProductStatus.PUBLISHED,
            weight: 100,
            shipping_profile_id: profiles[0].id,
            sales_channels: [{ id: channels[0].id }],
            options: [{ title: "Formato", values: ["E2E"] }],
            variants: [
              {
                title: "E2E",
                sku: PRODUCT_SKU,
                manage_inventory: true,
                options: { Formato: "E2E" },
                prices: [{ currency_code: "clp", amount: 15990 }],
              },
            ],
          },
        ],
      },
    });
  }

  const [
    { data: inventoryItems },
    { data: locations },
    { data: channels },
  ] = await Promise.all([
    query.graph({
      entity: "inventory_item",
      fields: ["id", "sku", "location_levels.location_id"],
      filters: { sku: PRODUCT_SKU },
    }),
    query.graph({
      entity: "stock_location",
      fields: ["id", "sales_channels.id"],
    }),
    query.graph({ entity: "sales_channel", fields: ["id"] }),
  ]);
  const inventoryItem = inventoryItems[0];
  const location = locations[0];
  const channel = channels[0];

  if (!inventoryItem || !location || !channel) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "E2E inventory item or stock location is missing",
    );
  }

  const hasSalesChannel = (location.sales_channels ?? []).some(
    (salesChannel) => salesChannel?.id === channel.id,
  );
  if (!hasSalesChannel) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
    });
  }

  const hasLevel = (inventoryItem.location_levels ?? []).some(
    (level) => level?.location_id === location.id,
  );
  if (!hasLevel) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: [
          {
            inventory_item_id: inventoryItem.id,
            location_id: location.id,
            stocked_quantity: 100,
          },
        ],
      },
    });
  }

  logger.info("Webpay E2E fixtures are ready");
}
