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

const requiredS3EnvironmentVariables = [
  "S3_FILE_URL",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_REGION",
  "S3_BUCKET",
] as const;

const optionalS3EnvironmentVariables = [
  "S3_ENDPOINT",
  "S3_FORCE_PATH_STYLE",
] as const;

export type S3FileConfiguration = {
  fileUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
};

export type BackendEnvironment = Record<
  RequiredBackendEnvironmentVariable,
  string
> & {
  MEDUSA_WORKER_MODE: MedusaWorkerMode;
  REDIS_URL?: string;
  S3?: S3FileConfiguration;
  WEBPAY?: WebpayConfiguration;
  SHIPIT?: ShipitConfiguration;
};

export type ShipitConfiguration = {
  enabled: boolean;
  shipmentCreationEnabled: boolean;
  sandbox: boolean;
  apiBaseUrl: string;
  pricesBaseUrl: string;
  trackingBaseUrl: string;
  email: string;
  accessToken: string;
  webhookToken?: string;
  timeoutMs: number;
  readMaxRetries: number;
  originCommuneId: number;
  quoteMaxAgeSeconds: number;
  catalogCacheTtlSeconds: number;
  ratesAreNet: true;
};

const shipitHosts = {
  SHIPIT_API_BASE_URL: "api.shipit.cl",
  SHIPIT_PRICES_BASE_URL: "prices.shipit.cl",
  SHIPIT_TRACKING_BASE_URL: "courierstatus.shipit.cl",
} as const;

function parseBoolean(name: string, value?: string): boolean {
  const normalized = value?.trim() || "false";
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `${name} must be true or false`,
  );
}

function validateShipitBaseUrl(name: keyof typeof shipitHosts, value: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.hostname === shipitHosts[name] &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    ) {
      return url.origin;
    }
  } catch {
    // The error below intentionally excludes the supplied value.
  }
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `${name} must use its official Shipit HTTPS host`,
  );
}

function parseBoundedInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = value?.trim() ? Number(value) : fallback;
  if (Number.isSafeInteger(parsed) && parsed >= min && parsed <= max) {
    return parsed;
  }
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `${name} must be an integer between ${min} and ${max}`,
  );
}

