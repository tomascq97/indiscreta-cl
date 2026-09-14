"use client"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { isPaidByGiftCard, isPaymentReady } from "@lib/util/checkout-rules"
import { HttpTypes } from "@medusajs/types"
import { CheckCircleSolid } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentButton from "@modules/checkout/components/payment-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import { RadioGroup } from "@headlessui/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { selectActivePaymentSession } from "@lib/util/payment-session"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: {
    id: string
  }[]
}) => {
  const initialActiveSession = selectActivePaymentSession(cart)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setCardBrand] = useState<string | null>(null)
  const [, setCardComplete] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    initialActiveSession?.provider_id ?? "",
  )
  const activeSession = selectActivePaymentSession(cart, {
    providerId: selectedPaymentMethod || undefined,
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  const paidByGiftcard = isPaidByGiftCard(cart)
  const paymentReady = isPaymentReady(cart)
  useEffect(() => {
    if (!isOpen) return

    setAcceptedTerms(
      sessionStorage.getItem("indiscreta-checkout-terms") === "accepted"
    )
  }, [isOpen])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

    if (!method) return

    setIsLoading(true)

    try {
      const currentSession = selectActivePaymentSession(cart, {
        providerId: method,
      })

      if (currentSession?.provider_id !== method) {
        await initiatePaymentSession(cart, {
          provider_id: method,
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
          Paso 03
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

        <section className="mt-7 border border-neutral-200 p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Aceptación obligatoria
          </p>

          <h3 className="mt-2 text-xl font-semibold text-black">
            Términos y políticas
          </h3>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                const accepted = event.target.checked

                setAcceptedTerms(accepted)

                if (accepted) {
                  sessionStorage.setItem(
                    "indiscreta-checkout-terms",
                    "accepted"
                  )
                } else {
                  sessionStorage.removeItem(
                    "indiscreta-checkout-terms"
                  )
                }
              }}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-rose)]"
              data-testid="accept-terms-checkbox"
            />

            <span className="text-sm leading-6 text-neutral-600">
              He leído y acepto los{" "}
              <LocalizedClientLink
                href="/informacion#terminos-y-condiciones"
                className="font-semibold text-black underline underline-offset-4"
                target="_blank"
              >
                Términos y condiciones
              </LocalizedClientLink>
              , la{" "}
              <LocalizedClientLink
                href="/informacion#politica-de-privacidad"
                className="font-semibold text-black underline underline-offset-4"
                target="_blank"
              >
                Política de privacidad
              </LocalizedClientLink>{" "}
              y la{" "}
              <LocalizedClientLink
                href="/ayuda#cambios-y-devoluciones"
                className="font-semibold text-black underline underline-offset-4"
                target="_blank"
              >
                Política de cambios y devoluciones
              </LocalizedClientLink>
              .
            </span>
          </label>

          {!acceptedTerms ? (
            <p className="mt-4 text-xs leading-5 text-neutral-500">
              Debes aceptar estas condiciones antes de finalizar tu compra.
            </p>
          ) : null}
        </section>
        <div className="mt-7 border-t border-neutral-200 pt-6">
          {acceptedTerms ? (
            activeSession || paidByGiftcard ? (
              <PaymentButton
                cart={cart}
                selectedPaymentMethod={selectedPaymentMethod}
                data-testid="submit-order-button"
              />
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-[52px] w-full cursor-not-allowed items-center justify-center bg-neutral-200 px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400"
              >
                {isLoading ? "Preparando pago..." : "Esperando medio de pago"}
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-[52px] w-full cursor-not-allowed items-center justify-center bg-neutral-200 px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400"
            >
              Acepta los términos para continuar
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Payment
