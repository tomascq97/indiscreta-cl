import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { ICachingModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "../../../../lib/env";
import {
  createShipitCatalogCache,
  loadCachedShipitCatalog,
} from "../../../../lib/shipit/catalog-cache";
import { ShipitApiClient } from "../../../../lib/shipit/clients";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const configuration = validateBackendEnvironment(process.env).SHIPIT;
  if (!configuration) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Shipit is disabled");
  }
  const cache = createShipitCatalogCache(
    req.scope.resolve<ICachingModuleService>(Modules.CACHING),
  );
  const communes = await loadCachedShipitCatalog({
    cache,
    key: "communes",
    ttlSeconds: configuration.catalogCacheTtlSeconds,
    load: () => new ShipitApiClient(configuration).communes(),
  });
  res.setHeader(
    "Cache-Control",
    `private, max-age=${Math.min(configuration.catalogCacheTtlSeconds, 3600)}`,
  );
  res.status(200).json({
    communes: communes
      .filter((commune) => commune.is_available !== false)
      .map((commune) => ({
        id: commune.id,
        name: commune.name,
        region: commune.region.name,
      })),
  });
}