function validateShipitEnvironment(
  environment: NodeJS.ProcessEnv,
): ShipitConfiguration | undefined {
  const enabled = parseBoolean("SHIPIT_ENABLED", environment.SHIPIT_ENABLED);
  const shipmentCreationEnabled = parseBoolean(
    "SHIPIT_SHIPMENT_CREATION_ENABLED",
    environment.SHIPIT_SHIPMENT_CREATION_ENABLED,
  );
  const sandbox = parseBoolean(
    "SHIPIT_SANDBOX",
    environment.SHIPIT_SANDBOX ?? "true",
  );
  if (shipmentCreationEnabled && !enabled) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "SHIPIT_SHIPMENT_CREATION_ENABLED requires SHIPIT_ENABLED=true",
    );
  }
  if (
    shipmentCreationEnabled &&
    !sandbox &&
    environment.NODE_ENV !== "production"
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "SHIPIT_SANDBOX=false with shipment creation requires NODE_ENV=production",
    );
  }
  if (!enabled) return undefined;

  if (environment.SHIPIT_RATES_ARE_NET?.trim() !== "true") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "SHIPIT_RATES_ARE_NET must be true when Shipit is enabled",
    );
  }

  const required = [
    "SHIPIT_EMAIL",
    "SHIPIT_ACCESS_TOKEN",
    "SHIPIT_ORIGIN_COMMUNE_ID",
    ...Object.keys(shipitHosts),
  ] as const;
  const missing = required.filter((name) => !environment[name]?.trim());
  if (missing.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required Shipit environment variables: ${missing.join(", ")}`,
    );
  }

  return {
    enabled,
    shipmentCreationEnabled,
    sandbox,
    apiBaseUrl: validateShipitBaseUrl(
      "SHIPIT_API_BASE_URL",
      environment.SHIPIT_API_BASE_URL!,
    ),
    pricesBaseUrl: validateShipitBaseUrl(
      "SHIPIT_PRICES_BASE_URL",
      environment.SHIPIT_PRICES_BASE_URL!,
    ),
    trackingBaseUrl: validateShipitBaseUrl(
      "SHIPIT_TRACKING_BASE_URL",
      environment.SHIPIT_TRACKING_BASE_URL!,
    ),
    email: environment.SHIPIT_EMAIL!.trim(),
    accessToken: environment.SHIPIT_ACCESS_TOKEN!.trim(),
    webhookToken: environment.SHIPIT_WEBHOOK_TOKEN?.trim() || undefined,
    timeoutMs: parseBoundedInteger(
      "SHIPIT_TIMEOUT_MS",
      environment.SHIPIT_TIMEOUT_MS,
      5_000,
      500,
      30_000,
    ),
    readMaxRetries: parseBoundedInteger(
      "SHIPIT_READ_MAX_RETRIES",
      environment.SHIPIT_READ_MAX_RETRIES,
      1,
      0,
      3,
    ),
    originCommuneId: parseBoundedInteger(
      "SHIPIT_ORIGIN_COMMUNE_ID",
      environment.SHIPIT_ORIGIN_COMMUNE_ID,
      0,
      1,
      100_000,
    ),
    quoteMaxAgeSeconds: parseBoundedInteger(
      "SHIPIT_QUOTE_MAX_AGE_SECONDS",
      environment.SHIPIT_QUOTE_MAX_AGE_SECONDS,
      900,
      60,
      86_400,
    ),
    catalogCacheTtlSeconds: parseBoundedInteger(
      "SHIPIT_CATALOG_CACHE_TTL_SECONDS",
      environment.SHIPIT_CATALOG_CACHE_TTL_SECONDS,
      21_600,
      60,
      86_400,
    ),
    ratesAreNet: true,
  };
}

export const webpayEnvironments = ["integration", "production"] as const;

export type WebpayEnvironment = (typeof webpayEnvironments)[number];

const webpayEnvironmentVariables = [
  "WEBPAY_ENVIRONMENT",
  "WEBPAY_COMMERCE_CODE",
  "WEBPAY_API_KEY_SECRET",
  "WEBPAY_RETURN_URL",
  "WEBPAY_RESULT_URL",
] as const;

export type WebpayConfiguration = {
  environment: WebpayEnvironment;
  commerceCode: string;
  apiKeySecret: string;
  returnUrl: string;
  resultUrl: string;
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

function validateHttpUrl(name: string, value: string): void {
  try {
    const protocol = new URL(value).protocol;

    if (protocol === "http:" || protocol === "https:") {
      return;
    }
  } catch {
    // The common error below intentionally excludes the supplied value.
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `${name} must be a valid URL using http: or https:`,
  );
}

function validateHttpsUrl(name: string, value: string): void {
  try {
    if (new URL(value).protocol === "https:") {
      return;
    }
  } catch {
    // The common error below intentionally excludes the supplied value.
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `${name} must be a valid URL using https: in production`,
  );
}

function isWebpayEnvironment(value: string): value is WebpayEnvironment {
  return webpayEnvironments.some((environment) => environment === value);
}

function validateWebpayEnvironment(
  environment: NodeJS.ProcessEnv,
  isProduction: boolean,
): WebpayConfiguration | undefined {
  const hasWebpayConfiguration = webpayEnvironmentVariables.some((name) =>
    environment[name]?.trim(),
  );

  if (!hasWebpayConfiguration && !isProduction) {
    return undefined;
  }

  const missingVariables = webpayEnvironmentVariables.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required Webpay environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const webpayEnvironment = environment.WEBPAY_ENVIRONMENT!.trim();

  if (!isWebpayEnvironment(webpayEnvironment)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `WEBPAY_ENVIRONMENT must be one of: ${webpayEnvironments.join(", ")}`,
    );
  }

  if (isProduction && webpayEnvironment !== "production") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Production requires WEBPAY_ENVIRONMENT=production",
    );
  }

  const returnUrl = environment.WEBPAY_RETURN_URL!.trim();
  const resultUrl = environment.WEBPAY_RESULT_URL!.trim();

  if (isProduction) {
    validateHttpsUrl("WEBPAY_RETURN_URL", returnUrl);
    validateHttpsUrl("WEBPAY_RESULT_URL", resultUrl);
  } else {
    validateHttpUrl("WEBPAY_RETURN_URL", returnUrl);
    validateHttpUrl("WEBPAY_RESULT_URL", resultUrl);
  }

  return {
    environment: webpayEnvironment,
    commerceCode: environment.WEBPAY_COMMERCE_CODE!.trim(),
    apiKeySecret: environment.WEBPAY_API_KEY_SECRET!.trim(),
    returnUrl,
    resultUrl,
  };
}

function validateS3Environment(
  environment: NodeJS.ProcessEnv,
  isProduction: boolean,
): S3FileConfiguration | undefined {
  const allS3VariableNames = [
    ...requiredS3EnvironmentVariables,
    ...optionalS3EnvironmentVariables,
  ];
  const hasS3Configuration = allS3VariableNames.some((name) =>
    environment[name]?.trim(),
  );

  if (!hasS3Configuration && !isProduction) {
    return undefined;
  }

  const missingVariables = requiredS3EnvironmentVariables.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required S3 environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const fileUrl = environment.S3_FILE_URL!.trim();
  const endpoint = environment.S3_ENDPOINT?.trim();
  const forcePathStyleValue = environment.S3_FORCE_PATH_STYLE?.trim();

  validateHttpUrl("S3_FILE_URL", fileUrl);

  if (endpoint) {
    validateHttpUrl("S3_ENDPOINT", endpoint);
  }

  if (
    forcePathStyleValue &&
    forcePathStyleValue !== "true" &&
    forcePathStyleValue !== "false"
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "S3_FORCE_PATH_STYLE must be true or false",
    );
  }

  const forcePathStyle = forcePathStyleValue === "true";

  if (forcePathStyle && !endpoint) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "S3_ENDPOINT is required when S3_FORCE_PATH_STYLE is true",
    );
  }

  return {
    fileUrl,
    accessKeyId: environment.S3_ACCESS_KEY_ID!.trim(),
    secretAccessKey: environment.S3_SECRET_ACCESS_KEY!.trim(),
    region: environment.S3_REGION!.trim(),
    bucket: environment.S3_BUCKET!.trim(),
    ...(endpoint ? { endpoint } : {}),
    ...(forcePathStyleValue ? { forcePathStyle } : {}),
  };
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

  const s3Configuration = validateS3Environment(environment, isProduction);
  const webpayConfiguration = validateWebpayEnvironment(
    environment,
    isProduction,
  );
  const shipitConfiguration = validateShipitEnvironment(environment);

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
    ...(s3Configuration ? { S3: s3Configuration } : {}),
    ...(webpayConfiguration ? { WEBPAY: webpayConfiguration } : {}),
    ...(shipitConfiguration ? { SHIPIT: shipitConfiguration } : {}),
  };
}

export { requiredBackendEnvironmentVariables };
