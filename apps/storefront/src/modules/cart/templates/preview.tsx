"use client"

import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"

type ItemsPreviewTemplateProps = {
  cart: HttpTypes.StoreCart
}

const ItemsPreviewTemplate = ({ cart }: ItemsPreviewTemplateProps) => {
  const items = [...(cart.items ?? [])].sort((a, b) => {
    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  })

  const hasOverflow = items.length > 4

  return (
    <div
      className={
        hasOverflow
          ? "max-h-[420px] divide-y divide-neutral-200 overflow-y-auto overflow-x-hidden pr-2"
          : "divide-y divide-neutral-200"
      }
      data-testid="items-table"
    >
      {items.map((item) => (
        <Item
          key={item.id}
          item={item}
          type="preview"
          currencyCode={cart.currency_code ?? "clp"}
        />
      ))}
    </div>
  )
}

export default ItemsPreviewTemplate
