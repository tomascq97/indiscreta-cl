import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

type CartRecommendationsProps = {
  cart: HttpTypes.StoreCart
}

export default async function CartRecommendations({
  cart,
}: CartRecommendationsProps) {
  const region = cart.region

  if (!region?.id) {
    return null
  }

  const cartProductIds = new Set(
    (cart.items ?? [])
      .map((item) => item.product_id)
      .filter((productId): productId is string => Boolean(productId)),
  )

  const recommendations = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 12,
      is_giftcard: false,
    },
  })
    .then(({ response }) =>
      response.products
        .filter(
          (product) =>
            Boolean(product.id) &&
            !cartProductIds.has(product.id!) &&
            product.variants?.some((variant) => {
              if (variant.manage_inventory === false) {
                return true
              }

              return (variant.inventory_quantity ?? 0) > 0
            }),
        )
        .slice(0, 4),
    )
    .catch(() => [])

  if (!recommendations.length) {
    return null
  }

  return (
    <section
      className="mt-16 border-t border-neutral-200 pt-12 sm:mt-20 sm:pt-16"
      aria-labelledby="cart-recommendations-title"
      data-testid="cart-recommendations"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Selección Indiscreta
        </p>

        <h2
          id="cart-recommendations-title"
          className="mt-2 text-3xl font-bold tracking-[-0.035em] text-black"
        >
          También podría gustarte
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
          Completa tu compra con productos seleccionados de nuestro catálogo.
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {recommendations.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
