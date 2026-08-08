"use client"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getCheckoutStep } from "@lib/util/checkout-rules"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <section className="border border-neutral-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
        Tu compra
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
        Resumen de compra
      </h2>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <DiscountCode cart={cart} />
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <CartTotals totals={cart} />
      </div>

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        className="mt-7 inline-flex min-h-[52px] w-full items-center justify-center bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-[var(--color-rose-dark)] hover:!text-white"
        data-testid="checkout-button"
      >
        <span className="text-white">Finalizar compra</span>
      </LocalizedClientLink>

      <LocalizedClientLink
        href="/store"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
      >
        Seguir comprando
      </LocalizedClientLink>

      <div className="mt-6 grid grid-cols-1 gap-2 border-t border-neutral-200 pt-5 text-xs leading-5 text-neutral-600">
        <p>✓ Compra 100% segura</p>
        <p>✓ Pago protegido</p>
        <p>✓ Envíos a todo Chile</p>
        <p>✓ Cambios y devoluciones según nuestras políticas</p>
      </div>
    </section>
  )
}

export default Summary
