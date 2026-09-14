export type SelectablePaymentSession = {
  id?: string | null
  provider_id?: string | null
  status?: string | null
  created_at?: string | Date | null
}

type CartWithPaymentSessions<TSession extends SelectablePaymentSession> = {
  payment_collection?: {
    payment_sessions?: TSession[] | null
  } | null
}

export type SelectActivePaymentSessionOptions = {
  providerId?: string
  allowedStatuses?: string[]
}

const defaultAllowedStatuses = ["pending"]
const statusPriority = new Map([
  ["pending_authorization", 3],
  ["requires_more", 2],
  ["pending", 1],
])

export function selectActivePaymentSession<
  TSession extends SelectablePaymentSession,
>(
  cart: CartWithPaymentSessions<TSession>,
  options: SelectActivePaymentSessionOptions = {},
): TSession | undefined {
  const allowedStatuses = new Set(
    options.allowedStatuses ?? defaultAllowedStatuses,
  )
  const candidates = (cart.payment_collection?.payment_sessions ?? []).filter(
    (session) =>
      Boolean(session.status && allowedStatuses.has(session.status)) &&
      (!options.providerId || session.provider_id === options.providerId),
  )

  if (candidates.length <= 1) {
    return candidates[0]
  }

  const highestPriority = Math.max(
    ...candidates.map(
      (session) => statusPriority.get(session.status ?? "") ?? 0,
    ),
  )
  const prioritized = candidates.filter(
    (session) =>
      (statusPriority.get(session.status ?? "") ?? 0) === highestPriority,
  )

  if (prioritized.length === 1) {
    return prioritized[0]
  }

  const dated = prioritized.map((session) => ({
    session,
    timestamp: session.created_at
      ? new Date(session.created_at).getTime()
      : Number.NaN,
  }))

  if (dated.some(({ timestamp }) => !Number.isFinite(timestamp))) {
    return undefined
  }

  dated.sort((left, right) => right.timestamp - left.timestamp)

  if (dated[0].timestamp === dated[1].timestamp) {
    return undefined
  }

  return dated[0].session
}
