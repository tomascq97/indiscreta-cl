import type { ProcessWebpayReturnDependencies } from "../operation";
import {
  processWebpayReturnOperation,
  recoverWebpayAttemptOperation,
} from "../operation";

type Attempt = Record<string, unknown> & {
  id: string;
  state: string;
  cart_id: string;
  payment_collection_id: string;
  payment_session_id: string;
  provider_id: string;
  buy_order: string;
  session_id: string;
  amount: number;
  currency_code: string;
  token: string;
  payment_id: string | null;
  order_id: string | null;
  committed_at: Date | null;
  transbank_status: string | null;
};

const authorizedResponse = {
  status: "AUTHORIZED",
  response_code: 0,
  amount: 15990,
  buy_order: "wp-123",
  session_id: "wps-123",
  authorization_code: "1213",
  payment_type_code: "VD",
  installments_number: 0,
  transaction_date: "2026-08-14T12:00:00.000Z",
  card_detail: { card_number: "6623" },
};

function createHarness(overrides?: {
  commit?: jest.Mock;
  status?: jest.Mock;
  authorize?: jest.Mock;
  complete?: jest.Mock;
}) {
  let attempt: Attempt = {
    id: "wpa_123",
    state: "initialized",
    cart_id: "cart_123",
    payment_collection_id: "pay_col_123",
    payment_session_id: "payses_123",
    provider_id: "pp_webpay-plus_webpay",
    buy_order: "wp-123",
    session_id: "wps-123",
    amount: 15990,
    currency_code: "clp",
    token: "token-123",
    payment_id: null,
    order_id: null,
    committed_at: null,
    transbank_status: null,
  };
  let lockTail: Promise<unknown> = Promise.resolve();

  const commit =
    overrides?.commit ?? jest.fn().mockResolvedValue(authorizedResponse);
  const status =
    overrides?.status ?? jest.fn().mockResolvedValue(authorizedResponse);
  const authorize =
    overrides?.authorize ?? jest.fn().mockResolvedValue({ id: "pay_123" });
  const complete =
    overrides?.complete ?? jest.fn().mockResolvedValue({ id: "order_123" });
  const updateSession = jest.fn().mockResolvedValue({});

  const dependencies = {
    webpayService: {
      listWebpayAttempts: jest.fn(async (filters: Record<string, unknown>) =>
        Object.entries(filters).every(([key, value]) => attempt[key] === value)
          ? [attempt]
          : [],
      ),
      retrieveWebpayAttempt: jest.fn(async () => attempt),
      updateWebpayAttempts: jest.fn(async (data: Record<string, unknown>) => {
        attempt = { ...attempt, ...data } as Attempt;
        return attempt;
      }),
    },
    paymentService: {
      updatePaymentSession: updateSession,
      authorizePaymentSession: authorize,
    },
    lockingService: {
      execute: jest.fn(
        async (_key: string | string[], job: () => Promise<unknown>) => {
          const run = lockTail.then(job, job);
          lockTail = run.then(
            () => undefined,
            () => undefined,
          );
          return run;
        },
      ),
    },
    transaction: { commit, status },
    completeCart: complete,
    logger: { error: jest.fn() },
  } as unknown as ProcessWebpayReturnDependencies;

  return {
    dependencies,
    commit,
    status,
    authorize,
    complete,
    updateSession,
    getAttempt: () => attempt,
    setAttempt: (data: Partial<Attempt>) => {
      attempt = { ...attempt, ...data };
    },
  };
}

