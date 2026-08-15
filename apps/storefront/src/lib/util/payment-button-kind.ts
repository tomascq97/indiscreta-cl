export const WEBPAY_PROVIDER_ID = "pp_webpay-plus_webpay"

export type PaymentButtonKind = "stripe" | "manual" | "webpay" | "unsupported"

export function getPaymentButtonKind(providerId?: string): PaymentButtonKind {
  if (providerId === WEBPAY_PROVIDER_ID) return "webpay"
  if (
    providerId?.startsWith("pp_stripe_") ||
    providerId?.startsWith("pp_medusa-")
  ) {
    return "stripe"
  }
  if (providerId?.startsWith("pp_system_default")) return "manual"

  return "unsupported"
}
