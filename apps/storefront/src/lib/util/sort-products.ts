import type { HttpTypes } from "@medusajs/types"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = products as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        const prices = product.variants
          .map((variant) => variant?.calculated_price?.calculated_amount)
          .filter((price): price is number => typeof price === "number")

        product._minPrice = prices.length
          ? Math.min(...prices)
          : Infinity
      } else {
        product._minPrice = Infinity
      }
    })

    // Keep products without a calculable price last in both directions
    sortedProducts.sort((a, b) => {
      if (!Number.isFinite(a._minPrice)) {
        return Number.isFinite(b._minPrice) ? 1 : 0
      }

      if (!Number.isFinite(b._minPrice)) {
        return -1
      }

      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}
