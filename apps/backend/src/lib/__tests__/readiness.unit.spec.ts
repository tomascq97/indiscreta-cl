import type {
  ICachingModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";

import { checkReadiness } from "../readiness";

type DatabaseCheck = Pick<IStoreModuleService, "listStores">;
type CachingCheck = Pick<ICachingModuleService, "get">;

describe("backend readiness", () => {
  const database: DatabaseCheck = {
    listStores: jest.fn().mockResolvedValue([]),
  };
  const caching: CachingCheck = {
    get: jest.fn().mockResolvedValue(null),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports ready after PostgreSQL and Redis respond", async () => {
    const result = await checkReadiness(() => ({ database, caching }));

    expect(result).toEqual({
      statusCode: 200,
      body: { status: "ready" },
    });
    expect(database.listStores).toHaveBeenCalledWith(
      {},
      { select: ["id"], take: 1 },
    );
    expect(caching.get).toHaveBeenCalledWith({
      key: "indiscreta-readiness",
    });
  });

  it("reports unavailable and sanitizes a PostgreSQL failure", async () => {
    const databaseFailure: DatabaseCheck = {
      listStores: jest
        .fn()
        .mockRejectedValue(new Error("postgresql://sensitive-database-value")),
    };

    const result = await checkReadiness(() => ({
      database: databaseFailure,
      caching,
    }));

    expect(result).toEqual({
      statusCode: 503,
      body: { status: "unavailable" },
    });
    expect(JSON.stringify(result)).not.toContain("sensitive-database-value");
    expect(caching.get).not.toHaveBeenCalled();
  });

  it("reports unavailable and sanitizes a Redis failure", async () => {
    const cachingFailure: CachingCheck = {
      get: jest
        .fn()
        .mockRejectedValue(new Error("redis://sensitive-cache-value")),
    };

    const result = await checkReadiness(() => ({
      database,
      caching: cachingFailure,
    }));

    expect(result).toEqual({
      statusCode: 503,
      body: { status: "unavailable" },
    });
    expect(JSON.stringify(result)).not.toContain("sensitive-cache-value");
  });

  it("allows environments where Redis is intentionally not configured", async () => {
    const result = await checkReadiness(() => ({ database }));

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({ status: "ready" });
  });

  it("reports unavailable when dependency resolution fails", async () => {
    const result = await checkReadiness(() => {
      throw new Error("redis://sensitive-resolution-value");
    });

    expect(result).toEqual({
      statusCode: 503,
      body: { status: "unavailable" },
    });
    expect(JSON.stringify(result)).not.toContain("sensitive-resolution-value");
  });
});
