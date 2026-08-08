import { esCl } from "@lib/translations/es-cl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Newsletter from "@modules/layout/components/newsletter"
import Image from "next/image"

const shoppingLinks = [
  { label: "Novedades", href: "/store" },
  { label: "Botas", href: "/categories/botas" },
  { label: "Zapatos", href: "/categories/zapatos" },
  { label: "Vestuario", href: "/categories/vestuario" },
  { label: "Accesorios", href: "/categories/accesorios" },
  { label: "Ofertas", href: "/store" },
]

const helpLinks = [
  { label: "Preguntas frecuentes", href: "/ayuda#preguntas-frecuentes" },
  { label: "Envíos", href: "/ayuda#envios" },
  {
    label: "Cambios y devoluciones",
    href: "/ayuda#cambios-y-devoluciones",
  },
  { label: "Guía de tallas", href: "/ayuda#guia-de-tallas" },
  { label: "Contacto", href: "/ayuda#contacto" },
]

const accountLinks = [
  { label: "Mi cuenta", href: "/account" },
  { label: "Mis pedidos", href: "/account/orders" },
  { label: esCl.account.addresses, href: "/account/addresses" },
  { label: "Métodos de pago", href: "/account" },
]

const informationLinks = [
  { label: "Sobre Indiscreta", href: "/informacion#sobre-indiscreta" },
  {
    label: "Términos y condiciones",
    href: "/informacion#terminos-y-condiciones",
  },
  {
    label: "Política de privacidad",
    href: "/informacion#politica-de-privacidad",
  },
]

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: Array<{ label: string; href: string }>
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
        {title}
      </h3>

      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <LocalizedClientLink
              href={link.href}
              className="text-[12px] text-white/60 transition-colors hover:text-[var(--color-rose)]"
            >
              {link.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <Newsletter />

      <div className="store-container">
        <div className="grid gap-10 border-t border-white/10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-12">
          <div>
            <LocalizedClientLink
              href="/"
              className="inline-flex flex-col items-start"
              aria-label="Indiscreta, ir al inicio"
            >
              <Image
                src="/images/brand/indiscreta-wordmark.png"
                alt="Indiscreta"
                width={2400}
                height={633}
                className="h-auto w-[220px] object-contain"
              />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-rose)]">
                Disfruta, vive y descubre
              </span>
            </LocalizedClientLink>

            <p className="mt-4 max-w-[260px] text-[12px] leading-5 text-white/60">
              Moda, calzado y accesorios para expresarte a tu manera.
            </p>

            <div className="mt-6">
              <a
                href="https://www.instagram.com/indiscreta_cl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Indiscreta"
                className="inline-flex items-center gap-3 text-white transition-colors hover:text-[var(--color-rose)]"
              >
                <span className="[&>svg]:h-7 [&>svg]:w-7">
                  <InstagramIcon />
                </span>

                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  @indiscreta_cl
                </span>
              </a>
            </div>
          </div>
          <FooterColumn title="Comprar" links={shoppingLinks} />
          <FooterColumn title="Ayuda" links={helpLinks} />
          <FooterColumn title="Mi cuenta" links={accountLinks} />
          <FooterColumn title="Información" links={informationLinks} />
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-5 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Indiscreta. Todos los derechos reservados.</p>

          <div
            className="flex flex-wrap items-center gap-5 font-semibold uppercase tracking-[0.06em] text-white/75"
            aria-label="Medios de pago aceptados"
          >
            <span>Visa</span>
            <span>Mastercard</span>
            <span>American Express</span>
            <span>Mercado Pago</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
