import { MedusaService } from "@medusajs/framework/utils";

import WebpayAttempt from "./models/webpay-attempt";

class WebpayModuleService extends MedusaService({ WebpayAttempt }) {}

export default WebpayModuleService;
