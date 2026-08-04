import { MedusaError } from "@medusajs/framework/utils";

const requiredBackendEnvironmentVariables = [
  "DATABASE_URL",
  "STORE_CORS",
  "ADMIN_CORS",
  "AUTH_CORS",
  "JWT_SECRET",
  "COOKIE_SECRET",
] as const;

type RequiredBackendEnvironmentVariable =
  (typeof requiredBackendEnvironmentVariables)[number];

export const medusaWorkerModes = ["shared", "server", "worker"] as const;

export type MedusaWorkerMode = (typeof medusaWorkerModes)[number];

export type BackendEnvironment = Record<
  RequiredBackendEnvironmentVariable,
  string
> & {
  MEDUSA_WORKER_MODE: MedusaWorkerMode;
  REDIS_URL?: string;
};

function isMedusaWorkerMode(value: string): value is MedusaWorkerMode {
  return medusaWorkerModes.some((mode) => mode === value);
}

function validateRedisUrl(redisUrl: string): void {
  try {
    const protocol = new URL(redisUrl).protocol;

    if (protocol === "redis:" || protocol === "rediss:") {
      return;
    }
  } catch {
    // The common error below intentionally excludes the supplied value.
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "REDIS_URL must be a valid URL using redis: or rediss:",
  );
}

export function validateBackendEnvironment(
  environment: NodeJS.ProcessEnv,
): BackendEnvironment {
  const nodeEnvironment = environment.NODE_ENV?.trim() || "development";
  const isProduction = nodeEnvironment === "production";
  const missingVariables: string[] = requiredBackendEnvironmentVariables.filter(
    (name) => !environment[name]?.trim(),
  );

  if (isProduction && !environment.MEDUSA_WORKER_MODE?.trim()) {
    missingVariables.push("MEDUSA_WORKER_MODE");
  }

  if (isProduction && !environment.REDIS_URL?.trim()) {
    missingVariables.push("REDIS_URL");
  }

  if (isProduction && environment.MEDUSA_FF_CACHING?.trim() !== "true") {
    missingVariables.push("MEDUSA_FF_CACHING");
  }

  if (missingVariables.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const workerMode = environment.MEDUSA_WORKER_MODE?.trim() || "shared";

  if (!isMedusaWorkerMode(workerMode)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `MEDUSA_WORKER_MODE must be one of: ${medusaWorkerModes.join(", ")}`,
    );
  }

  const redisUrl = environment.REDIS_URL?.trim();

  if (redisUrl) {
    validateRedisUrl(redisUrl);
  }

  const requiredEnvironment = Object.fromEntries(
    requiredBackendEnvironmentVariables.map((name) => [
      name,
      environment[name]!.trim(),
    ]),
  ) as Record<RequiredBackendEnvironmentVariable, string>;

  return {
    ...requiredEnvironment,
    MEDUSA_WORKER_MODE: workerMode,
    ...(redisUrl ? { REDIS_URL: redisUrl } : {}),
  };
}

export { requiredBackendEnvironmentVariables };
