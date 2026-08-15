export type WebpayPublicState =
  | "approved"
  | "rejected"
  | "cancelled"
  | "review"
  | "unavailable";

type WebpayResultAttempt = Record<string, unknown> & {
  id: string;
  state: string;
  amount: unknown;
  currency_code: string;
  order_id?: string | null;
  payment_type_code?: string | null;
  installments_number?: number | null;
  transaction_date?: Date | string | null;
  completed_at?: Date | string | null;
  updated_at?: Date | string | null;
  card_last_four?: string | null;
};

const stateMessages: Record<WebpayPublicState, string> = {
  approved: "Tu pago fue aprobado y tu pedido quedó confirmado.",
  rejected: "El pago fue rechazado. Tu carrito sigue disponible.",
  cancelled: "Cancelaste el pago. Tu carrito sigue disponible.",
  review:
    "Estamos verificando el resultado de tu pago. No intentes pagar nuevamente por ahora.",
  unavailable: "No pudimos encontrar el resultado de esta operación.",
};

function publicState(state: string): WebpayPublicState {
  if (state === "completed") return "approved";
  if (state === "rejected") return "rejected";
  if (state === "cancelled" || state === "expired") return "cancelled";
  return "review";
}

function isoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function sanitizeWebpayResult(attempt: WebpayResultAttempt) {
  const state = publicState(attempt.state);

  return {
    id: attempt.id,
    state,
    order_id: state === "approved" ? (attempt.order_id ?? null) : null,
    amount: Number(attempt.amount),
    currency_code: attempt.currency_code.toLowerCase(),
    date: isoDate(
      attempt.transaction_date ?? attempt.completed_at ?? attempt.updated_at,
    ),
    payment_type: attempt.payment_type_code ?? null,
    installments:
      attempt.installments_number && attempt.installments_number > 0
        ? attempt.installments_number
        : null,
    card_last_four: attempt.card_last_four ?? null,
    message: stateMessages[state],
  };
}

export function unavailableWebpayResult() {
  return {
    id: null,
    state: "unavailable" as const,
    order_id: null,
    amount: null,
    currency_code: null,
    date: null,
    payment_type: null,
    installments: null,
    card_last_four: null,
    message: stateMessages.unavailable,
  };
}
