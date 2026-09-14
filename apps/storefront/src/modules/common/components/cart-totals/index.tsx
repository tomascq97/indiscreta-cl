"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const format = (amount?: number | null) =>
    convertToLocale({
      amount: amount ?? 0,
      currency_code,
    })

  return (
    <div>
      <div className="space-y-3 text-sm">
        <div className="flex items-start justify-between gap-5">
          <span className="text-neutral-600">Productos</span>
          <span
            className="font-medium text-black"
            data-testid="cart-subtotal"
            data-value={item_subtotal ?? 0}
          >
            {format(item_subtotal)}
          </span>
        </div>

        <div className="flex items-start justify-between gap-5">
          <span className="text-neutral-600">Envío</span>
          <span
            className="text-right font-medium text-black"
            data-testid="cart-shipping"
            data-value={shipping_subtotal ?? 0}
          >
            {shipping_subtotal
              ? format(shipping_subtotal)
              : "Se calcula al finalizar"}
          </span>
        </div>

        {discount_subtotal ? (
          <div className="flex items-start justify-between gap-5">
            <span className="text-neutral-600">Descuento</span>
            <span
              className="font-semibold text-[var(--color-rose-dark)]"
              data-testid="cart-discount"
              data-value={discount_subtotal}
            >
              − {format(discount_subtotal)}
            </span>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-5">
          <span className="text-neutral-600">Impuestos</span>
          <span
            className="font-medium text-black"
            data-testid="cart-taxes"
            data-value={tax_total ?? 0}
          >
            {format(tax_total)}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-300 pt-5">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Total estimado
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Incluye los impuestos informados.
            </p>
          </div>

          <span
            className="text-3xl font-bold tracking-[-0.04em] text-black"
            data-testid="cart-total"
            data-value={total ?? 0}
          >
            {format(total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CartTotals
