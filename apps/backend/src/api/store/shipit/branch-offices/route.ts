import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { ICachingModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "../../../../lib/env";
import {
  createShipitCatalogCache,
  loadCachedShipitCatalog,
} from "../../../../lib/shipit/catalog-cache";
import {
  deduplicateBranchOffices,
  type ShipitBranchOffice,
} from "../../../../lib/shipit/branch-offices";
import { ShipitPricesClient } from "../../../../lib/shipit/clients";

function queryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

export function parsePositiveIntegerQuery(
  value: unknown,
  field: string,
): number {
  const raw = queryValue(value);

  if (!raw || !/^\d+$/.test(raw)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${field} must be a positive integer`,
    );
  }

  const parsed = Number(raw);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${field} must be a positive integer`,
    );
  }

  return parsed;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const configuration = validateBackendEnvironment(process.env).SHIPIT;

  if (!configuration) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shipit is disabled",
    );
  }

  const courierId = parsePositiveIntegerQuery(
    req.query.courier_id,
    "courier_id",
  );

  const communeId = parsePositiveIntegerQuery(
    req.query.commune_id,
    "commune_id",
  );

  const cache = createShipitCatalogCache(
    req.scope.resolve<ICachingModuleService>(Modules.CACHING),
  );

  const branches = await loadCachedShipitCatalog({
    cache,
    key: `branch-offices:${courierId}`,
    ttlSeconds: configuration.catalogCacheTtlSeconds,
    load: () =>
      new ShipitPricesClient(configuration).branchOffices(courierId),
  });

  const branchOffices = deduplicateBranchOffices(
    (branches as ShipitBranchOffice[]).filter(
      (branch) =>
        branch.courier_id === courierId &&
        branch.commune_id === communeId,
    ),
  )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((branch) => ({
      id: branch.id,
      courier_id: branch.courier_id,
      courier_bo_id: branch.courier_bo_id,
      name: branch.name,
      address: branch.address,
      commune_id: branch.commune_id,
    }));

  res.setHeader(
    "Cache-Control",
    `private, max-age=${Math.min(
      configuration.catalogCacheTtlSeconds,
      3600,
    )}`,
  );

  res.status(200).json({
    branch_offices: branchOffices,
  });
}
