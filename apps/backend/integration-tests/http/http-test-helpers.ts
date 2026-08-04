const requiredEnvironmentVariables = [
  "TEST_BACKEND_URL",
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
] as const;

export type HttpTestConfiguration = {
  backendUrl: string;
  publishableKey: string;
};

export function getHttpTestConfiguration(): HttpTestConfiguration {
  const missingVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new Error(
      `Missing required HTTP test environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const backendUrl = new URL(process.env.TEST_BACKEND_URL!);
  const hostname = backendUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    !["http:", "https:"].includes(backendUrl.protocol) ||
    !(
      hostname === "localhost" ||
      hostname === "::1" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname)
    )
  ) {
    throw new Error(
      "TEST_BACKEND_URL must use HTTP and resolve to a loopback host",
    );
  }

  return {
    backendUrl: backendUrl.toString().replace(/\/$/, ""),
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
  };
}
