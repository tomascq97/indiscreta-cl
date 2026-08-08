import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-neutral-50 text-black">
      <header className="border-b border-neutral-800 bg-black text-white">
        <div className="store-container grid h-[82px] grid-cols-3 items-center sm:h-[94px]">
          <LocalizedClientLink
            href="/cart"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 transition-colors hover:text-[var(--color-rose)]"
            data-testid="back-to-cart-link"
          >
            <ArrowLeftIcon />
            <span className="hidden sm:inline">Volver al carrito</span>
            <span className="sm:hidden">Volver</span>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/"
            className="flex justify-center"
            data-testid="store-link"
            aria-label="Indiscreta, ir al inicio"
          >
            <Image
              src="/images/brand/indiscreta-wordmark.png"
              alt="Indiscreta"
              width={2400}
              height={760}
              priority
              className="h-auto w-[145px] object-contain sm:w-[190px]"
            />
          </LocalizedClientLink>

          <div className="flex justify-end">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:block">
              Compra segura
            </span>
          </div>
        </div>
      </header>

      <main data-testid="checkout-container">{children}</main>
    </div>
  )
}
