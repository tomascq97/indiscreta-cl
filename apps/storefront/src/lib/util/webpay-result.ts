export type WebpayResultState =
  | "approved"
  | "rejected"
  | "cancelled"
  | "review"
  | "unavailable"

export type WebpayResult = {
  id: string | null
  state: WebpayResultState
  order_id: string | null
  amount: number | null
  currency_code: string | null
  date: string | null
  payment_type: string | null
  installments: number | null
  card_last_four: string | null
  message: string
}

export const unavailableWebpayResult = (): WebpayResult => ({
  id: null,
  state: "unavailable",
  order_id: null,
  amount: null,
  currency_code: null,
  date: null,
  payment_type: null,
  installments: null,
  card_last_four: null,
  message: "No pudimos encontrar el resultado de esta operación.",
})

export function getWebpayResultView(result: WebpayResult) {
  switch (result.state) {
    case "approved":
      return {
        eyebrow: "Pago confirmado",
        title: "Tu compra está lista",
        accent: "text-emerald-700",
        canOpenOrder: Boolean(result.order_id),
        canReturnToCheckout: false,
      }
    case "rejected":
      return {
        eyebrow: "Pago rechazado",
        title: "No se realizó el cobro",
        accent: "text-red-700",
        canOpenOrder: false,
        canReturnToCheckout: true,
      }
    case "cancelled":
      return {
        eyebrow: "Pago cancelado",
        title: "Tu carrito sigue disponible",
        accent: "text-amber-700",
        canOpenOrder: false,
        canReturnToCheckout: true,
      }
    case "review":
      return {
        eyebrow: "Operación en revisión",
        title: "Estamos verificando tu pago",
        accent: "text-amber-700",
        canOpenOrder: false,
        canReturnToCheckout: false,
      }
    default:
      return {
        eyebrow: "Resultado no disponible",
        title: "No encontramos esta operación",
        accent: "text-neutral-600",
        canOpenOrder: false,
        canReturnToCheckout: false,
      }
  }
}
