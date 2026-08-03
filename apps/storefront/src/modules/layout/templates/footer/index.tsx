import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Newsletter from "@modules/layout/components/newsletter"

const shoppingLinks = [
  { label: "Novedades", href: "/store" },
  { label: "Botas", href: "/categories/botas" },
  { label: "Zapatos", href: "/categories/zapatos" },
  { label: "Vestuario", href: "/categories/vestuario" },
  { label: "Accesorios", href: "/categories/accesorios" },
  { label: "Ofertas", href: "/store" },
]

const helpLinks = [
  { label: "Preguntas frecuentes", href: "/" },
  { label: "Envíos", href: "/" },
  { label: "Cambios y devoluciones", href: "/" },
  { label: "Guía de talles", href: "/" },
  { label: "Contacto", href: "/" },
]

const accountLinks = [
  { label: "Mi cuenta", href: "/account" },
  { label: "Mis pedidos", href: "/account/orders" },
  { label: "Direcciones", href: "/account/addresses" },
  { label: "Métodos de pago", href: "/account" },
]

const informationLinks = [
  { label: "Sobre Indiscreta", href: "/" },
  { label: "Términos y condiciones", href: "/" },
  { label: "Política de privacidad", href: "/" },
]

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14 4v10.2a4.2 4.2 0 1 1-3.7-4.2" />
      <path d="M14 4c.8 2.3 2.2 3.6 4.5 4" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a23 23 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2V10H7.5v3h2.8v8h3.2Z" />
    </svg>
  )
}

function PinterestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 19 12 9.5" />
      <path d="M9.2 14.5c-1.6-.8-2.2-2.4-1.8-4.3.6-2.8 3.3-4.7 6.2-4.1 2.8.5 4.3 3 3.8 5.7-.5 2.4-2.2 4.1-4.2 3.7-1.1-.2-1.8-1-1.6-2" />
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
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
        {title}
      </h3>

      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <LocalizedClientLink
              href={link.href}
              className="text-[11px] text-white/60 transition-colors hover:text-[var(--color-rose)]"
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
        <div className="grid gap-9 py-8 sm:grid-cols-2 lg:grid-cols-[1.45fr_repeat(4,1fr)] lg:gap-12">
          <div>
            <LocalizedClientLink
              href="/"
              className="brand-wordmark text-2xl text-white"
              aria-label="Indiscreta, ir al inicio"
            >
              Indiscreta
            </LocalizedClientLink>

            <p className="mt-3 max-w-[220px] text-[11px] leading-4 text-white/60">
              Elegancia para todos tus días.
            </p>

            <div className="mt-5 flex items-center gap-5">
              <a
                href="#"
                aria-label="Instagram de Indiscreta"
                className="transition-colors hover:text-[var(--color-rose)]"
              >
                <InstagramIcon />
              </a>

              <a
                href="#"
                aria-label="TikTok de Indiscreta"
                className="transition-colors hover:text-[var(--color-rose)]"
              >
                <TikTokIcon />
              </a>

              <a
                href="#"
                aria-label="Facebook de Indiscreta"
                className="transition-colors hover:text-[var(--color-rose)]"
              >
                <FacebookIcon />
              </a>

              <a
                href="#"
                aria-label="Pinterest de Indiscreta"
                className="transition-colors hover:text-[var(--color-rose)]"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>

          <FooterColumn title="Comprar" links={shoppingLinks} />
          <FooterColumn title="Ayuda" links={helpLinks} />
          <FooterColumn title="Mi cuenta" links={accountLinks} />
          <FooterColumn title="Información" links={informationLinks} />
        </div>

        <div className="flex flex-col gap-4 border-t border-white/15 py-4 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Indiscreta. Todos los derechos
            reservados.
          </p>

          <div
            className="flex flex-wrap items-center gap-4 font-semibold uppercase tracking-[0.06em] text-white/75"
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