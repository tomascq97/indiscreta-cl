type RedisModule = {
  resolve: string;
  options: Record<string, unknown>;
};

export const redisModuleResolvers = {
  eventBus: "@medusajs/medusa/event-bus-redis",
  workflowEngine: "@medusajs/medusa/workflow-engine-redis",
  locking: "@medusajs/medusa/locking",
  lockingProvider: "@medusajs/medusa/locking-redis",
  caching: "@medusajs/medusa/caching",
  cachingProvider: "@medusajs/caching-redis",
} as const;

export function buildRedisModules(redisUrl?: string): RedisModule[] {
  if (!redisUrl) {
    return [];
  }

  return [
    {
      resolve: redisModuleResolvers.eventBus,
      options: { redisUrl },
    },
    {
      resolve: redisModuleResolvers.workflowEngine,
      options: {
        redis: {
          redisUrl,
        },
      },
    },
    {
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
    },
    {
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
    },
  ];
}
