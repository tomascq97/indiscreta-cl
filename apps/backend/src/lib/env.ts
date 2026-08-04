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

export type BackendEnvironment = Record<
  RequiredBackendEnvironmentVariable,
  string
>;

export function validateBackendEnvironment(
  environment: NodeJS.ProcessEnv,
): BackendEnvironment {
  const missingVariables = requiredBackendEnvironmentVariables.filter(
    (name) => !environment[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  return Object.fromEntries(
    requiredBackendEnvironmentVariables.map((name) => [
      name,
      environment[name]!.trim(),
    ]),
  ) as BackendEnvironment;
}

export { requiredBackendEnvironmentVariables };
