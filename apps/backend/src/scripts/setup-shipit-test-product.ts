import type { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

const PRODUCT_HANDLE = "shipit-test-product-no-vender";
const PRODUCT_SKU = "SHIPIT-TEST-001";

function assertSafeEnvironment() {
  const database = new URL(process.env.DATABASE_URL ?? "");
  const isLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
    database.hostname,
  );
  const isExplicitSandboxSetup =
    process.env.ALLOW_SHIPIT_TEST_PRODUCT_SETUP === "true" &&
    process.env.SHIPIT_SANDBOX === "true";

  if (
    (!isLocal || process.env.SHIPIT_SHIPMENT_CREATION_ENABLED !== "false") &&
    !isExplicitSandboxSetup
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shipit test product setup requires local read-only Shipit or explicit sandbox authorization",
    );
  }
}

export default async function setupShipitTestProduct({ container }: ExecArgs) {
  assertSafeEnvironment();

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
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
        "Shipping profile or sales channel is missing",
      );
    }

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "SHIPIT TEST - NO VENDER",
            handle: PRODUCT_HANDLE,
            description:
              "Producto ficticio exclusivo para validar cotizaciones Shipit.",
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: profiles[0].id,
            sales_channels: [{ id: channels[0].id }],
            options: [{ title: "Formato", values: ["Prueba"] }],
            variants: [
              {
                title: "Prueba",
                sku: PRODUCT_SKU,
                manage_inventory: true,
                weight: 500,
                length: 20,
                width: 15,
                height: 5,
                options: { Formato: "Prueba" },
                prices: [{ currency_code: "clp", amount: 9990 }],
              },
            ],
          },
        ],
      },
    });
  }

  const [{ data: inventoryItems }, { data: locations }, { data: channels }] =
    await Promise.all([
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
      "Inventory item, stock location, or sales channel is missing",
    );
  }

  if (
    !(location.sales_channels ?? []).some(
      (salesChannel) => salesChannel?.id === channel.id,
    )
  ) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: channel.id },
    });
  }

  if (
    !(inventoryItem.location_levels ?? []).some(
      (level) => level?.location_id === location.id,
    )
  ) {
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

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "status",
      "variants.id",
      "variants.sku",
      "variants.weight",
      "variants.length",
      "variants.width",
      "variants.height",
    ],
    filters: { handle: PRODUCT_HANDLE },
  });
  console.log(JSON.stringify(products[0], null, 2));
}
