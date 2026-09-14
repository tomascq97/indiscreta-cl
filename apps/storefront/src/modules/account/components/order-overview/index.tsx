"use client"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex w-full flex-col gap-5" data-testid="orders-list">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.025em] text-black">
              Pedidos realizados
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {orders.length === 1
                ? "Tienes 1 pedido registrado."
                : `Tienes ${orders.length} pedidos registrados.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {orders.map((order) => (
            <OrderCard order={order} key={order.id} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center"
      data-testid="no-orders-container"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
        Historial vacío
      </p>

      <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-black">
        Aún no tienes pedidos
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-neutral-600">
        Cuando realices una compra podrás revisar aquí su estado, los productos
        incluidos, la información de despacho y el detalle del pago.
      </p>

      <LocalizedClientLink
        href="/store"
        className="mt-7 inline-flex min-h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
        data-testid="continue-shopping-button"
      >
        Explorar productos
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
