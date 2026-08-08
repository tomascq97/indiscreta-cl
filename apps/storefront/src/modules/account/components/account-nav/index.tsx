"use client"

import { esCl } from "@lib/translations/es-cl"
import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"
import { useParams, usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const navigationItems = [
  { label: "Resumen", href: "/account", testId: "overview-link" },
  {
    label: esCl.account.profile,
    href: "/account/profile",
    testId: "profile-link",
  },
  {
    label: esCl.account.addresses,
    href: "/account/addresses",
    testId: "addresses-link",
  },
  {
    label: esCl.account.orders,
    href: "/account/orders",
    testId: "orders-link",
  },
]

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    setMobileOpen(false)
    await signout(countryCode)
  }

  const isActive = (href: string) => {
    const localizedHref = `/${countryCode}${href}`

    return href === "/account"
      ? pathname === localizedHref
      : pathname.startsWith(localizedHref)
  }

  const currentItem =
    navigationItems.find((item) => isActive(item.href)) ?? navigationItems[0]

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = ""
      return
    }

    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleEscape)
    }
  }, [mobileOpen])

  return (
    <>
      {/* MOBILE / TABLET */}
      <div className="lg:hidden" data-testid="account-nav-mobile">
        <div className="flex min-h-14 items-center justify-between border border-neutral-200 bg-white px-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose-dark)]">
              Mi cuenta
            </p>

            <p className="mt-0.5 truncate text-sm font-semibold text-black">
              {currentItem.label}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-account-menu"
            className="ml-4 flex min-h-10 items-center gap-2 border-l border-neutral-200 pl-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black"
          >
            Menú
            <span aria-hidden="true" className="text-base leading-none">
              ☰
            </span>
          </button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />

            <aside
              id="mobile-account-menu"
              className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl"
              aria-label="Navegación de cuenta"
            >
              <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-6">
                <div className="min-w-0 pr-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose-dark)]">
                    Indiscreta
                  </p>

                  <p className="mt-2 text-xl font-bold uppercase tracking-[-0.03em] text-black">
                    Mi cuenta
                  </p>

                  <p className="mt-2 truncate text-sm text-neutral-500">
                    {customer?.first_name
                      ? `Hola, ${customer.first_name}`
                      : customer?.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 text-xl text-black transition-colors hover:bg-neutral-50"
                >
                  ×
                </button>
              </div>

              <nav
                className="flex-1 overflow-y-auto"
                aria-label="Navegación de cuenta"
              >
                <ul>
                  {navigationItems.map((item, index) => {
                    const active = isActive(item.href)

                    return (
                      <li
                        key={item.href}
                        className="border-b border-neutral-200"
                      >
                        <LocalizedClientLink
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-16 items-center justify-between border-l-4 px-6 transition-colors ${
                            active
                              ? "border-[var(--color-rose)] bg-neutral-50 text-black"
                              : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-black"
                          }`}
                          data-testid={`mobile-${item.testId}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400">
                              0{index + 1}
                            </span>

                            <span className="text-sm font-semibold">
                              {item.label}
                            </span>
                          </div>

                          <span
                            aria-hidden="true"
                            className={
                              active
                                ? "text-[var(--color-rose-dark)]"
                                : "text-neutral-400"
                            }
                          >
                            →
                          </span>
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="border-t border-neutral-200 p-5">
                <LocalizedClientLink
                  href="/ayuda"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center text-sm font-medium text-neutral-600 transition-colors hover:text-[var(--color-rose-dark)]"
                >
                  Centro de ayuda
                </LocalizedClientLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="mobile-logout-button"
                  className="mt-2 flex min-h-12 w-full items-center justify-between border-t border-neutral-200 pt-3 text-left text-sm font-semibold text-black transition-colors hover:text-[var(--color-rose-dark)]"
                >
                  {esCl.account.signOut}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <aside
        className="hidden lg:sticky lg:top-44 lg:block lg:self-start"
        data-testid="account-nav"
      >
        <div className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Cuenta
            </p>

            <p className="mt-2 truncate text-sm font-semibold text-black">
              {customer?.first_name
                ? `Hola, ${customer.first_name}`
                : customer?.email}
            </p>
          </div>

          <nav aria-label="Navegación de cuenta">
            <ul>
              {navigationItems.map((item) => {
                const active = isActive(item.href)

                return (
                  <li key={item.href} className="border-b border-neutral-200">
                    <LocalizedClientLink
                      href={item.href}
                      className={`flex min-h-12 items-center border-l-4 px-5 text-sm font-medium transition-colors ${
                        active
                          ? "border-[var(--color-rose)] bg-neutral-50 text-black"
                          : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-black"
                      }`}
                      data-testid={item.testId}
                    >
                      {item.label}
                    </LocalizedClientLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="p-4">
            <LocalizedClientLink
              href="/ayuda"
              className="flex min-h-11 items-center px-2 text-sm font-medium text-neutral-600 transition-colors hover:text-[var(--color-rose-dark)]"
            >
              Centro de ayuda
            </LocalizedClientLink>

            <button
              type="button"
              onClick={handleLogout}
              data-testid="logout-button"
              className="flex min-h-11 w-full items-center px-2 text-left text-sm font-semibold text-black transition-colors hover:text-[var(--color-rose-dark)]"
            >
              {esCl.account.signOut}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default AccountNav
