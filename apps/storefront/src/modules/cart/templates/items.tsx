import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = [...(cart?.items ?? [])].sort((a, b) => {
    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  })

  const totalItems = items.reduce((total, item) => {
    return total + item.quantity
  }, 0)

  return (
    <section>
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Tu selección
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
            Productos
          </h2>
        </div>

        <p className="text-sm text-neutral-500">
          {totalItems} {totalItems === 1 ? "producto" : "productos"}
        </p>
      </div>

      <div className="divide-y divide-neutral-200 border-b border-neutral-200">
        {items.map((item) => (
          <Item
            key={item.id}
            item={item}
            currencyCode={cart?.currency_code ?? "clp"}
          />
        ))}
      </div>
    </section>
  )
}

export default ItemsTemplate
