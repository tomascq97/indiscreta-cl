import type {
  ILockingModule,
  IPaymentModuleService,
  Logger,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

type Attempt = Record<string, unknown> & {
  id: string;
  state: string;
  cart_id: string;
  payment_collection_id: string;
  payment_session_id: string;
  provider_id: string;
  buy_order: string;
  session_id: string;
  amount: unknown;
  currency_code: string;
  token?: string | null;
  payment_id?: string | null;
  order_id?: string | null;
  committed_at?: Date | string | null;
  transbank_status?: string | null;
};

type WebpayService = {
  listWebpayAttempts(
    filters: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<Attempt[]>;
  retrieveWebpayAttempt(id: string): Promise<Attempt>;
  updateWebpayAttempts(data: Record<string, unknown>): Promise<Attempt>;
};

type PaymentService = Pick<
  IPaymentModuleService,
  "updatePaymentSession" | "authorizePaymentSession"
>;

type TransactionResponse = Record<string, unknown> & {
  status?: unknown;
  response_code?: unknown;
  amount?: unknown;
  buy_order?: unknown;
  session_id?: unknown;
  authorization_code?: unknown;
  payment_type_code?: unknown;
  installments_number?: unknown;
  transaction_date?: unknown;
  card_detail?: { card_number?: unknown };
};

type Transaction = {
  commit(token: string): Promise<TransactionResponse>;
  status(token: string): Promise<TransactionResponse>;
};

export type WebpayReturnInput = {
  token_ws?: string;
  TBK_TOKEN?: string;
  TBK_ORDEN_COMPRA?: string;
  TBK_ID_SESION?: string;
};

export type ProcessWebpayReturnDependencies = {
  webpayService: WebpayService;
  paymentService: PaymentService;
  lockingService: Pick<ILockingModule, "execute">;
  transaction: Transaction;
  completeCart(
    cartId: string,
  ): Promise<{ id?: string; order?: { id: string } }>;
  logger: Logger;
};

const terminalStates = new Set([
  "completed",
  "rejected",
  "cancelled",
  "inconsistent",
  "expired",
  "manual_review",
]);
const failedTransbankStatuses = new Set([
  "FAILED",
  "REVERSED",
  "NULLIFIED",
  "PARTIALLY_NULLIFIED",
]);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

function number(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function allowListedResponse(response: TransactionResponse) {
  const cardNumber = text(response.card_detail?.card_number);
  const transactionDateText = text(response.transaction_date);
  const transactionDate = transactionDateText
    ? new Date(transactionDateText)
    : undefined;

  return {
    transbank_status: text(response.status) ?? null,
    response_code: number(response.response_code) ?? null,
    authorization_code: text(response.authorization_code) ?? null,
    payment_type_code: text(response.payment_type_code) ?? null,
    installments_number: number(response.installments_number) ?? null,
    transaction_date:
      transactionDate && !Number.isNaN(transactionDate.getTime())
        ? transactionDate
        : null,
    card_last_four: cardNumber ? cardNumber.slice(-4) : null,
  };
}

function classifyResponse(attempt: Attempt, response: TransactionResponse) {
  const responseCode = number(response.response_code);
  const status = text(response.status);

  if (
    attempt.currency_code.toLowerCase() !== "clp" ||
    attempt.provider_id !== "pp_webpay-plus_webpay" ||
    number(response.amount) !== Number(attempt.amount) ||
    text(response.buy_order) !== attempt.buy_order ||
    text(response.session_id) !== attempt.session_id
  ) {
    return "inconsistent" as const;
  }

  if (status === "AUTHORIZED" && responseCode === 0) {
    return "approved" as const;
  }

  if (
    failedTransbankStatuses.has(status ?? "") ||
    (responseCode !== undefined && responseCode !== 0)
  ) {
    return "rejected" as const;
  }

  return "unknown" as const;
}

async function updatePaymentSessionForAuthorization(
  dependencies: ProcessWebpayReturnDependencies,
  attempt: Attempt,
) {
  await dependencies.paymentService.updatePaymentSession({
    id: attempt.payment_session_id,
    amount: Number(attempt.amount),
    currency_code: attempt.currency_code,
    data: {
      attempt_id: attempt.id,
      buy_order: attempt.buy_order,
      session_id: attempt.session_id,
      token: attempt.token,
      webpay_state: "approved_validated",
      amount: Number(attempt.amount),
      currency_code: attempt.currency_code,
    },
  });
}

async function reconcileMedusa(
  dependencies: ProcessWebpayReturnDependencies,
  attempt: Attempt,
): Promise<Attempt> {
  let current = attempt;

  if (!current.payment_id) {
    current = await dependencies.webpayService.updateWebpayAttempts({
      id: current.id,
      state: "medusa_authorizing",
    });

    try {
      await updatePaymentSessionForAuthorization(dependencies, current);
      const payment = await dependencies.paymentService.authorizePaymentSession(
        current.payment_session_id,
        {},
      );

      if (!payment?.id) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Payment was not created",
        );
      }
      current = await dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "medusa_authorized",
        payment_id: payment.id,
        failure_code: null,
      });
    } catch {
      return dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "recovery_required",
        failure_code: "medusa_authorization_error",
      });
    }
  }

  if (!current.order_id) {
    current = await dependencies.webpayService.updateWebpayAttempts({
      id: current.id,
      state: "order_completing",
    });

    try {
      const result = await dependencies.completeCart(current.cart_id);
      const orderId = result.order?.id ?? result.id;
      if (!orderId) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Order was not created",
        );
      }

      current = await dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "completed",
        order_id: orderId,
        completed_at: new Date(),
        failure_code: null,
      });
    } catch {
      return dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "recovery_required",
        failure_code: "cart_completion_error",
      });
    }
  }

  return current;
}

