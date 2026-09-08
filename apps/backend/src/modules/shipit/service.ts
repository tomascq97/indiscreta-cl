import { MedusaService } from "@medusajs/framework/utils";

import ShipitQuote from "./models/shipit-quote";
import ShipitShipment from "./models/shipit-shipment";

class ShipitModuleService extends MedusaService({
  ShipitQuote,
  ShipitShipment,
}) {}

export default ShipitModuleService;
