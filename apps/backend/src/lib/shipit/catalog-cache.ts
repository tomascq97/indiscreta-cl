export type ShipitCatalogCache = {
  get<T>(key: string): Promise<T | null | undefined>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
};

export type MedusaCachingService = {
  get(input: { key: string }): Promise<unknown | null>;
  set(input: { key: string; data: object; ttl?: number }): Promise<void>;
  clear(input: { key: string }): Promise<void>;
};

export function createShipitCatalogCache(
  service: MedusaCachingService,
): ShipitCatalogCache {
  return {
    get: async <T>(key: string) => {
      const cached = (await service.get({ key })) as
        | { serialized?: unknown }
        | null
      if (!cached || typeof cached.serialized !== "string") return null
      try {
        return JSON.parse(cached.serialized) as T
      } catch {
        await service.clear({ key })
        return null
      }
    },
    set: async (key, value, ttlSeconds) => {
      await service.set({
        key,
        data: { serialized: JSON.stringify(value) },
        ttl: ttlSeconds,
      })
    },
    invalidate: async (key) => service.clear({ key }),
  };
}

export async function loadCachedShipitCatalog<T>(input: {
  cache: ShipitCatalogCache;
  key: string;
  ttlSeconds: number;
  load: () => Promise<T>;
}): Promise<T> {
  const cached = await input.cache.get<T>(`shipit:catalog:${input.key}`);
  if (cached !== null && cached !== undefined) return cached;
  const loaded = await input.load();
  await input.cache.set(
    `shipit:catalog:${input.key}`,
    loaded,
    input.ttlSeconds,
  );
  return loaded;
}
