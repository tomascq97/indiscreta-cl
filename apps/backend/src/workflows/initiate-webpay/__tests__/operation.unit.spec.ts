import type { WebpayConfiguration } from "../../../lib/env";
import {
  initiateWebpayOperation,
  type Attempt,
  type InitiateWebpayDependencies,
} from "../operation";

const configuration: WebpayConfiguration = {
  environment: "integration",
  commerceCode: "commerce-code",
  apiKeySecret: "secret-not-logged",
  returnUrl: "https://backend.test/webpay/return",
  resultUrl: "https://store.test/payment/result",
};

const graphCart = {
  id: "cart_01",
  total: 15990,
  currency_code: "clp",
  payment_collection: {
    id: "paycol_01",
    amount: 15990,
    currency_code: "clp",
    payment_sessions: [
      {
        id: "payses_01",
        provider_id: "pp_webpay-plus_webpay",
        amount: 15990,
        currency_code: "clp",
        status: "pending",
        data: { session_id: "payses_01" },
      },
    ],
  },
};

function createDependencies(): InitiateWebpayDependencies & {
  attempts: Array<Record<string, unknown>>;
} {
  const attempts: Attempt[] = [];

  return {
    attempts,
    configuration,
    query: {
      graph: jest.fn().mockResolvedValue({ data: [graphCart] }),
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    } as never,
    transaction: {
      create: jest.fn().mockResolvedValue({
        token: "token-01",
        url: "https://webpay.test/pay",
      }),
    },
    paymentService: {
      updatePaymentSession: jest.fn().mockResolvedValue({}),
    },
    webpayService: {
      listWebpayAttempts: jest.fn(async (filters: Record<string, unknown>) =>
        attempts.filter(
          (attempt) => attempt.initiation_key === filters.initiation_key,
        ),
      ),
      createWebpayAttempts: jest.fn(async (data: Record<string, unknown>) => {
        const attempt = {
          id: "wpa_01",
          ...data,
          token: null,
          webpay_url: null,
        };
        attempts.push(attempt as Attempt);
        return attempt as never;
      }),
      updateWebpayAttempts: jest.fn(async (data: Record<string, unknown>) => {
        const index = attempts.findIndex((attempt) => attempt.id === data.id);
        attempts[index] = { ...attempts[index], ...data } as Attempt;
        return attempts[index] as never;
      }),
    },
  };
}

const input = {
  cart_id: "cart_01",
};

describe("initiateWebpayOperation", () => {
  it("persists the attempt before calling Transaction.create and stores the response", async () => {
    const dependencies = createDependencies();
    const calls: string[] = [];
    jest
      .mocked(dependencies.webpayService.createWebpayAttempts)
      .mockImplementation(async (data) => {
        calls.push("persist");
        const attempt = {
          id: "wpa_01",
          ...data,
          token: null,
          webpay_url: null,
        };
        dependencies.attempts.push(attempt as Attempt);
        return attempt as never;
      });
    jest
      .mocked(dependencies.transaction.create)
      .mockImplementation(async () => {
        calls.push("create");
        return { token: "token-01", url: "https://webpay.test/pay" };
      });

    const result = await initiateWebpayOperation(dependencies, input);

    expect(calls).toEqual(["persist", "create"]);
    expect(dependencies.transaction.create).toHaveBeenCalledWith(
      expect.stringMatching(/^I/),
      expect.stringMatching(/^S/),
      15990,
      configuration.returnUrl,
    );
    expect(result).toMatchObject({
      attempt_id: "wpa_01",
      amount: 15990,
      currency_code: "clp",
      token: "token-01",
      webpay_url: "https://webpay.test/pay",
      webpay_state: "initialized",
    });
    expect(dependencies.paymentService.updatePaymentSession).toHaveBeenCalled();
  });

  it("rejects an invalid Transbank response and records a deterministic failure", async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.transaction.create).mockResolvedValue({});

    await expect(initiateWebpayOperation(dependencies, input)).rejects.toThrow(
      "invalid initiation response",
    );
    expect(dependencies.attempts[0]).toMatchObject({
      state: "create_failed",
      failure_code: "invalid_create_response",
    });
  });

  it("reuses an initialized attempt without another Transaction.create", async () => {
    const dependencies = createDependencies();
    const first = await initiateWebpayOperation(dependencies, input);
    const second = await initiateWebpayOperation(dependencies, input);

    expect(second).toEqual(first);
    expect(dependencies.transaction.create).toHaveBeenCalledTimes(1);
    expect(
      dependencies.webpayService.createWebpayAttempts,
    ).toHaveBeenCalledTimes(1);
  });

  it("marks SDK errors as recovery required without exposing the error", async () => {
    const dependencies = createDependencies();
    jest
      .mocked(dependencies.transaction.create)
      .mockRejectedValue(new Error("secret transport details"));

    await expect(initiateWebpayOperation(dependencies, input)).rejects.toThrow(
      "result is ambiguous",
    );
    expect(dependencies.attempts[0]).toMatchObject({
      state: "recovery_required",
      failure_code: "create_sdk_error",
    });
    expect(dependencies.logger.error).toHaveBeenCalledWith(
      expect.stringContaining("webpay.initiation.create_ambiguous"),
    );
    expect(dependencies.logger.error).not.toHaveBeenCalledWith(
      expect.stringContaining("secret transport details"),
    );
  });

  it("fails before persistence when Webpay is disabled", async () => {
    const dependencies = createDependencies();
    dependencies.configuration = undefined;

    await expect(initiateWebpayOperation(dependencies, input)).rejects.toThrow(
      "Webpay is disabled",
    );
    expect(dependencies.query.graph).not.toHaveBeenCalled();
    expect(
      dependencies.webpayService.createWebpayAttempts,
    ).not.toHaveBeenCalled();
    expect(dependencies.transaction.create).not.toHaveBeenCalled();
  });

  it("rejects inconsistent server-side cart amounts before persistence", async () => {
    const dependencies = createDependencies();
    jest.mocked(dependencies.query.graph).mockResolvedValue({
      data: [{ ...graphCart, total: 15991 }],
    });

    await expect(initiateWebpayOperation(dependencies, input)).rejects.toThrow(
      "amounts are inconsistent",
    );
    expect(
      dependencies.webpayService.createWebpayAttempts,
    ).not.toHaveBeenCalled();
    expect(dependencies.transaction.create).not.toHaveBeenCalled();
  });
});
