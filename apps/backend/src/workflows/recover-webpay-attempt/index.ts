import type {
  ILockingModule,
  IPaymentModuleService,
  Logger,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { completeCartWorkflow } from "@medusajs/medusa/core-flows";

import { validateBackendEnvironment } from "../../lib/env";
import { createWebpayTransaction } from "../../lib/webpay-client";
import { WEBPAY_MODULE } from "../../modules/webpay";
import type WebpayModuleService from "../../modules/webpay/service";
import { recoverWebpayAttemptOperation } from "../process-webpay-return/operation";

export type RecoverWebpayAttemptInput = { attempt_id: string };

const recoverWebpayAttemptStep = createStep(
  "recover-webpay-attempt",
  async (input: RecoverWebpayAttemptInput, { container }) => {
    const environment = validateBackendEnvironment(process.env);
    if (!environment.WEBPAY) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Webpay is not configured",
      );
    }

    const result = await recoverWebpayAttemptOperation(
      {
        webpayService: container.resolve<WebpayModuleService>(WEBPAY_MODULE),
        paymentService: container.resolve<IPaymentModuleService>(
          Modules.PAYMENT,
        ),
        lockingService: container.resolve<ILockingModule>(Modules.LOCKING),
        logger: container.resolve<Logger>(ContainerRegistrationKeys.LOGGER),
        transaction: createWebpayTransaction(environment.WEBPAY),
        completeCart: async (cartId) => {
          const { result: cartResult } = await completeCartWorkflow(
            container,
          ).run({
            input: { id: cartId },
          });
          return cartResult as { id?: string; order?: { id: string } };
        },
      },
      input.attempt_id,
    );

    return new StepResponse(result);
  },
);

export const recoverWebpayAttemptWorkflow = createWorkflow(
  "recover-webpay-attempt",
  (input: RecoverWebpayAttemptInput) =>
    new WorkflowResponse(recoverWebpayAttemptStep(input)),
);
