"use client"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { isPaidByGiftCard, isPaymentReady } from "@lib/util/checkout-rules"
import { HttpTypes } from "@medusajs/types"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentButton from "@modules/checkout/components/payment-button"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import { RadioGroup } from "@headlessui/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: {
    id: string
  }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending",
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? "",
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  const paidByGiftcard = isPaidByGiftCard(cart)
  const paymentReady = isPaymentReady(cart)

  useEffect(() => {
    if (!isOpen) return

    const acceptedTerms = sessionStorage.getItem("indiscreta-checkout-terms")

    if (acceptedTerms !== "accepted") {
      router.replace(`${pathname}?step=review`, {
        scroll: false,
      })
    }
  }, [isOpen, pathname, router])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
      router.refresh()
    }
  }

  const preparePayment = async () => {
    if (!selectedPaymentMethod && !paidByGiftcard) return

    setIsLoading(true)
    setError(null)

    try {
      if (activeSession?.provider_id !== selectedPaymentMethod) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      router.refresh()
    } catch {
      setError("No pudimos preparar el medio de pago. Inténtalo nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <section className="border-b border-neutral-200 bg-white py-5">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-neutral-400">
          Pago
          {paymentReady ? (
            <CheckCircleSolid className="h-5 w-5 text-[var(--color-rose)]" />
          ) : null}
        </h2>
      </section>
    )
  }

  return (
    <section className="bg-white p-5 sm:p-7 lg:p-8">
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Paso 04
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black sm:text-3xl">
          Pago
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Selecciona el medio de pago y finaliza tu compra de forma segura.
        </p>
      </header>

      <div className="mt-7">
        {!paidByGiftcard && availablePaymentMethods?.length ? (
          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(value: string) => setPaymentMethod(value)}
            className="space-y-3"
          >
            {availablePaymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                {isStripeLike(paymentMethod.id) ? (
                  <StripeCardContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    paymentInfoMap={paymentInfoMap}
                    setCardBrand={setCardBrand}
                    setError={setError}
                    setCardComplete={setCardComplete}
                  />
                ) : (
                  <PaymentContainer
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                  />
                )}
              </div>
            ))}
          </RadioGroup>
        ) : null}

        {paidByGiftcard ? (
          <article className="border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
              Método de pago
            </p>
            <p className="mt-3 font-semibold text-black">Tarjeta de regalo</p>
          </article>
        ) : null}

        <ErrorMessage
          error={error}
          data-testid="payment-method-error-message"
        />

        <div className="mt-7 border-t border-neutral-200 pt-6">
          {activeSession || paidByGiftcard ? (
            <>
              <div className="mb-5 flex items-center gap-3 border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center bg-white">
                  {paymentInfoMap[
                    activeSession?.provider_id ?? selectedPaymentMethod
                  ]?.icon || <CreditCard />}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Método preparado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {paymentInfoMap[
                      activeSession?.provider_id ?? selectedPaymentMethod
                    ]?.title || "Pago seguro"}
                    {cardBrand ? ` · ${cardBrand}` : ""}
                  </p>
                </div>
              </div>

              <PaymentButton cart={cart} data-testid="submit-order-button" />
            </>
          ) : (
            <button
              type="button"
              onClick={preparePayment}
              disabled={
                isLoading ||
                (!selectedPaymentMethod && !paidByGiftcard) ||
                (isStripeLike(selectedPaymentMethod) && !cardComplete)
              }
              className="inline-flex min-h-[52px] w-full items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              data-testid="prepare-payment-button"
            >
              {isLoading ? "Preparando..." : "Preparar pago"}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Payment
