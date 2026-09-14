import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import PaymentDetails from "@modules/order/components/payment-details"
import ShippingDetails from "@modules/order/components/shipping-details"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const firstName = order.shipping_address?.first_name || "cliente"

  return (
    <main
      className="bg-white text-black"
      data-testid="order-complete-container"
    >
      <section className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-12 sm:py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-rose)] text-xl font-bold text-white">
            ✓
          </div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-rose)]">
            Pedido confirmado
          </p>

          <h1 className="mt-3 text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] sm:text-5xl">
            Gracias por tu compra, {firstName}
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            Recibimos correctamente tu pedido. Te enviaremos las novedades y
            actualizaciones al correo registrado.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink
              href="/account/orders"
              className="inline-flex min-h-[50px] items-center justify-center bg-[var(--color-rose)] px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Ver mis pedidos
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/store"
              className="inline-flex min-h-[50px] items-center justify-center border border-white/30 px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Seguir comprando
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      <div className="store-container py-10 sm:py-14">
        <OrderDetails order={order} showStatus />

        <section className="mt-10 border border-neutral-200 bg-white p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
            Tu compra
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
            Resumen del pedido
          </h2>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <Items order={order} />
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <CartTotals totals={order} />
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
        </div>

        <section className="mt-8 border border-neutral-200 bg-neutral-50 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            ¿Qué ocurre ahora?
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <article>
              <p className="font-semibold">1. Confirmación</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Recibirás un correo con el resumen y número de tu pedido.
              </p>
            </article>

            <article>
              <p className="font-semibold">2. Preparación</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Prepararemos tu compra y actualizaremos su estado.
              </p>
            </article>

            <article>
              <p className="font-semibold">3. Despacho</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Te informaremos cuando el pedido sea entregado al transportista.
              </p>
            </article>
          </div>
        </section>

        <Help />
      </div>
    </main>
  )
}
