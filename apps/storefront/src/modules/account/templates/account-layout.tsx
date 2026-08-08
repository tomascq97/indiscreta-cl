import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <section className="bg-white text-black" data-testid="account-page">
      <div className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container py-10 sm:py-12 lg:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
            Indiscreta
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] sm:text-5xl">
                Mi cuenta
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Gestiona tu información personal, direcciones y pedidos.
              </p>
            </div>

            {customer?.email ? (
              <p className="text-sm text-white/55">
                Sesión iniciada como{" "}
                <span className="font-semibold text-white">
                  {customer.email}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="store-container py-8 sm:py-10 lg:py-14">
        <div
          className={
            customer
              ? "grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12"
              : "w-full"
          }
        >
          {customer ? <AccountNav customer={customer} /> : null}

          <div className={customer ? "min-w-0" : "w-full"}>{children}</div>
        </div>

        <section className="mt-14 border-t border-neutral-200 pt-8">
          <div className="flex flex-col gap-5 bg-neutral-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
                Centro de ayuda
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">
                ¿Tienes preguntas?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Encuentra información sobre compras, envíos, cambios, tallas y
                contacto con nuestro equipo.
              </p>
            </div>

            <LocalizedClientLink
              href="/ayuda"
              className="inline-flex min-h-12 shrink-0 items-center justify-center bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Ir al centro de ayuda
            </LocalizedClientLink>
          </div>
        </section>
      </div>
    </section>
  )
}

export default AccountLayout
