import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewArrivalsCarousel from "./carousel"
import NewArrivalProductCard from "./product-card"
import { HttpTypes } from "@medusajs/types"

type NewArrivalsProps = {
  countryCode: string
}

export default async function NewArrivals({
  countryCode,
}: NewArrivalsProps) {
  let products: HttpTypes.StoreProduct[] = []

  try {

  const result = await listProducts({
    countryCode,
    pageParam: 1,
    queryParams: {
      limit: 10,
    },
  })

  products = result.response.products ?? []

} catch (error) {
  console.error("[NewArrivals] error completo:", error)
}

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="store-container">
        <div className="mb-8 flex items-end justify-between sm:mb-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
              Recién llegados
            </p>

            <h2 className="mt-3 text-[22px] font-medium uppercase tracking-[0.08em] text-black sm:text-[26px]">
              Lo más nuevo
            </h2>
          </div>

          <LocalizedClientLink
            href="/store"
            className="hidden border-b border-black pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:border-[var(--color-rose)] hover:text-[var(--color-rose)] sm:block"
          >
            Ver todo
          </LocalizedClientLink>
        </div>

        {products.length > 0 ? (
          <NewArrivalsCarousel>
            {products.map((product) => (
              <NewArrivalProductCard
                key={product.id}
                product={product}
              />
            ))}
          </NewArrivalsCarousel>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center border border-neutral-200 bg-neutral-50 px-6 text-center">
            <p className="font-editorial text-3xl text-black">
              Próximamente
            </p>

            <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
              Los primeros productos de la colección aparecerán aquí cuando los
              carguemos en Medusa.
            </p>

            <LocalizedClientLink
              href="/store"
              className="mt-7 inline-flex min-h-[46px] items-center justify-center bg-black px-8 text-[10px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-rose)]"
            >
              Explorar tienda
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </section>
  )
}