import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

import MarqueePromo from "@modules/layout/components/marquee-promo"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <MarqueePromo />

      <header className="relative mx-auto h-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex h-full flex-1 basis-0 items-center">
            <SideMenu
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
          </div>

          <div className="flex h-full items-center">
            <LocalizedClientLink
              href="/"
              className="text-xl font-semibold uppercase tracking-[0.12em] text-neutral-950"
              data-testid="nav-store-link"
            >
              Tienda
            </LocalizedClientLink>
          </div>

          <div className="flex h-full flex-1 basis-0 items-center justify-end gap-6">
            <LocalizedClientLink
              className="hidden text-sm font-medium text-neutral-700 transition hover:text-neutral-950 small:block"
              href="/account"
              data-testid="nav-account-link"
            >
              Cuenta
            </LocalizedClientLink>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-sm font-medium text-neutral-700 transition hover:text-neutral-950"
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
        </nav>
      </header>
    </div>
  )
}
