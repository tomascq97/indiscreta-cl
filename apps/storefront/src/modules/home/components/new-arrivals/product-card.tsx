import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPrice from "@modules/products/components/product-preview/price"
import Thumbnail from "@modules/products/components/thumbnail"

type NewArrivalProductCardProps = {
  product: HttpTypes.StoreProduct
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="h-5 w-5"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  )
}

export default function NewArrivalProductCard({
  product,
}: NewArrivalProductCardProps) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <article className="group min-w-0 snap-start">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="block"
      >
        <div className="relative overflow-hidden bg-[#f7f5f4]">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
          />

          <span className="absolute left-3 top-3 z-10 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-rose-dark)]">
            Nuevo
          </span>

          <span
            aria-hidden="true"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-black backdrop-blur-sm transition-colors group-hover:bg-black group-hover:text-white"
          >
            <HeartIcon />
          </span>

          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.03]" />
        </div>

        <div className="pt-4">
          <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-black">
            {product.title}
          </h3>

          <div className="mt-1 text-xs font-medium text-black">
            {cheapestPrice ? (
              <PreviewPrice price={cheapestPrice} />
            ) : (
              <span>Precio no disponible</span>
            )}
          </div>
        </div>
      </LocalizedClientLink>
    </article>
  )
}