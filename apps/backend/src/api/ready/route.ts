import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type {
  ICachingModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

import { checkReadiness } from "../../lib/readiness";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const result = await checkReadiness(() => {
    const database = req.scope.resolve<IStoreModuleService>(Modules.STORE);
    const caching = req.scope.resolve<ICachingModuleService | undefined>(
      Modules.CACHING,
      { allowUnregistered: true },
    );

    return { database, caching };
  });

  res.status(result.statusCode).json(result.body);
}
