import { HttpTypes } from "@medusajs/types"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const statusLabels: Record<string, string> = {
  not_fulfilled: "Pendiente de preparación",
  partially_fulfilled: "Preparación parcial",
  fulfilled: "Preparado",
  partially_shipped: "Despacho parcial",
  shipped: "Despachado",
  partially_delivered: "Entrega parcial",
  delivered: "Entregado",
  canceled: "Cancelado",
  requires_action: "Requiere acción",
  awaiting: "Pendiente",
  authorized: "Autorizado",
  partially_authorized: "Autorización parcial",
  captured: "Pagado",
  partially_captured: "Pago parcial",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
  canceled_payment: "Pago cancelado",
}

const formatStatus = (status?: string | null) => {
  if (!status) return "Pendiente"
  return statusLabels[status] || status.split("_").join(" ")
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const placedAt = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(order.created_at))

  return (
    <section className="border border-neutral-200 bg-neutral-50 p-5 sm:p-7">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
            Número de pedido
          </p>
          <p className="mt-2 text-xl font-bold">#{order.display_id}</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
            Fecha
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{placedAt}</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-rose)]">
            Confirmación enviada a
          </p>
          <p className="mt-2 break-all text-sm leading-6 text-neutral-700">
            {order.email}
          </p>
        </div>
      </div>

      {showStatus ? (
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Estado del pedido
            </p>
            <p className="mt-2 font-semibold" data-testid="order-status">
              {formatStatus(order.fulfillment_status)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Estado del pago
            </p>
            <p
              className="mt-2 font-semibold"
              data-testid="order-payment-status"
            >
              {formatStatus(order.payment_status)}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default OrderDetails
