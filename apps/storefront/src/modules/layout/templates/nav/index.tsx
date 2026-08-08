import { esCl } from "@lib/translations/es-cl"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import MarqueePromo from "@modules/layout/components/marquee-promo"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"
import { Suspense } from "react"

const navigationItems = [
  { label: "Novedades", href: "/store" },
  { label: "Botas", href: "/categories/botas" },
  { label: "Zapatos", href: "/categories/zapatos" },
  { label: "Vestuario", href: "/categories/vestuario" },
  { label: "Accesorios", href: "/categories/accesorios" },
]

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[23px] w-[23px]"
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
      className="h-[22px] w-[22px]"
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

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
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

      <header className="border-b border-neutral-200 bg-white text-black lg:border-neutral-800 lg:bg-black lg:text-[var(--color-rose)]">
        <div className="store-container">
          <div className="grid h-[60px] grid-cols-3 items-center sm:h-[68px] lg:h-[92px]">
            <div className="flex items-center gap-5 lg:gap-6">
                <div className="lg:hidden [&_button]:text-black">
                  <SideMenu
                    regions={regions}
                    locales={locales}
                    currentLocale={currentLocale}
                  />
                </div>

                <LocalizedClientLink
                  href="/store"
                  aria-label={esCl.navigation.searchProducts}
                  className="inline-flex items-center gap-3 text-current transition-opacity hover:opacity-70"
                >
                  <SearchIcon />

                  <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-white lg:inline">
                    Buscar
                  </span>
                </LocalizedClientLink>

                <a
                  href="https://www.instagram.com/indiscreta_cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Indiscreta"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-current transition-all duration-200 hover:scale-110 hover:text-[var(--color-rose)]"
                >
                  <span className="[&>svg]:h-5 [&>svg]:w-5">
                    <InstagramIcon />
                  </span>
                </a>
              </div>

            <div className="flex justify-center">
              <LocalizedClientLink
                href="/"
                className="group flex flex-col items-center justify-center"
                data-testid="nav-store-link"
                aria-label="Indiscreta, ir al inicio"
              >
                <Image
                  src="/images/brand/indiscreta-wordmark.png"
                  alt="Indiscreta"
                  width={2400}
                  height={760}
                  priority
                  className="h-auto w-[132px] object-contain sm:w-[170px] lg:w-[250px]"
                />

                <span className="brand-tagline mt-1 hidden whitespace-nowrap lg:block">
                  Disfruta, vive y descubre
                </span>
              </LocalizedClientLink>
            </div>

            <div className="flex items-center justify-end gap-4 sm:gap-7 lg:gap-9">
              <LocalizedClientLink
                href="/account"
                className="hidden items-center gap-3 text-xs font-medium text-current transition-opacity hover:opacity-70 sm:flex"
                data-testid="nav-account-link"
              >
                <AccountIcon />
                <span className="hidden uppercase tracking-[0.18em] text-white lg:inline">
                  {esCl.navigation.account}
                </span>
              </LocalizedClientLink>

              <div className="text-current [&_*]:text-current">
                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="text-xs font-medium text-current"
                      href="/cart"
                      data-testid="nav-cart-link"
                    >
                      {esCl.navigation.cart} (0)
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </div>
          </div>

          <nav
            aria-label="Navegación principal"
            className="hidden h-[42px] items-center justify-center gap-12 border-t border-neutral-800 lg:flex"
          >
            {navigationItems.map((item) => (
              <LocalizedClientLink
                key={item.label}
                href={item.href}
                className="relative py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-rose)] transition-opacity after:absolute after:bottom-2 after:left-0 after:h-px after:w-0 after:bg-[var(--color-rose)] after:transition-all hover:opacity-80 hover:after:w-full"
              >
                {item.label}
              </LocalizedClientLink>
            ))}

            <LocalizedClientLink
              href="/store"
              className="relative py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-rose)] transition-opacity after:absolute after:bottom-2 after:left-0 after:h-px after:w-0 after:bg-[var(--color-rose)] after:transition-all hover:opacity-80 hover:after:w-full"
            >
              Ofertas
            </LocalizedClientLink>
          </nav>
        </div>
      </header>
    </div>
  )
}