async function persistTransactionResult(
  dependencies: ProcessWebpayReturnDependencies,
  attempt: Attempt,
  response: TransactionResponse,
) {
  const classification = classifyResponse(attempt, response);
  const fields = allowListedResponse(response);

  if (classification === "inconsistent") {
    dependencies.logger.error(
      JSON.stringify({
        event: "webpay.return.inconsistent",
        attempt_id: attempt.id,
        buy_order: attempt.buy_order,
      }),
    );
    return dependencies.webpayService.updateWebpayAttempts({
      id: attempt.id,
      state: "inconsistent",
      failure_code: "transaction_correlation_mismatch",
      ...fields,
    });
  }

  if (classification === "rejected") {
    return dependencies.webpayService.updateWebpayAttempts({
      id: attempt.id,
      state: "rejected",
      failure_code: "transbank_rejected",
      ...fields,
    });
  }

  if (classification === "unknown") {
    return dependencies.webpayService.updateWebpayAttempts({
      id: attempt.id,
      state: "recovery_required",
      failure_code: "transbank_status_unknown",
      ...fields,
    });
  }

  return dependencies.webpayService.updateWebpayAttempts({
    id: attempt.id,
    state: "approved_validated",
    committed_at: new Date(),
    failure_code: null,
    ...fields,
  });
}

async function processTokenReturn(
  dependencies: ProcessWebpayReturnDependencies,
  token: string,
) {
  const attempt = (
    await dependencies.webpayService.listWebpayAttempts({ token }, { take: 1 })
  )[0];
  if (!attempt) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Unknown Webpay token");
  }

  return dependencies.lockingService.execute(
    `webpay:attempt:${attempt.id}`,
    async () => {
      let current = await dependencies.webpayService.retrieveWebpayAttempt(
        attempt.id,
      );

      if (terminalStates.has(current.state)) return current;
      if (
        current.committed_at ||
        current.transbank_status === "AUTHORIZED" ||
        current.payment_id
      ) {
        return reconcileMedusa(dependencies, current);
      }

      if (current.state === "committing" || current.commit_started_at) {
        let recoveredResponse: TransactionResponse;
        try {
          recoveredResponse = await dependencies.transaction.status(token);
        } catch {
          return dependencies.webpayService.updateWebpayAttempts({
            id: current.id,
            state: "recovery_required",
            failure_code: "status_unavailable_after_commit_started",
          });
        }

        current = await persistTransactionResult(
          dependencies,
          current,
          recoveredResponse,
        );
        if (current.state !== "approved_validated") return current;

        return reconcileMedusa(dependencies, current);
      }

      current = await dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "committing",
        commit_started_at: new Date(),
      });

      let response: TransactionResponse;
      try {
        response = await dependencies.transaction.commit(token);
      } catch {
        try {
          response = await dependencies.transaction.status(token);
        } catch {
          return dependencies.webpayService.updateWebpayAttempts({
            id: current.id,
            state: "recovery_required",
            failure_code: "commit_and_status_unavailable",
          });
        }
      }

      current = await persistTransactionResult(dependencies, current, response);
      if (current.state !== "approved_validated") return current;

      return reconcileMedusa(dependencies, current);
    },
    { timeout: 10 },
  );
}

