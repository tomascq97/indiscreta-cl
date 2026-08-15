import type { IPaymentModuleService, Logger } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import type { WebpayConfiguration } from "../../lib/env";
import { WEBPAY_PROVIDER_ID } from "../../modules/webpay-payment/service";
import {
  createInitiationKey,
  generateBuyOrder,
  generateWebpaySessionId,
} from "./identifiers";
import { validateClpAmount } from "./validation";

export type InitiateWebpayInput = {
  cart_id: string;
};

type PaymentSession = {
  id: string;
  provider_id: string;
  amount: unknown;
  currency_code: string;
  status: string;
  data?: Record<string, unknown> | null;
};

type CartGraph = {
  id: string;
  total: unknown;
  currency_code: string;
  payment_collection?: {
    id: string;
    amount: unknown;
    currency_code: string;
    payment_sessions?: PaymentSession[];
  } | null;
};

export type Attempt = {
  id: string;
  state: unknown;
  cart_id: string;
  payment_collection_id: string;
  payment_session_id: string;
  provider_id: string;
  initiation_key: string;
  buy_order: string;
  session_id: string;
  amount: unknown;
  currency_code: string;
  token?: string | null;
  webpay_url?: string | null;
};

type Query = {
  graph(input: Record<string, unknown>): Promise<{ data: unknown[] }>;
};

type WebpayService = {
  listWebpayAttempts(
    filters: Record<string, unknown>,
    config?: Record<string, unknown>,
  ): Promise<Attempt[]>;
  createWebpayAttempts(data: Record<string, unknown>): Promise<Attempt>;
  updateWebpayAttempts(data: Record<string, unknown>): Promise<Attempt>;
};

type Transaction = {
  create(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string,
  ): Promise<{ token?: unknown; url?: unknown }>;
};

export type InitiateWebpayDependencies = {
  query: Query;
  webpayService: WebpayService;
  paymentService: Pick<IPaymentModuleService, "updatePaymentSession">;
  transaction: Transaction;
  configuration?: WebpayConfiguration;
  logger: Logger;
};

const activeStatuses = new Set([
  "pending",
  "requires_more",
  "pending_authorization",
]);

function selectPaymentSession(
  cart: CartGraph,
  providerId: string,
): PaymentSession {
  const sessions = (cart.payment_collection?.payment_sessions ?? []).filter(
    (session) =>
      session.provider_id === providerId && activeStatuses.has(session.status),
  );

  if (sessions.length !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Expected exactly one active Webpay payment session",
    );
  }

  return sessions[0];
}

function assertAttemptCorrelation(
  attempt: Attempt,
  expected: Omit<Attempt, "id" | "state" | "token" | "webpay_url">,
): void {
  const matches =
    attempt.cart_id === expected.cart_id &&
    attempt.payment_collection_id === expected.payment_collection_id &&
    attempt.payment_session_id === expected.payment_session_id &&
    attempt.provider_id === expected.provider_id &&
    attempt.initiation_key === expected.initiation_key &&
    attempt.buy_order === expected.buy_order &&
    attempt.session_id === expected.session_id &&
    Number(attempt.amount) === Number(expected.amount) &&
    attempt.currency_code === expected.currency_code;

  if (!matches) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Existing Webpay attempt correlation is inconsistent",
    );
  }
}

async function findAttempt(
  service: WebpayService,
  initiationKey: string,
): Promise<Attempt | undefined> {
  return (
    await service.listWebpayAttempts(
      { initiation_key: initiationKey },
      { take: 1 },
    )
  )[0];
}

function operationalData(attempt: Attempt, environment: string) {
  return {
    attempt_id: attempt.id,
    buy_order: attempt.buy_order,
    session_id: attempt.session_id,
    token: attempt.token,
    webpay_url: attempt.webpay_url,
    webpay_state: attempt.state,
    environment,
    amount: Number(attempt.amount),
    currency_code: attempt.currency_code,
  };
}

