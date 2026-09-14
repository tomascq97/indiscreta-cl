import LocalizedClientLink from "@modules/common/components/localized-client-link"

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6.5 8.5h11l1 12h-13l1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  )
}

const EmptyCartMessage = () => {
  return (
    <div
      className="border border-dashed border-neutral-300 bg-neutral-50 px-6 py-14 text-center"
      data-testid="empty-cart-message"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-rose)]">
        <BagIcon />
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
        Tu selección
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-black">
        Tu carrito está vacío
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-neutral-600">
        Explora nuestras colecciones y agrega tus productos favoritos para
        comenzar tu compra.
      </p>

      <LocalizedClientLink
        href="/store"
        className="mt-7 inline-flex min-h-12 items-center justify-center bg-black px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
      >
        Explorar productos
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
