import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const formatShippingName = (name?: string) => {
  if (!name) return "Despacho seleccionado"

  const normalized = name.toLowerCase()

  if (normalized.includes("standard")) return "Despacho estándar"
  if (normalized.includes("express")) return "Despacho express"

  return name
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const shippingMethod = order.shipping_methods?.[0]
  const address = order.shipping_address

  return (
    <section className="border border-neutral-200 bg-white p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
        Entrega
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
        Información de despacho
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <div data-testid="shipping-address-summary">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Dirección
          </p>

          <p className="mt-3 font-semibold">
            {address?.first_name} {address?.last_name}
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {address?.address_1}
            {address?.address_2 ? `, ${address.address_2}` : ""}
            <br />
            {address?.postal_code}, {address?.city}
            <br />
            {address?.province ? `${address.province}, ` : ""}
            Chile
          </p>
        </div>

        <div data-testid="shipping-contact-summary">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Contacto
          </p>

          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {address?.phone || "Teléfono no registrado"}
            <br />
            {order.email}
          </p>
        </div>
      </div>

      <div
        className="mt-6 border-t border-neutral-200 pt-5"
        data-testid="shipping-method-summary"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Método de despacho
        </p>

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="font-semibold">
            {formatShippingName(
              (shippingMethod as { name?: string } | undefined)?.name,
            )}
          </p>

          <p className="font-semibold">
            {convertToLocale({
              amount: shippingMethod?.total ?? 0,
              currency_code: order.currency_code,
            })}
          </p>
        </div>
      </div>
    </section>
  )
}

export default ShippingDetails
