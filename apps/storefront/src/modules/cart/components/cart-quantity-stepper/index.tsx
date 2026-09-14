"use client"

import { updateLineItem } from "@lib/data/cart"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"

type CartQuantityStepperProps = {
  lineId: string
  quantity: number
  maxQuantity?: number
}

export default function CartQuantityStepper({
  lineId,
  quantity,
  maxQuantity = 10,
}: CartQuantityStepperProps) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateQuantity = async (nextQuantity: number) => {
    if (
      updating ||
      nextQuantity < 1 ||
      nextQuantity > Math.max(1, maxQuantity) ||
      nextQuantity === quantity
    ) {
      return
    }

    setError(null)
    setUpdating(true)

    try {
      await updateLineItem({ lineId, quantity: nextQuantity })
    } catch {
      setError("No pudimos actualizar la cantidad. Inténtalo nuevamente.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      <div
        className="inline-flex min-h-11 items-center border border-neutral-300 bg-white"
        aria-label="Selector de cantidad"
      >
        <button
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
          disabled={updating || quantity <= 1}
          className="flex h-11 w-11 items-center justify-center text-lg text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Disminuir cantidad"
          data-testid="quantity-decrease-button"
        >
          −
        </button>

        <span
          className="flex h-11 min-w-12 items-center justify-center border-x border-neutral-300 px-3 text-sm font-semibold text-black"
          data-testid="product-quantity"
          data-value={quantity}
        >
          {updating ? <Spinner /> : quantity}
        </span>

        <button
          type="button"
          onClick={() => updateQuantity(quantity + 1)}
          disabled={updating || quantity >= maxQuantity}
          className="flex h-11 w-11 items-center justify-center text-lg text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Aumentar cantidad"
          data-testid="quantity-increase-button"
        >
          +
        </button>
      </div>

      {error ? (
        <p
          className="mt-2 max-w-xs text-xs leading-5 text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
