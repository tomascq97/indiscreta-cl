import { buildRedisModules, redisModuleResolvers } from "../redis-modules";

describe("buildRedisModules", () => {
  it("keeps local providers when Redis is absent", () => {
    expect(buildRedisModules()).toEqual([]);
  });

  it("configures exactly the four Redis infrastructure modules", () => {
    const modules = buildRedisModules("redis://redis.invalid:6379");

    expect(modules).toHaveLength(4);
    expect(modules.map(({ resolve }) => resolve)).toEqual([
      redisModuleResolvers.eventBus,
      redisModuleResolvers.workflowEngine,
      redisModuleResolvers.locking,
      redisModuleResolvers.caching,
    ]);
    expect(new Set(modules.map(({ resolve }) => resolve)).size).toBe(4);
  });

  it("passes redisUrl directly to Event Bus", () => {
    const redisUrl = "rediss://redis.invalid:6379";
    const eventBus = buildRedisModules(redisUrl)[0];

    expect(eventBus.options).toEqual({ redisUrl });
  });

  it("nests redisUrl for Workflow Engine", () => {
    const redisUrl = "rediss://redis.invalid:6379";
    const workflowEngine = buildRedisModules(redisUrl)[1];

    expect(workflowEngine.options).toEqual({
      redis: {
        redisUrl,
      },
    });
  });

  it("registers Redis as the default locking provider", () => {
    const redisUrl = "redis://redis.invalid:6379";
    const locking = buildRedisModules(redisUrl)[2];

    expect(locking).toEqual({
      resolve: redisModuleResolvers.locking,
      options: {
        providers: [
          {
            resolve: redisModuleResolvers.lockingProvider,
            id: "locking-redis",
            is_default: true,
            options: { redisUrl },
          },
        ],
      },
    });
  });

  it("registers Redis as the default caching provider", () => {
    const redisUrl = "redis://redis.invalid:6379";
    const caching = buildRedisModules(redisUrl)[3];

    expect(caching).toEqual({
      resolve: redisModuleResolvers.caching,
      options: {
        providers: [
          {
            resolve: redisModuleResolvers.cachingProvider,
            id: "caching-redis",
            is_default: true,
            options: { redisUrl },
          },
        ],
      },
    });
  });
});
