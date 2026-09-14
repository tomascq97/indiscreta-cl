import { Module } from "@medusajs/framework/utils";

import WebpayModuleService from "./service";

export const WEBPAY_MODULE = "webpay";

export default Module(WEBPAY_MODULE, {
  service: WebpayModuleService,
});
