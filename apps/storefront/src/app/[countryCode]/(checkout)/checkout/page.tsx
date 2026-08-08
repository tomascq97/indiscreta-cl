import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Finalizar compra | Indiscreta",
  description: "Completa tu compra de forma segura.",
}

const checkoutSteps = [
  { number: "01", label: "Dirección" },
  { number: "02", label: "Despacho" },
  { number: "03", label: "Revisión" },
  { number: "04", label: "Pago" },
]

const checkoutStepIndex: Record<string, number> = {
  address: 0,
  delivery: 1,
  review: 2,
  payment: 3,
}

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{
    step?: string
  }>
}) {
  const { step = "address" } = await searchParams
  const activeStepIndex = checkoutStepIndex[step] ?? 0

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <>
      <section className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-9 sm:py-11">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-rose)]">
            Finaliza tu compra
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-[-0.04em] sm:text-4xl">
                Checkout
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Completa tus datos, selecciona el despacho y confirma tu medio
                de pago.
              </p>
            </div>

            <ol className="grid grid-cols-4 gap-2 sm:gap-5">
              {checkoutSteps.map((checkoutStep, index) => {
                const isActive = index === activeStepIndex
                const isCompleted = index < activeStepIndex

                return (
                  <li
                    key={checkoutStep.number}
                    className={`border-t pt-3 transition-colors ${
                      isActive
                        ? "border-[var(--color-rose)] text-white"
                        : isCompleted
                          ? "border-[var(--color-rose)] text-white/80"
                          : "border-white/20 text-white/45"
                    }`}
                  >
                    <span className="block text-[9px] font-semibold tracking-[0.14em]">
                      {isCompleted ? "✓" : checkoutStep.number}
                    </span>

                    <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px]">
                      {checkoutStep.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      <div className="store-container grid grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <PaymentWrapper cart={cart}>
            <CheckoutForm cart={cart} customer={customer} />
          </PaymentWrapper>
        </div>

        <aside className="lg:sticky lg:top-8">
          <CheckoutSummary cart={cart} />
        </aside>
      </div>
    </>
  )
}
