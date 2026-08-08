"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { isOrderReady } from "@lib/util/checkout-rules"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const paymentButtonClassName =
  "min-h-[54px] w-full bg-black px-8 text-[11px] font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-[var(--color-rose-dark)]"

const getPaymentLabel = (cart: HttpTypes.StoreCart) =>
  `Pagar ${convertToLocale({
    amount: cart.total ?? 0,
    currency_code: cart.currency_code,
  })}`

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady = !isOrderReady(cart)
  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )

    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          cart={cart}
          notReady={notReady}
          data-testid={dataTestId}
        />
      )

    default:
      return (
        <Button disabled size="large" className="min-h-[54px] w-full">
          Selecciona y prepara un método de pago
        </Button>
      )
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch(() => {
        setErrorMessage("No pudimos completar el pago. Inténtalo nuevamente.")
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")
  const session = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending",
  )

  const disabled = !stripe || !elements

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card,
          billing_details: {
            name: `${cart.billing_address?.first_name ?? ""} ${
              cart.billing_address?.last_name ?? ""
            }`.trim(),
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const paymentIntentFromError = error.payment_intent

          if (
            paymentIntentFromError?.status === "requires_capture" ||
            paymentIntentFromError?.status === "succeeded"
          ) {
            return onPaymentCompleted()
          }

          setErrorMessage("No pudimos completar el pago. Revisa tus datos.")
          setSubmitting(false)
          return
        }

        if (
          paymentIntent?.status === "requires_capture" ||
          paymentIntent?.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        className={paymentButtonClassName}
        data-testid={dataTestId}
      >
        {getPaymentLabel(cart)}
      </Button>

      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)

    await placeOrder()
      .catch(() => {
        setErrorMessage(
          "No pudimos confirmar el pedido de prueba. Inténtalo nuevamente.",
        )
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className={paymentButtonClassName}
        data-testid={dataTestId}
      >
        {getPaymentLabel(cart)}
      </Button>

      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
