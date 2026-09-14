import { model } from "@medusajs/framework/utils";

const ShipitShipment = model
  .define("shipit_shipment", {
    id: model.id({ prefix: "shs" }).primaryKey(),
    fulfillment_id: model.text(),
    order_id: model.text(),
    shipit_id: model.number(),
    reference: model.text(),
    status: model.text(),
    courier_status: model.text().nullable(),
    tracking_number: model.text().nullable(),
    shipit_created_at: model.dateTime().nullable(),
    shipit_updated_at: model.dateTime(),
    sandbox: model.boolean().default(true),
  })
  .indexes([
    {
      name: "IDX_shipit_shipment_fulfillment",
      on: ["fulfillment_id"],
      unique: true,
    },
    { name: "IDX_shipit_shipment_shipit_id", on: ["shipit_id"], unique: true },
    { name: "IDX_shipit_shipment_reference", on: ["reference"], unique: true },
  ]);

export default ShipitShipment;
