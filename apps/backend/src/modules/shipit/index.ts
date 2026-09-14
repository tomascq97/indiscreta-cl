import { Module } from "@medusajs/framework/utils";

import ShipitModuleService from "./service";

export const SHIPIT_MODULE = "shipit";

export default Module(SHIPIT_MODULE, { service: ShipitModuleService });
