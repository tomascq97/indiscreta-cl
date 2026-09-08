import type {
  ICachingModuleService,
  ILockingModule,
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

import { validateBackendEnvironment } from "../../lib/env";
import { createShipitCatalogCache } from "../../lib/shipit/catalog-cache";
import { ShipitApiClient } from "../../lib/shipit/clients";
import { SHIPIT_MODULE } from "../../modules/shipit";
import type ShipitModuleService from "../../modules/shipit/service";
import { quoteShipitShippingOperation } from "./operation";

export type QuoteShipitShippingInput = { cartId: string };

const quoteShipitShippingStep = createStep(
  "quote-shipit-shipping",
  async (input: QuoteShipitShippingInput, { container }) => {
    const configuration = validateBackendEnvironment(process.env).SHIPIT;
    if (!configuration) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Shipit is disabled",
      );
    }
    const service = container.resolve<ShipitModuleService>(SHIPIT_MODULE);
    const result = await quoteShipitShippingOperation(
      {
        query: container.resolve(ContainerRegistrationKeys.QUERY),
        api: new ShipitApiClient(configuration),
        cache: createShipitCatalogCache(
          container.resolve<ICachingModuleService>(Modules.CACHING),
        ),
        locking: container.resolve<ILockingModule>(Modules.LOCKING),
        configuration,
        store: {
          findByCartAndHash: async (cartId, quoteHash) =>
            (await service.listShipitQuotes({
              cart_id: cartId,
              quote_hash: quoteHash,
            })) as never,
          create: async (data) =>
            (await service.createShipitQuotes(data as never)) as never,
        },
      },
      input,
    );
    return new StepResponse(result);
  },
);

export const quoteShipitShippingWorkflow = createWorkflow(
  "quote-shipit-shipping",
  (input: QuoteShipitShippingInput) =>
    new WorkflowResponse(quoteShipitShippingStep(input)),
);
