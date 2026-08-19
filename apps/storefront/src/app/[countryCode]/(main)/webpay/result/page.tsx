import { retrieveWebpayResult } from "@lib/data/webpay-result"
import { convertToLocale } from "@lib/util/money"
import { getWebpayResultView } from "@lib/util/webpay-result"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Resultado del pago",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

type Props = {
  searchParams: Promise<{ webpay_result?: string }>
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function WebpayResultPage({ searchParams }: Props) {
  const { webpay_result: attemptId } = await searchParams
  const result = await retrieveWebpayResult(attemptId)
  const view = getWebpayResultView(result)
  const date = formatDate(result.date)

  return (
    <div className="content-container py-16 small:py-24">
      <section className="mx-auto max-w-2xl border border-neutral-200 bg-white px-6 py-10 shadow-sm small:px-12 small:py-14">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${view.accent}`}
        >
          {view.eyebrow}
        </p>

        <h1 className="mt-3 font-[var(--font-editorial)] text-4xl font-medium tracking-[-0.03em] text-black small:text-5xl">
          {view.title}
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600">
          {result.message}
        </p>

        {result.amount !== null && result.currency_code && (
          <dl className="mt-8 grid gap-5 border-y border-neutral-200 py-6 text-sm small:grid-cols-2">
            {result.order_display_id !== null && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Número de pedido
                </dt>
                <dd className="mt-2 font-semibold text-black">
                  #{result.order_display_id}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Comercio
              </dt>
              <dd className="mt-2 text-black">Indiscreta SpA</dd>
            </div>

            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Monto
              </dt>
              <dd className="mt-2 font-semibold text-black">
                {convertToLocale({
                  amount: result.amount,
                  currency_code: result.currency_code,
                })}
              </dd>
            </div>

            {date && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Fecha
                </dt>
                <dd className="mt-2 text-black">{date}</dd>
              </div>
            )}

            {result.authorization_code && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Código de autorización
                </dt>
                <dd className="mt-2 text-black">
                  {result.authorization_code}
                </dd>
              </div>
            )}

            {result.payment_type && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Tipo de pago
                </dt>
                <dd className="mt-2 text-black">{result.payment_type}</dd>
              </div>
            )}

            {result.installments && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Cuotas
                </dt>
                <dd className="mt-2 text-black">{result.installments}</dd>
              </div>
            )}

            {result.card_last_four && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Tarjeta
                </dt>
                <dd className="mt-2 text-black">
                  Terminada en {result.card_last_four}
                </dd>
              </div>
            )}

            <div className="small:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Descripción
              </dt>
              <dd className="mt-2 text-black">
                Compra realizada en indiscreta.cl
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-8 flex flex-col gap-3 small:flex-row">
          {view.canOpenOrder && result.order_id && (
            <LocalizedClientLink
              href={`/order/${result.order_id}/confirmed`}
              className="inline-flex min-h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Ver confirmación del pedido
            </LocalizedClientLink>
          )}

          {view.canReturnToCheckout && (
            <LocalizedClientLink
              href="/checkout?step=payment"
              className="inline-flex min-h-12 items-center justify-center border border-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
            >
              Volver al checkout
            </LocalizedClientLink>
          )}

          {!view.canOpenOrder && !view.canReturnToCheckout && (
            <LocalizedClientLink
              href="/store"
              className="inline-flex min-h-12 items-center justify-center border border-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
            >
              Volver a la tienda
            </LocalizedClientLink>
          )}
        </div>
      </section>
    </div>
  )
}
