import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { ICachingModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "../../../../lib/env";
import {
  createShipitCatalogCache,
  loadCachedShipitCatalog,
} from "../../../../lib/shipit/catalog-cache";
import { ShipitPricesClient } from "../../../../lib/shipit/clients";

type Courier = {
  id: number;
  name: string;
  available_to_ship: boolean;
};

export function selectAvailableCouriers(couriers: Courier[]) {
  return couriers
    .filter((courier) => courier.available_to_ship)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((courier) => ({
      id: courier.id,
      name: courier.name,
    }));
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const configuration = validateBackendEnvironment(process.env).SHIPIT;

  if (!configuration) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shipit is disabled",
    );
  }

  const cache = createShipitCatalogCache(
    req.scope.resolve<ICachingModuleService>(Modules.CACHING),
  );

  const couriers = await loadCachedShipitCatalog({
    cache,
    key: "couriers",
    ttlSeconds: configuration.catalogCacheTtlSeconds,
    load: () => new ShipitPricesClient(configuration).couriers(),
  });

  const availableCouriers = selectAvailableCouriers(couriers);

  res.setHeader(
    "Cache-Control",
    `private, max-age=${Math.min(
      configuration.catalogCacheTtlSeconds,
      3600,
    )}`,
  );

  res.status(200).json({
    couriers: availableCouriers,
  });
}
