import { buildRedisModules, redisModuleResolvers } from "../redis-modules";

describe("buildRedisModules", () => {
  it("keeps local providers when Redis is absent", () => {
    expect(buildRedisModules()).toEqual([]);
  });

  it("configures exactly Event Bus, Workflow Engine, and Locking", () => {
    const modules = buildRedisModules("redis://redis.invalid:6379");

    expect(modules).toHaveLength(3);
    expect(modules.map(({ resolve }) => resolve)).toEqual([
      redisModuleResolvers.eventBus,
      redisModuleResolvers.workflowEngine,
      redisModuleResolvers.locking,
    ]);
    expect(new Set(modules.map(({ resolve }) => resolve)).size).toBe(3);
  });

  it("uses the module-specific Redis option structures", () => {
    const redisUrl = "rediss://redis.invalid:6379";
    const [eventBus, workflowEngine] = buildRedisModules(redisUrl);

    expect(eventBus.options).toEqual({ redisUrl });
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
});
