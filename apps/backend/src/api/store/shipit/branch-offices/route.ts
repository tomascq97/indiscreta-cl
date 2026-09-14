import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { ICachingModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "../../../../lib/env";
import {
  createShipitCatalogCache,
  loadCachedShipitCatalog,
} from "../../../../lib/shipit/catalog-cache";
import { ShipitPricesClient } from "../../../../lib/shipit/clients";

type BranchOffice = {
  id: number;
  address: string;
  commune_id: number;
  courier_bo_id: string;
  courier_id: number;
  name: string;
};

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

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function areDuplicateBranchOffices(
  left: BranchOffice,
  right: BranchOffice,
): boolean {
  if (
    left.courier_id !== right.courier_id ||
    left.commune_id !== right.commune_id
  ) {
    return false;
  }

  const leftCourierBranchId = normalizeText(left.courier_bo_id);
  const rightCourierBranchId = normalizeText(right.courier_bo_id);

  const sameCourierBranchId =
    leftCourierBranchId.length > 0 &&
    rightCourierBranchId.length > 0 &&
    leftCourierBranchId === rightCourierBranchId;

  const leftAddress = normalizeText(left.address);
  const rightAddress = normalizeText(right.address);

  const sameAddress =
    leftAddress.length > 0 &&
    rightAddress.length > 0 &&
    leftAddress === rightAddress;

  return sameCourierBranchId || sameAddress;
}

export function deduplicateBranchOffices(
  branches: BranchOffice[],
): BranchOffice[] {
  const groups: BranchOffice[][] = [];

  for (const branch of branches) {
    const matchingGroups = groups.filter((group) =>
      group.some((candidate) =>
        areDuplicateBranchOffices(candidate, branch),
      ),
    );

    if (matchingGroups.length === 0) {
      groups.push([branch]);
      continue;
    }

    const merged = [
      branch,
      ...matchingGroups.flat(),
    ];

    for (const group of matchingGroups) {
      const index = groups.indexOf(group);
      if (index >= 0) {
        groups.splice(index, 1);
      }
    }

    groups.push(merged);
  }

  return groups.map((group) =>
    group.reduce((selected, branch) =>
      branch.id < selected.id ? branch : selected,
    ),
  );
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
    branches.filter(
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


