import { model } from "@medusajs/framework/utils";

const ShipitQuote = model
  .define("shipit_quote", {
    id: model.id({ prefix: "shq" }).primaryKey(),
    cart_id: model.text(),
    shipping_option_id: model.text().nullable(),
    quote_hash: model.text(),
    contract_version: model.text(),
    packing_policy: model.text(),
    origin_commune_id: model.number(),
    destination_commune_id: model.number(),
    destination_kind: model.text(),
    destination_context: model.text(),
    courier_id: model.number().nullable(),
    courier_name: model.text(),
    service_name: model.text(),
    shipit_destiny_id: model.number(),
    branch_office_id: model.number().nullable(),
    length_cm: model.float(),
    width_cm: model.float(),
    height_cm: model.float(),
    weight_kg: model.float(),
    net_price: model.bigNumber(),
    tax_amount: model.bigNumber(),
    tax_rate_bps: model.number(),
    price: model.bigNumber(),
    currency_code: model.text(),
    tax_inclusive: model.boolean().default(true),
    delivery_days: model.number(),
    quoted_at: model.dateTime(),
    selected_at: model.dateTime().nullable(),
    invalidated_at: model.dateTime().nullable(),
  })
  .indexes([
    { name: "IDX_shipit_quote_hash", on: ["quote_hash"] },
    { name: "IDX_shipit_quote_cart_id", on: ["cart_id"] },
    {
      name: "IDX_shipit_quote_cart_validity",
      on: ["cart_id", "invalidated_at", "quoted_at"],
    },
  ]);

export default ShipitQuote;
