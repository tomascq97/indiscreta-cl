import { esCl } from "@lib/translations/es-cl"
import { Metadata } from "next"
import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = {
  title: esCl.account.orders,
  description: "Consulta el estado y detalle de tus pedidos.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <header className="border-b border-neutral-200 pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Historial de compras
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          {esCl.account.orders}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
          Consulta el estado de tus compras, revisa los productos incluidos y
          accede al detalle completo de cada pedido.
        </p>
      </header>

      <div className="mt-7">
        <OrderOverview orders={orders} />
      </div>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Vincular una compra
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.025em] text-black">
            ¿Compraste como invitado?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Puedes solicitar la vinculación de un pedido anterior a tu cuenta
            utilizando los datos de la compra.
          </p>
        </div>

        <div className="border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
          <TransferRequestForm />
        </div>
      </section>
    </div>
  )
}
