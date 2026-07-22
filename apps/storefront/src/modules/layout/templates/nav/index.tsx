import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import MarqueePromo from "@modules/layout/components/marquee-promo"
import SideMenu from "@modules/layout/components/side-menu"

const navigationItems = [
  {
    label: "Novedades",
    href: "/store",
  },
  {
    label: "Botas",
    href: "/categories/botas",
  },
  {
    label: "Zapatos",
    href: "/categories/zapatos",
  },
  {
    label: "Vestuario",
    href: "/categories/vestuario",
  },
  {
    label: "Accesorios",
    href: "/categories/accesorios",
  },
]

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[22px] w-[22px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[21px] w-[21px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
    </svg>
  )
}

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <MarqueePromo />

      <header className="border-b border-neutral-200 bg-white">
        <div className="store-container">
          <div className="grid h-[88px] grid-cols-3 items-center sm:h-[104px] lg:h-[112px]">
            <div className="flex items-center gap-6">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />

              <LocalizedClientLink
                href="/store"
                aria-label="Buscar productos"
                className="hidden text-black transition-opacity hover:opacity-60 sm:inline-flex"
              >
                <SearchIcon />
              </LocalizedClientLink>
            </div>

            <div className="flex justify-center">
              <LocalizedClientLink
                href="/"
                className="group flex flex-col items-center justify-center"
                data-testid="nav-store-link"
                aria-label="Indiscreta, ir al inicio"
              >
                <span className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-4 -top-3 text-[var(--color-rose)] sm:-left-5"
                  >
                    ✦
                  </span>

                  <span className="brand-wordmark text-[29px] text-black sm:text-[38px] lg:text-[46px]">
                    Indiscreta
                  </span>
                </span>

                <span className="brand-tagline mt-3 hidden whitespace-nowrap sm:block">
                  Elegancia para todos tus días
                </span>
              </LocalizedClientLink>
            </div>

            <div className="flex items-center justify-end gap-5 sm:gap-7">
              <LocalizedClientLink
                href="/account"
                className="hidden items-center gap-2 text-xs font-medium text-black transition-opacity hover:opacity-60 sm:flex"
                data-testid="nav-account-link"
              >
                <AccountIcon />
                <span>Cuenta</span>
              </LocalizedClientLink>

              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="text-xs font-medium text-black"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Carrito (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>

          <nav
            aria-label="Navegación principal"
            className="hidden h-[58px] items-center justify-center gap-12 border-t border-neutral-100 lg:flex"
          >
            {navigationItems.map((item) => (
              <LocalizedClientLink
                key={item.label}
                href={item.href}
                className="relative py-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition-colors after:absolute after:bottom-3 after:left-0 after:h-px after:w-0 after:bg-black after:transition-all hover:after:w-full"
              >
                {item.label}
              </LocalizedClientLink>
            ))}

            <LocalizedClientLink
              href="/store"
              className="relative py-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-rose-dark)] transition-opacity hover:opacity-70"
            >
              Ofertas
            </LocalizedClientLink>
          </nav>
        </div>
      </header>
    </div>
  )
}

