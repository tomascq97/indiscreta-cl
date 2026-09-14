import { WebpayPlus } from "transbank-sdk";

import type { WebpayConfiguration } from "../env";
import { createWebpayTransaction } from "../webpay-client";

const baseConfiguration: WebpayConfiguration = {
  environment: "integration",
  commerceCode: "integration-commerce-code",
  apiKeySecret: "integration-api-key",
  returnUrl: "http://localhost:9000/store/webpay/return",
  resultUrl: "http://localhost:8000/cl/payment/result",
};

describe("createWebpayTransaction", () => {
  it.each(["integration", "production"] as const)(
    "creates a transaction for %s",
    (environment) => {
      const transaction = createWebpayTransaction({
        ...baseConfiguration,
        environment,
      });

      expect(transaction).toBeInstanceOf(WebpayPlus.Transaction);
    },
  );
});
