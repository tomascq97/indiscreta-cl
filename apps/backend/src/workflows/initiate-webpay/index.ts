import type { IPaymentModuleService, Logger } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { validateBackendEnvironment } from "../../lib/env";
import { createWebpayTransaction } from "../../lib/webpay-client";
import { WEBPAY_MODULE } from "../../modules/webpay";
import type WebpayModuleService from "../../modules/webpay/service";
import { initiateWebpayOperation, type InitiateWebpayInput } from "./operation";

const initiateWebpayStep = createStep(
  "initiate-webpay",
  async (input: InitiateWebpayInput, { container }) => {
    const environment = validateBackendEnvironment(process.env);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER);
    const webpayService = container.resolve<WebpayModuleService>(WEBPAY_MODULE);
    const paymentService = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT,
    );

    const result = await initiateWebpayOperation(
      {
        query,
        logger,
        webpayService,
        paymentService,
        configuration: environment.WEBPAY,
        transaction: environment.WEBPAY
          ? createWebpayTransaction(environment.WEBPAY)
          : ({ create: async () => ({}) } as never),
      },
      input,
    );

    return new StepResponse(result);
  },
);

export const initiateWebpayWorkflow = createWorkflow(
  "initiate-webpay",
  (input: InitiateWebpayInput) => {
    return new WorkflowResponse(initiateWebpayStep(input));
  },
);
