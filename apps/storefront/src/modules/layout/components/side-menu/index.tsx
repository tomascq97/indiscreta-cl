"use client"

import { esCl } from "@lib/translations/es-cl"
import { Locale } from "@lib/data/locales"
import { HttpTypes } from "@medusajs/types"
import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { useEffect } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const navigationItems = [
  {
    number: "01",
    label: esCl.navigation.home,
    href: "/",
  },
  {
    number: "02",
    label: "Novedades",
    href: "/store",
  },
  {
    number: "03",
    label: "Botas",
    href: "/categories/botas",
  },
  {
    number: "04",
    label: "Zapatos",
    href: "/categories/zapatos",
  },
  {
    number: "05",
    label: "Vestuario",
    href: "/categories/vestuario",
  },
  {
    number: "06",
    label: "Accesorios",
    href: "/categories/accesorios",
  },
  {
    number: "07",
    label: "Ofertas",
    href: "/store",
  },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

type MenuLifecycleProps = {
  close: () => void
}

const MenuLifecycle = ({ close }: MenuLifecycleProps) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEscape)
    }
  }, [close])

  return null
}

export default function SideMenu({
  regions: _regions,
  locales: _locales,
  currentLocale: _currentLocale,
}: SideMenuProps) {
  return (
    <div className="flex h-full items-center">
      <Popover className="relative flex h-full">
        {({ open, close }) => (
          <>
            <Popover.Button
              data-testid="nav-menu-button"
              aria-label={esCl.navigation.openMenu}
              className="group relative flex h-full items-center justify-center text-current transition-opacity hover:opacity-60 focus:outline-none"
            >
              <span className="flex h-6 w-7 flex-col justify-center gap-[5px]">
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-full bg-current" />
              </span>
            </Popover.Button>

            <Transition show={open}>
              <div
                className="
                  fixed inset-0 z-[200]
                  transition duration-300 ease-out
                  data-[closed]:-translate-x-full
                  data-[closed]:opacity-0
                "
              >
                <MenuLifecycle close={close} />

                <PopoverPanel
                  static
                  className="flex h-dvh w-full flex-col bg-black text-white shadow-2xl"
                >
                  <div
                    data-testid="nav-menu-popup"
                    className="flex h-full min-h-0 flex-col"
                  >
                    <header className="flex shrink-0 items-center justify-between border-b border-white/15 px-5 py-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
                          Indiscreta
                        </p>

                        <p className="mt-1 text-lg font-bold uppercase tracking-[-0.02em]">
                          Menú principal
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid="close-menu-button"
                        aria-label={esCl.navigation.closeMenu}
                        onClick={close}
                        className="group flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 bg-black !text-white transition-colors hover:border-white hover:bg-white hover:!text-black"
                      >
                        <span
                          aria-hidden="true"
                          className="block !text-white text-2xl font-light leading-none transition-colors group-hover:!text-black"
                        >
                          ×
                        </span>
                      </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <div className="px-5 py-7">
                        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                          Navegación
                        </p>

                        <nav aria-label="Navegación principal">
                          <ul className="border-t border-white/15">
                            {navigationItems.map((item) => (
                              <li
                                key={`${item.number}-${item.label}`}
                                className="border-b border-white/15"
                              >
                                <LocalizedClientLink
                                  href={item.href}
                                  onClick={close}
                                  className="group flex min-h-16 items-center justify-between py-4 text-white transition-colors hover:text-[var(--color-rose)]"
                                  data-testid={`${item.label
                                    .toLowerCase()
                                    .replaceAll(" ", "-")}-link`}
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-semibold tracking-[0.16em] text-white/35 transition-colors group-hover:text-[var(--color-rose)]">
                                      {item.number}
                                    </span>

                                    <span className="text-base font-semibold uppercase tracking-[0.1em]">
                                      {item.label}
                                    </span>
                                  </div>

                                  <span
                                    aria-hidden="true"
                                    className="text-lg text-white/45 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-rose)]"
                                  >
                                    →
                                  </span>
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        </nav>

                        <section className="mt-8">
                          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                            Tu experiencia
                          </p>

                          <div className="border-t border-white/15">
                            <LocalizedClientLink
                              href="/account"
                              onClick={close}
                              className="group flex min-h-14 items-center justify-between border-b border-white/15 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:text-[var(--color-rose)]"
                            >
                              Mi cuenta
                              <span
                                aria-hidden="true"
                                className="text-white/45 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-rose)]"
                              >
                                →
                              </span>
                            </LocalizedClientLink>

                            <LocalizedClientLink
                              href="/cart"
                              onClick={close}
                              className="group flex min-h-14 items-center justify-between border-b border-white/15 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:text-[var(--color-rose)]"
                            >
                              Carrito
                              <span
                                aria-hidden="true"
                                className="text-white/45 transition-all group-hover:translate-x-1 group-hover:text-[var(--color-rose)]"
                              >
                                →
                              </span>
                            </LocalizedClientLink>
                          </div>
                        </section>
                      </div>
                    </div>

                    <footer className="shrink-0 border-t border-white/15 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
                            Envíos nacionales
                          </p>

                          <p className="mt-1 text-sm text-white/70">
                            Despachamos a todo Chile.
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full bg-[var(--color-rose)]"
                        />
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                        <a
                          href="https://www.instagram.com/indiscreta_cl/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:text-[var(--color-rose)]"
                        >
                          @indiscreta_cl
                        </a>

                        <p className="text-[10px] text-white/35">
                          © Indiscreta
                        </p>
                      </div>
                    </footer>
                  </div>
                </PopoverPanel>
              </div>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}