async function processCancellation(
  dependencies: ProcessWebpayReturnDependencies,
  input: WebpayReturnInput,
) {
  if (!input.TBK_ORDEN_COMPRA || !input.TBK_ID_SESION) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid Webpay cancellation return",
    );
  }

  const filters: Record<string, unknown> = {
    buy_order: input.TBK_ORDEN_COMPRA,
    session_id: input.TBK_ID_SESION,
  };
  if (input.TBK_TOKEN) filters.token = input.TBK_TOKEN;

  const attempt = (
    await dependencies.webpayService.listWebpayAttempts(filters, { take: 2 })
  )[0];
  if (!attempt) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Unknown Webpay cancellation",
    );
  }

  return dependencies.lockingService.execute(
    `webpay:attempt:${attempt.id}`,
    async () => {
      const current = await dependencies.webpayService.retrieveWebpayAttempt(
        attempt.id,
      );
      if (terminalStates.has(current.state) || current.committed_at)
        return current;

      return dependencies.webpayService.updateWebpayAttempts({
        id: current.id,
        state: "cancelled",
        failure_code: "user_cancelled",
      });
    },
    { timeout: 10 },
  );
}

export async function processWebpayReturnOperation(
  dependencies: ProcessWebpayReturnDependencies,
  input: WebpayReturnInput,
) {
  if (input.token_ws) {
    return processTokenReturn(dependencies, input.token_ws);
  }

  return processCancellation(dependencies, input);
}

export async function recoverWebpayAttemptOperation(
  dependencies: ProcessWebpayReturnDependencies,
  attemptId: string,
) {
  const attempt =
    await dependencies.webpayService.retrieveWebpayAttempt(attemptId);

  return dependencies.lockingService.execute(
    `webpay:attempt:${attempt.id}`,
    async () => {
      let current = await dependencies.webpayService.retrieveWebpayAttempt(
        attempt.id,
      );

      if (terminalStates.has(current.state)) return current;
      if (current.state !== "recovery_required") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Webpay attempt does not require recovery",
        );
      }

      if (current.order_id) {
        return dependencies.webpayService.updateWebpayAttempts({
          id: current.id,
          state: "completed",
          completed_at: current.completed_at ?? new Date(),
          failure_code: null,
        });
      }

      if (
        current.payment_id ||
        current.committed_at ||
        current.transbank_status === "AUTHORIZED"
      ) {
        return reconcileMedusa(dependencies, current);
      }

      if (!current.token || !current.commit_started_at) {
        return dependencies.webpayService.updateWebpayAttempts({
          id: current.id,
          state: "recovery_required",
          failure_code: "manual_review_required",
        });
      }

      let response: TransactionResponse;
      try {
        response = await dependencies.transaction.status(current.token);
      } catch {
        return dependencies.webpayService.updateWebpayAttempts({
          id: current.id,
          state: "recovery_required",
          failure_code: "recovery_status_unavailable",
        });
      }

      current = await persistTransactionResult(dependencies, current, response);
      if (current.state !== "approved_validated") return current;

      return reconcileMedusa(dependencies, current);
    },
    { timeout: 10 },
  );
}
