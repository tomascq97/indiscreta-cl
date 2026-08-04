import type {
  ICachingModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";

type ReadinessDependencies = {
  database: Pick<IStoreModuleService, "listStores">;
  caching?: Pick<ICachingModuleService, "get">;
};

export type ReadinessResult = {
  statusCode: 200 | 503;
  body: {
    status: "ready" | "unavailable";
  };
};

export async function checkReadiness(
  resolveDependencies: () => ReadinessDependencies,
): Promise<ReadinessResult> {
  try {
    const dependencies = resolveDependencies();

    await dependencies.database.listStores({}, { select: ["id"], take: 1 });

    if (dependencies.caching) {
      await dependencies.caching.get({ key: "indiscreta-readiness" });
    }

    return {
      statusCode: 200,
      body: { status: "ready" },
    };
  } catch {
    return {
      statusCode: 503,
      body: { status: "unavailable" },
    };
  }
}