describe("processWebpayReturnOperation", () => {
  it("commits, authorizes and completes an approved payment", async () => {
    const harness = createHarness();

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result).toMatchObject({
      state: "completed",
      payment_id: "pay_123",
      order_id: "order_123",
      response_code: 0,
      card_last_four: "6623",
    });
    expect(harness.commit).toHaveBeenCalledTimes(1);
    expect(harness.status).not.toHaveBeenCalled();
    expect(harness.authorize).toHaveBeenCalledTimes(1);
    expect(harness.complete).toHaveBeenCalledWith("cart_123");
    expect(harness.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "payses_123", amount: 15990 }),
    );
  });

  it.each([
    ["a non-zero response code", { ...authorizedResponse, response_code: -1 }],
    ["a failed status", { ...authorizedResponse, status: "FAILED" }],
  ])("rejects %s without authorizing Medusa", async (_name, response) => {
    const harness = createHarness({
      commit: jest.fn().mockResolvedValue(response),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result.state).toBe("rejected");
    expect(harness.authorize).not.toHaveBeenCalled();
    expect(harness.complete).not.toHaveBeenCalled();
  });

  it.each([
    ["amount", { ...authorizedResponse, amount: 1 }],
    ["buy order", { ...authorizedResponse, buy_order: "other" }],
    ["session id", { ...authorizedResponse, session_id: "other" }],
  ])(
    "marks an inconsistent %s as non-authorizable",
    async (_name, response) => {
      const harness = createHarness({
        commit: jest.fn().mockResolvedValue(response),
      });

      const result = await processWebpayReturnOperation(harness.dependencies, {
        token_ws: "token-123",
      });

      expect(result.state).toBe("inconsistent");
      expect(harness.authorize).not.toHaveBeenCalled();
    },
  );

  it("rejects an unknown token", async () => {
    const harness = createHarness();

    await expect(
      processWebpayReturnOperation(harness.dependencies, {
        token_ws: "unknown",
      }),
    ).rejects.toThrow("Unknown Webpay token");
    expect(harness.commit).not.toHaveBeenCalled();
  });

  it("serializes a double return and commits only once", async () => {
    const harness = createHarness();

    const [first, second] = await Promise.all([
      processWebpayReturnOperation(harness.dependencies, {
        token_ws: "token-123",
      }),
      processWebpayReturnOperation(harness.dependencies, {
        token_ws: "token-123",
      }),
    ]);

    expect(first.state).toBe("completed");
    expect(second.state).toBe("completed");
    expect(harness.commit).toHaveBeenCalledTimes(1);
    expect(harness.authorize).toHaveBeenCalledTimes(1);
    expect(harness.complete).toHaveBeenCalledTimes(1);
  });

  it("recovers an uncertain commit through status", async () => {
    const harness = createHarness({
      commit: jest.fn().mockRejectedValue(new Error("timeout")),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result.state).toBe("completed");
    expect(harness.status).toHaveBeenCalledWith("token-123");
  });

  it("persists a confirmed failure recovered through status", async () => {
    const harness = createHarness({
      commit: jest.fn().mockRejectedValue(new Error("timeout")),
      status: jest
        .fn()
        .mockResolvedValue({ ...authorizedResponse, status: "FAILED" }),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result.state).toBe("rejected");
    expect(harness.authorize).not.toHaveBeenCalled();
  });

  it("leaves an unavailable commit and status recoverable", async () => {
    const harness = createHarness({
      commit: jest.fn().mockRejectedValue(new Error("timeout")),
      status: jest.fn().mockRejectedValue(new Error("unavailable")),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result).toMatchObject({
      state: "recovery_required",
      failure_code: "commit_and_status_unavailable",
    });
  });

  it("recovers a later retry through status without a second commit", async () => {
    const commit = jest.fn().mockRejectedValue(new Error("timeout"));
    const status = jest
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(authorizedResponse);
    const harness = createHarness({ commit, status });

    const first = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });
    const second = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(first.state).toBe("recovery_required");
    expect(second.state).toBe("completed");
    expect(commit).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledTimes(2);
  });

  it("records a documented cancellation return", async () => {
    const harness = createHarness();

    const result = await processWebpayReturnOperation(harness.dependencies, {
      TBK_TOKEN: "token-123",
      TBK_ORDEN_COMPRA: "wp-123",
      TBK_ID_SESION: "wps-123",
    });

    expect(result).toMatchObject({
      state: "cancelled",
      failure_code: "user_cancelled",
    });
    expect(harness.commit).not.toHaveBeenCalled();
  });

  it("keeps a Medusa authorization failure recoverable", async () => {
    const harness = createHarness({
      authorize: jest.fn().mockRejectedValue(new Error("payment failure")),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result).toMatchObject({
      state: "recovery_required",
      failure_code: "medusa_authorization_error",
      committed_at: expect.any(Date),
    });
    expect(harness.complete).not.toHaveBeenCalled();
  });

  it("retries cart completion without committing or authorizing twice", async () => {
    const complete = jest
      .fn()
      .mockRejectedValueOnce(new Error("order failure"))
      .mockResolvedValueOnce({ id: "order_123" });
    const harness = createHarness({ complete });

    const first = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });
    const second = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(first.state).toBe("recovery_required");
    expect(second.state).toBe("completed");
    expect(harness.commit).toHaveBeenCalledTimes(1);
    expect(harness.authorize).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("does not treat an indeterminate status as rejection", async () => {
    const harness = createHarness({
      commit: jest.fn().mockRejectedValue(new Error("timeout")),
      status: jest.fn().mockResolvedValue({
        ...authorizedResponse,
        status: "INITIALIZED",
        response_code: undefined,
      }),
    });

    const result = await processWebpayReturnOperation(harness.dependencies, {
      token_ws: "token-123",
    });

    expect(result.state).toBe("recovery_required");
    expect(harness.authorize).not.toHaveBeenCalled();
  });
});

describe("recoverWebpayAttemptOperation", () => {
  it("recovers an authorized status without calling commit", async () => {
    const harness = createHarness();
    harness.setAttempt({
      state: "recovery_required",
      commit_started_at: new Date(),
    });

    const result = await recoverWebpayAttemptOperation(
      harness.dependencies,
      "wpa_123",
    );

    expect(result.state).toBe("completed");
    expect(harness.status).toHaveBeenCalledTimes(1);
    expect(harness.commit).not.toHaveBeenCalled();
  });

  it("continues from an existing payment without authorizing again", async () => {
    const harness = createHarness();
    harness.setAttempt({
      state: "recovery_required",
      payment_id: "pay_existing",
      committed_at: new Date(),
      transbank_status: "AUTHORIZED",
    });

    const result = await recoverWebpayAttemptOperation(
      harness.dependencies,
      "wpa_123",
    );

    expect(result).toMatchObject({
      state: "completed",
      payment_id: "pay_existing",
      order_id: "order_123",
    });
    expect(harness.authorize).not.toHaveBeenCalled();
    expect(harness.status).not.toHaveBeenCalled();
    expect(harness.commit).not.toHaveBeenCalled();
  });

  it("marks an attempt with an existing order completed without side effects", async () => {
    const harness = createHarness();
    harness.setAttempt({
      state: "recovery_required",
      payment_id: "pay_existing",
      order_id: "order_existing",
    });

    const result = await recoverWebpayAttemptOperation(
      harness.dependencies,
      "wpa_123",
    );

    expect(result).toMatchObject({
      state: "completed",
      order_id: "order_existing",
    });
    expect(harness.authorize).not.toHaveBeenCalled();
    expect(harness.complete).not.toHaveBeenCalled();
    expect(harness.status).not.toHaveBeenCalled();
    expect(harness.commit).not.toHaveBeenCalled();
  });

  it("serializes concurrent recovery and performs status once", async () => {
    const harness = createHarness();
    harness.setAttempt({
      state: "recovery_required",
      commit_started_at: new Date(),
    });

    const [first, second] = await Promise.all([
      recoverWebpayAttemptOperation(harness.dependencies, "wpa_123"),
      recoverWebpayAttemptOperation(harness.dependencies, "wpa_123"),
    ]);

    expect(first.state).toBe("completed");
    expect(second.state).toBe("completed");
    expect(harness.status).toHaveBeenCalledTimes(1);
    expect(harness.commit).not.toHaveBeenCalled();
    expect(harness.authorize).toHaveBeenCalledTimes(1);
    expect(harness.complete).toHaveBeenCalledTimes(1);
  });
});
