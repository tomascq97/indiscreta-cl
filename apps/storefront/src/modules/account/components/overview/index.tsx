import { esCl } from "@lib/translations/es-cl"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

function calculateProfileCompletion(
  customer: HttpTypes.StoreCustomer | null,
): number {
  if (!customer) return 0

  const fields = [
    customer.first_name,
    customer.last_name,
    customer.email,
    customer.phone,
  ]
  const completed = fields.filter((value) => Boolean(value?.trim())).length

  return Math.round((completed / fields.length) * 100)
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "Fecha no disponible"

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const profileCompletion = calculateProfileCompletion(customer)
  const addressCount = customer?.addresses?.length ?? 0
  const recentOrders = orders?.slice(0, 3) ?? []

  return (
    <div data-testid="overview-page-wrapper">
      <header className="border-b border-neutral-200 pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Resumen
        </p>
        <h2
          className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
          data-testid="welcome-message"
          data-value={customer?.first_name}
        >
          Hola{customer?.first_name ? `, ${customer.first_name}` : ""}
        </h2>
        <p className="mt-3 text-sm text-neutral-600">
          Revisa el estado de tu cuenta y tus pedidos más recientes.
        </p>
      </header>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <LocalizedClientLink
          href="/account/profile"
          className="group border border-neutral-200 p-6 transition-colors hover:border-[var(--color-rose)]"
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {esCl.account.profile}
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.04em]">
                {profileCompletion}%
              </p>
              <p className="mt-1 text-sm text-neutral-500">completado</p>
            </div>
            <span className="text-xl text-[var(--color-rose)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>

          <div className="mt-6 h-1.5 overflow-hidden bg-neutral-100">
            <div
              className="h-full bg-[var(--color-rose)]"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/account/addresses"
          className="group border border-neutral-200 p-6 transition-colors hover:border-[var(--color-rose)]"
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                {esCl.account.addresses}
              </p>
              <p className="mt-3 text-4xl font-bold tracking-[-0.04em]">
                {addressCount}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {addressCount === 1
                  ? "dirección guardada"
                  : "direcciones guardadas"}
              </p>
            </div>
            <span className="text-xl text-[var(--color-rose)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
        </LocalizedClientLink>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-6 border-b border-neutral-200 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
              Actividad
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
              Pedidos recientes
            </h3>
          </div>

          <LocalizedClientLink
            href="/account/orders"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-[var(--color-rose-dark)]"
          >
            Ver todos
          </LocalizedClientLink>
        </div>

        {recentOrders.length ? (
          <div className="divide-y divide-neutral-200 border-b border-neutral-200">
            {recentOrders.map((order) => (
              <LocalizedClientLink
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                className="grid gap-4 py-6 transition-colors hover:bg-neutral-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-4"
                data-testid="order-wrapper"
              >
                <div>
                  <p className="text-sm font-semibold text-black">
                    Pedido #{order.display_id ?? order.id}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <p className="text-sm font-medium capitalize text-neutral-600">
                  {order.status ?? "Procesando"}
                </p>

                <p className="text-sm font-semibold text-black">
                  {convertToLocale({
                    amount: order.total ?? 0,
                    currency_code: order.currency_code ?? "clp",
                  })}
                </p>
              </LocalizedClientLink>
            ))}
          </div>
        ) : (
          <div className="border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-black">
              Aún no tienes pedidos
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
              Cuando realices una compra, podrás revisar aquí su estado y los
              detalles de entrega.
            </p>
            <LocalizedClientLink
              href="/store"
              className="mt-6 inline-flex min-h-11 items-center justify-center bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Explorar productos
            </LocalizedClientLink>
          </div>
        )}
      </section>
    </div>
  )
}

export default Overview
