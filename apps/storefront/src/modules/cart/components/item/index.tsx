"use client"

import { HttpTypes } from "@medusajs/types"
import CartQuantityStepper from "@modules/cart/components/cart-quantity-stepper"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  if (type === "preview") {
    return (
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-4">
        <LocalizedClientLink href={`/products/${item.product_handle}`}>
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.product_title}</p>
          <LineItemOptions variant={item.variant} />
          <p className="mt-1 text-xs text-neutral-500">
            {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}
          </p>
        </div>

        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>
    )
  }

  return (
    <article
      className="grid gap-5 py-7 sm:grid-cols-[170px_minmax(0,1fr)]"
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="block overflow-hidden bg-neutral-100"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              className="text-xl font-bold tracking-[-0.025em] text-black transition-colors hover:text-[var(--color-rose-dark)]"
              data-testid="product-title"
            >
              {item.product_title}
            </LocalizedClientLink>

            <div className="mt-2 text-sm text-neutral-500">
              <LineItemOptions
                variant={item.variant}
                data-testid="product-variant"
              />
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Precio unitario
              </p>
              <div className="mt-1 text-sm font-medium text-black">
                <LineItemUnitPrice
                  item={item}
                  style="tight"
                  currencyCode={currencyCode}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Subtotal
            </p>
            <div className="mt-1 text-xl font-bold tracking-[-0.02em] text-black">
              <LineItemPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-neutral-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Cantidad
            </p>

            <CartQuantityStepper
              lineId={item.id}
              quantity={item.quantity}
              maxQuantity={Math.min(maxQuantity, 10)}
            />
          </div>

          <DeleteButton
            id={item.id}
            className="inline-flex min-h-11 items-center justify-center border border-neutral-300 px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-600 transition-colors hover:border-red-700 hover:text-red-700"
            data-testid="product-delete-button"
          >
            Eliminar
          </DeleteButton>
        </div>
      </div>
    </article>
  )
}

export default Item
