import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { CreditCard } from "@medusajs/icons"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  const paidAt = payment?.created_at
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(payment.created_at))
    : null

  const paymentInfo = payment ? paymentInfoMap[payment.provider_id] : undefined

  return (
    <section className="border border-neutral-200 bg-white p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
        Pago
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
        Información del pago
      </h2>

      {payment ? (
        <div className="mt-6 border-t border-neutral-200 pt-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-neutral-100">
              {paymentInfo?.icon || <CreditCard />}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Método de pago
              </p>

              <p className="mt-2 font-semibold" data-testid="payment-method">
                {paymentInfo?.title || "Pago seguro"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Importe
              </p>

              <p className="mt-2 font-semibold" data-testid="payment-amount">
                {isStripeLike(payment.provider_id) && payment.data?.card_last4
                  ? `Tarjeta terminada en ${payment.data.card_last4}`
                  : convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Fecha del pago
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {paidAt || "Fecha no disponible"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-600">
          No se encontró información de pago para este pedido.
        </p>
      )}
    </section>
  )
}

export default PaymentDetails
