"use client"

import { esCl } from "@lib/translations/es-cl"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

const AUTO_CLOSE_DELAY = 5000

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[22px] w-[22px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6.5 8.5h11l1 12h-13l1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalItems =
    cartState?.items?.reduce((total, item) => {
      return total + item.quantity
    }, 0) ?? 0

  const previousTotalItems = useRef(totalItems)
  const subtotal = cartState?.subtotal ?? 0

  const sortedItems = useMemo(() => {
    return [...(cartState?.items ?? [])].sort((a, b) => {
      return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
    })
  }, [cartState?.items])

  const clearAutoCloseTimer = () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current)
      autoCloseTimer.current = null
    }
  }

  const open = () => {
    clearAutoCloseTimer()
    setIsOpen(true)
  }

  const close = () => {
    clearAutoCloseTimer()
    setIsOpen(false)
  }

  const openTemporarily = () => {
    open()

    autoCloseTimer.current = setTimeout(() => {
      setIsOpen(false)
      autoCloseTimer.current = null
    }, AUTO_CLOSE_DELAY)
  }

  useEffect(() => {
    const cartChanged = previousTotalItems.current !== totalItems

    if (cartChanged && !pathname.includes("/cart")) {
      openTemporarily()
    }

    previousTotalItems.current = totalItems

    return clearAutoCloseTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, pathname])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEscape)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    close()
    // Close the drawer after route navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex h-full items-center gap-2 text-xs font-medium text-current transition-opacity hover:opacity-70"
        aria-label={`Abrir carrito. ${totalItems} ${
          totalItems === 1 ? "producto" : "productos"
        }`}
        aria-expanded={isOpen}
        aria-controls="indiscreta-cart-drawer"
        data-testid="nav-cart-link"
      >
        <BagIcon />

        <span className="hidden sm:inline">{esCl.navigation.cart}</span>

        <span
          className={
            totalItems > 0
              ? "flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-rose)] px-1 text-[10px] font-bold !text-white"
              : "text-xs"
          }
          data-testid="nav-cart-count"
        >
          {totalItems}
        </span>
      </button>

      <div
        className={`fixed inset-0 z-[100] transition-visibility duration-300 ${
          isOpen ? "visible" : "invisible"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={close}
          className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={isOpen ? 0 : -1}
        />

        <aside
          id="indiscreta-cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="indiscreta-cart-title"
          className={`absolute inset-y-0 right-0 flex h-dvh w-full flex-col bg-white text-black shadow-2xl transition-transform duration-300 ease-out sm:w-[460px] sm:max-w-full ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          data-testid="nav-cart-dropdown"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
                Indiscreta
              </p>
              <h2
                id="indiscreta-cart-title"
                className="mt-1 text-2xl font-bold tracking-[-0.03em]"
              >
                Tu carrito
              </h2>
            </div>

            <button
              type="button"
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center border border-neutral-200 text-black transition-colors hover:border-black hover:bg-black hover:text-white"
              aria-label="Cerrar carrito"
              data-testid="cart-close-button"
            >
              <CloseIcon />
            </button>
          </header>

          {sortedItems.length ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
                <div className="divide-y divide-neutral-200">
                  {sortedItems.map((item) => (
                    <article
                      key={item.id}
                      className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 py-5"
                      data-testid="cart-item"
                    >
                      <LocalizedClientLink
                        href={`/products/${item.product_handle}`}
                        onClick={close}
                        className="block overflow-hidden bg-neutral-100"
                        aria-label={`Ver ${item.title}`}
                      >
                        <Thumbnail
                          thumbnail={item.thumbnail}
                          images={item.variant?.product?.images}
                          size="square"
                        />
                      </LocalizedClientLink>

                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <LocalizedClientLink
                              href={`/products/${item.product_handle}`}
                              onClick={close}
                              className="block truncate text-sm font-semibold text-black transition-colors hover:text-[var(--color-rose-dark)]"
                              data-testid="product-link"
                            >
                              {item.title}
                            </LocalizedClientLink>

                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              <LineItemOptions
                                variant={item.variant}
                                data-testid="cart-item-variant"
                                data-value={item.variant}
                              />
                            </div>
                          </div>

                          <div className="shrink-0 text-sm font-semibold text-black">
                            <LineItemPrice
                              item={item}
                              style="tight"
                              currencyCode={cartState?.currency_code ?? "clp"}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span
                            className="text-xs text-neutral-500"
                            data-testid="cart-item-quantity"
                            data-value={item.quantity}
                          >
                            Cantidad: {item.quantity}
                          </span>

                          <DeleteButton
                            id={item.id}
                            className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 transition-colors hover:text-red-700"
                            data-testid="cart-item-remove-button"
                          >
                            Eliminar
                          </DeleteButton>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <footer className="shrink-0 border-t border-neutral-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Subtotal
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      El despacho se calcula al finalizar la compra.
                    </p>
                  </div>

                  <p
                    className="shrink-0 text-2xl font-bold tracking-[-0.03em] text-black"
                    data-testid="cart-subtotal"
                    data-value={subtotal}
                  >
                    {convertToLocale({
                      amount: subtotal,
                      currency_code: cartState?.currency_code ?? "clp",
                    })}
                  </p>
                </div>

                <LocalizedClientLink
                  href="/checkout?step=address"
                  onClick={close}
                  className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center bg-[var(--color-rose)] px-6 text-[11px] font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-[var(--color-rose-dark)] hover:!text-white"
                  data-testid="drawer-checkout-button"
                >
                  <span className="text-white">Finalizar compra</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/cart"
                  onClick={close}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
                  data-testid="go-to-cart-button"
                >
                  Ver carrito completo
                </LocalizedClientLink>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                <BagIcon />
              </div>

              <p className="mt-5 text-xl font-bold tracking-[-0.025em] text-black">
                Tu carrito está vacío
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                Explora nuestras novedades y agrega tus productos favoritos.
              </p>

              <LocalizedClientLink
                href="/store"
                onClick={close}
                className="mt-7 inline-flex min-h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-[var(--color-rose-dark)] hover:!text-white"
                data-testid="drawer-continue-shopping-button"
              >
                <span className="!text-white">Explorar productos</span>
              </LocalizedClientLink>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

export default CartDropdown
