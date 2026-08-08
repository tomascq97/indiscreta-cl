"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "review"
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setAcceptedTerms(
      sessionStorage.getItem("indiscreta-checkout-terms") === "accepted",
    )
  }, [isOpen])

  const previousStepsCompleted = Boolean(
    cart.shipping_address &&
    cart.billing_address &&
    cart.email &&
    cart.shipping_methods?.length,
  )

  const shippingMethod = cart.shipping_methods?.at(-1)

  const itemCount = useMemo(
    () =>
      (cart.items ?? []).reduce(
        (total, item) => total + (item.quantity ?? 0),
        0,
      ),
    [cart.items],
  )

  const continueToPayment = () => {
    if (!acceptedTerms || !previousStepsCompleted) return

    sessionStorage.setItem("indiscreta-checkout-terms", "accepted")

    const params = new URLSearchParams(searchParams)
    params.set("step", "payment")

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (!isOpen) {
    return (
      <section className="border-b border-neutral-200 bg-white py-5">
        <h2 className="text-2xl font-semibold text-neutral-400">
          Revisión y aceptación
        </h2>
      </section>
    )
  }

  return (
    <section
      className="bg-white p-5 sm:p-7 lg:p-8"
      data-testid="checkout-review"
    >
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Paso 03
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black sm:text-3xl">
          Revisa y acepta
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          Comprueba que toda la información sea correcta y acepta las políticas
          de Indiscreta antes de continuar al pago.
        </p>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
              Dirección de despacho
            </p>

            <LocalizedClientLink
              href="/checkout?step=address"
              className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 transition-colors hover:text-[var(--color-rose-dark)]"
            >
              Editar
            </LocalizedClientLink>
          </div>

          <p className="mt-3 font-semibold text-black">
            {cart.shipping_address?.first_name}{" "}
            {cart.shipping_address?.last_name}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {cart.shipping_address?.address_1}
            {cart.shipping_address?.address_2
              ? `, ${cart.shipping_address.address_2}`
              : ""}
            <br />
            {cart.shipping_address?.postal_code}, {cart.shipping_address?.city}
            <br />
            {cart.shipping_address?.province
              ? `${cart.shipping_address.province}, `
              : ""}
            {cart.shipping_address?.country_code?.toUpperCase()}
          </p>
        </article>

        <article className="border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
              Método de despacho
            </p>

            <LocalizedClientLink
              href="/checkout?step=delivery"
              className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 transition-colors hover:text-[var(--color-rose-dark)]"
            >
              Editar
            </LocalizedClientLink>
          </div>

          <p className="mt-3 font-semibold text-black">
            {shippingMethod?.name || "Envío seleccionado"}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {shippingMethod
              ? convertToLocale({
                  amount: shippingMethod.amount ?? 0,
                  currency_code: cart.currency_code,
                })
              : "El costo se muestra en el resumen."}
          </p>
        </article>

        <article className="border border-neutral-200 bg-neutral-50 p-5 md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
            Resumen de productos
          </p>

          <div className="mt-3 flex items-end justify-between gap-5">
            <div>
              <p className="font-semibold text-black">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Revisa el detalle completo en el resumen del pedido.
              </p>
            </div>

            <p className="text-xl font-bold tracking-[-0.03em] text-black">
              {convertToLocale({
                amount: cart.total ?? 0,
                currency_code: cart.currency_code,
              })}
            </p>
          </div>
        </article>
      </div>

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

              if (!accepted) {
                sessionStorage.removeItem("indiscreta-checkout-terms")
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
            Debes aceptar estas condiciones antes de continuar.
          </p>
        ) : null}

        <button
          type="button"
          onClick={continueToPayment}
          disabled={!acceptedTerms || !previousStepsCompleted}
          className={`mt-6 inline-flex min-h-[52px] w-full items-center justify-center px-7 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors sm:w-auto ${
            acceptedTerms && previousStepsCompleted
              ? "bg-black text-white hover:bg-[var(--color-rose-dark)]"
              : "cursor-not-allowed bg-neutral-200 text-neutral-400"
          }`}
          data-testid="continue-to-payment-button"
        >
          Continuar al pago →
        </button>
      </section>
    </section>
  )
}

export default Review
