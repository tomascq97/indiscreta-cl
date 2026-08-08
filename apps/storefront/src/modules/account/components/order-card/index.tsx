import { useMemo } from "react"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

function formatDate(value?: string | Date | null): string {
  if (!value) {
    return "Fecha no disponible"
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function getStatusLabel(status?: string | null): string {
  const normalized = status?.toLowerCase()

  const labels: Record<string, string> = {
    pending: "Pendiente",
    completed: "Completado",
    canceled: "Cancelado",
    cancelled: "Cancelado",
    archived: "Archivado",
    requires_action: "Requiere acción",
  }

  return normalized
    ? (labels[normalized] ?? status ?? "Procesando")
    : "Procesando"
}

function getStatusClasses(status?: string | null): string {
  const normalized = status?.toLowerCase()

  if (normalized === "completed") {
    return "bg-green-50 text-green-800"
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "bg-red-50 text-red-800"
  }

  return "bg-pink-50 text-[var(--color-rose-dark)]"
}

const OrderCard = ({ order }: OrderCardProps) => {
  const totalUnits = useMemo(() => {
    return (
      order.items?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0
    )
  }, [order.items])

  const visibleItems = order.items?.slice(0, 3) ?? []
  const remainingItems = Math.max(
    (order.items?.length ?? 0) - visibleItems.length,
    0,
  )

  return (
    <article
      className="border border-neutral-200 bg-white transition-colors hover:border-neutral-400"
      data-testid="order-card"
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Pedido
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-[-0.025em] text-black">
                #<span data-testid="order-display-id">{order.display_id}</span>
              </h2>
            </div>

            <span
              className={`inline-flex px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${getStatusClasses(
                order.status,
              )}`}
              data-testid="order-status"
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
            <span data-testid="order-created-at">
              {formatDate(order.created_at)}
            </span>

            <span>
              {totalUnits} {totalUnits === 1 ? "producto" : "productos"}
            </span>
          </div>

          {visibleItems.length ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3"
                  data-testid="order-item"
                >
                  <div className="overflow-hidden bg-neutral-100">
                    <Thumbnail
                      thumbnail={item.thumbnail}
                      images={[]}
                      size="square"
                    />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold text-black"
                      data-testid="item-title"
                    >
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Cantidad:{" "}
                      <span data-testid="item-quantity">{item.quantity}</span>
                    </p>
                  </div>
                </div>
              ))}

              {remainingItems > 0 ? (
                <div className="flex min-h-[72px] items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                    +{remainingItems}{" "}
                    {remainingItems === 1 ? "producto más" : "productos más"}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-neutral-200 pt-5 lg:min-w-[190px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Total
            </p>

            <p
              className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black"
              data-testid="order-amount"
            >
              {convertToLocale({
                amount: order.total ?? 0,
                currency_code: order.currency_code ?? "clp",
              })}
            </p>
          </div>

          <LocalizedClientLink
            href={`/account/orders/details/${order.id}`}
            className="inline-flex min-h-11 items-center justify-center bg-black px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            data-testid="order-details-link"
          >
            Ver detalle
          </LocalizedClientLink>
        </div>
      </div>
    </article>
  )
}

export default OrderCard