export async function initiateWebpayOperation(
  dependencies: InitiateWebpayDependencies,
  input: InitiateWebpayInput,
) {
  const { configuration } = dependencies;

  if (!configuration) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Webpay is disabled because its environment is not configured",
    );
  }

  const { data } = await dependencies.query.graph({
    entity: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "payment_collection.id",
      "payment_collection.amount",
      "payment_collection.currency_code",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.amount",
      "payment_collection.payment_sessions.currency_code",
      "payment_collection.payment_sessions.status",
      "payment_collection.payment_sessions.data",
    ],
    filters: { id: input.cart_id },
    options: { isList: false },
  });
  const cart = data[0] as CartGraph | undefined;

  if (!cart?.payment_collection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Cart or payment collection not found",
    );
  }

  const paymentSession = selectPaymentSession(cart, WEBPAY_PROVIDER_ID);
  const amount = validateClpAmount(
    paymentSession.amount,
    paymentSession.currency_code,
  );
  const collectionAmount = validateClpAmount(
    cart.payment_collection.amount,
    cart.payment_collection.currency_code,
  );
  const cartAmount = validateClpAmount(cart.total, cart.currency_code);

  if (amount !== collectionAmount || amount !== cartAmount) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cart, payment collection, and payment session amounts are inconsistent",
    );
  }

  const currencyCode = paymentSession.currency_code.toLowerCase();
  const initiationKey = createInitiationKey({
    providerId: WEBPAY_PROVIDER_ID,
    paymentSessionId: paymentSession.id,
    amount,
    currencyCode,
  });
  let attempt = await findAttempt(dependencies.webpayService, initiationKey);
  let created = false;

  if (!attempt) {
    const candidate = {
      state: "creating",
      cart_id: cart.id,
      payment_collection_id: cart.payment_collection.id,
      payment_session_id: paymentSession.id,
      provider_id: WEBPAY_PROVIDER_ID,
      initiation_key: initiationKey,
      buy_order: generateBuyOrder(),
      session_id: generateWebpaySessionId(),
      amount,
      currency_code: currencyCode,
    };

    try {
      attempt =
        await dependencies.webpayService.createWebpayAttempts(candidate);
      created = true;
    } catch {
      attempt = await findAttempt(dependencies.webpayService, initiationKey);

      if (!attempt) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Webpay attempt could not be created or recovered",
        );
      }
    }
  }

  const expected = {
    cart_id: cart.id,
    payment_collection_id: cart.payment_collection.id,
    payment_session_id: paymentSession.id,
    provider_id: WEBPAY_PROVIDER_ID,
    initiation_key: initiationKey,
    buy_order: attempt.buy_order,
    session_id: attempt.session_id,
    amount,
    currency_code: currencyCode,
  };
  assertAttemptCorrelation(attempt, expected);

  if (!created) {
    if (
      attempt.state !== "initialized" ||
      !attempt.token ||
      !attempt.webpay_url
    ) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Webpay initiation is already in progress or requires recovery",
      );
    }

    await dependencies.paymentService.updatePaymentSession({
      id: paymentSession.id,
      amount,
      currency_code: currencyCode,
      data: {
        ...paymentSession.data,
        ...operationalData(attempt, configuration.environment),
      },
    });
    return operationalData(attempt, configuration.environment);
  }

  dependencies.logger.info(
    JSON.stringify({
      event: "webpay.initiation.create_started",
      attempt_id: attempt.id,
      buy_order: attempt.buy_order,
      cart_id: cart.id,
      payment_collection_id: cart.payment_collection.id,
      payment_session_id: paymentSession.id,
      provider_id: WEBPAY_PROVIDER_ID,
    }),
  );

  let response: { token?: unknown; url?: unknown };
  try {
    response = await dependencies.transaction.create(
      attempt.buy_order,
      attempt.session_id,
      amount,
      configuration.returnUrl,
    );
  } catch {
    await dependencies.webpayService.updateWebpayAttempts({
      id: attempt.id,
      state: "recovery_required",
      failure_code: "create_sdk_error",
    });
    dependencies.logger.error(
      JSON.stringify({
        event: "webpay.initiation.create_ambiguous",
        attempt_id: attempt.id,
        buy_order: attempt.buy_order,
      }),
    );
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Webpay initiation result is ambiguous",
    );
  }

  if (typeof response.token !== "string" || typeof response.url !== "string") {
    await dependencies.webpayService.updateWebpayAttempts({
      id: attempt.id,
      state: "create_failed",
      failure_code: "invalid_create_response",
    });
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Webpay returned an invalid initiation response",
    );
  }

  attempt = await dependencies.webpayService.updateWebpayAttempts({
    id: attempt.id,
    state: "initialized",
    token: response.token,
    webpay_url: response.url,
    failure_code: null,
  });
  const paymentData = {
    ...paymentSession.data,
    ...operationalData(attempt, configuration.environment),
  };
  await dependencies.paymentService.updatePaymentSession({
    id: paymentSession.id,
    amount,
    currency_code: currencyCode,
    data: paymentData,
  });

  dependencies.logger.info(
    JSON.stringify({
      event: "webpay.initiation.initialized",
      attempt_id: attempt.id,
      buy_order: attempt.buy_order,
      payment_session_id: paymentSession.id,
    }),
  );

  return operationalData(attempt, configuration.environment);
}
