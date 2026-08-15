import { Environment, Options, WebpayPlus } from "transbank-sdk";

import type { WebpayConfiguration } from "./env";

const transbankEnvironments = {
  integration: Environment.Integration,
  production: Environment.Production,
} as const;

export function createWebpayTransaction(
  configuration: WebpayConfiguration,
): InstanceType<typeof WebpayPlus.Transaction> {
  const options = new Options(
    configuration.commerceCode,
    configuration.apiKeySecret,
    transbankEnvironments[configuration.environment],
  );

  return new WebpayPlus.Transaction(options);
}
