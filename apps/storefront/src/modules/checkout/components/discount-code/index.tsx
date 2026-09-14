"use client"

import React from "react"
import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart

  const removePromotionCode = async (code: string) => {
    const validCodes = promotions
      .filter((promotion) => promotion.code && promotion.code !== code)
      .map((promotion) => promotion.code!)

    await applyPromotions(validCodes)
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const value = formData.get("code")
    const code = value?.toString().trim()

    if (!code) {
      setErrorMessage("Ingresa un código promocional.")
      return
    }

    const codes = promotions
      .filter((promotion) => promotion.code)
      .map((promotion) => promotion.code!)

    try {
      await applyPromotions([...codes, code])
    } catch {
      setErrorMessage(
        "No pudimos aplicar el código promocional. Inténtalo nuevamente.",
      )
    }
  }

  return (
    <section className="w-full">
      <button
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        className="flex w-full items-center justify-between gap-4 py-1 text-left"
        data-testid="add-discount-button"
        aria-expanded={isOpen}
      >
        <span>
          <span className="block text-sm font-semibold text-black">
            ¿Tienes un código de descuento?
          </span>
          <span className="mt-1 block text-xs text-neutral-500">
            Aplícalo antes de finalizar la compra.
          </span>
        </span>

        <span
          aria-hidden="true"
          className={`text-xl transition-transform duration-200 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      {isOpen ? (
        <form action={addPromotionCode} className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="promotion-input"
              name="code"
              type="text"
              placeholder="Código promocional"
              className="h-12 min-w-0 flex-1 border border-neutral-300 bg-white px-4 text-sm text-black outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--color-rose)]"
              data-testid="discount-input"
            />

            <div className="[&_button]:h-12 [&_button]:bg-black [&_button]:px-6 [&_button]:text-[11px] [&_button]:font-semibold [&_button]:uppercase [&_button]:tracking-[0.1em] [&_button]:text-white hover:[&_button]:bg-[var(--color-rose-dark)]">
              <SubmitButton data-testid="discount-apply-button">
                Aplicar
              </SubmitButton>
            </div>
          </div>

          <ErrorMessage
            error={errorMessage}
            data-testid="discount-error-message"
          />
        </form>
      ) : null}

      {promotions.length ? (
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Promociones aplicadas
          </p>

          {promotions.map((promotion) => {
            const method = promotion.application_method

            return (
              <div
                key={promotion.id}
                className="flex items-center justify-between gap-4 border border-neutral-200 bg-neutral-50 px-4 py-3"
                data-testid="discount-row"
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold text-black"
                    data-testid="discount-code"
                  >
                    {promotion.code}
                  </p>

                  {method?.value !== undefined ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      {method.type === "percentage"
                        ? `${method.value}% de descuento`
                        : method.currency_code
                          ? `${convertToLocale({
                              amount: Number(method.value),
                              currency_code: method.currency_code,
                            })} de descuento`
                          : "Descuento aplicado"}
                    </p>
                  ) : null}
                </div>

                {!promotion.is_automatic && promotion.code ? (
                  <button
                    type="button"
                    onClick={() => removePromotionCode(promotion.code!)}
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 transition-colors hover:text-red-700"
                    data-testid="remove-discount-button"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default DiscountCode
