import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import ShipitFulfillmentProviderService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ShipitFulfillmentProviderService],
});
