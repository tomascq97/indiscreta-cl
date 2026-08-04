import type { HttpTypes } from "@medusajs/types"
import { describe, expect, it } from "vitest"

import { sortProducts } from "../sort-products"

const products = [
  {
    id: "expensive",
    created_at: "2024-01-01T00:00:00.000Z",
    variants: [{ calculated_price: { calculated_amount: 3000 } }],
  },
  {
    id: "multiple-prices",
    created_at: "2024-03-01T00:00:00.000Z",
    variants: [
      { calculated_price: { calculated_amount: 2000 } },
      { calculated_price: { calculated_amount: 1000 } },
    ],
  },
  {
    id: "no-variants",
    created_at: "2024-02-01T00:00:00.000Z",
    variants: [],
  },
] as unknown as HttpTypes.StoreProduct[]

describe("sortProducts", () => {
  it("sorts by the lowest variant price and leaves products without variants last", () => {
    const result = sortProducts(structuredClone(products), "price_asc")

    expect(result.map((product) => product.id)).toEqual([
      "multiple-prices",
      "expensive",
      "no-variants",
    ])
  })

  it("sorts products by descending minimum price", () => {
    const result = sortProducts(structuredClone(products), "price_desc")

    expect(result.map((product) => product.id)).toEqual([
      "expensive",
      "multiple-prices",
      "no-variants",
    ])
  })

  it("keeps variants without calculated prices last without treating them as zero", () => {
    const missingPrices = [
      {
        id: "missing-calculated-price",
        variants: [{ calculated_price: null }, {}],
      },
      {
        id: "zero-price",
        variants: [{ calculated_price: { calculated_amount: 0 } }],
      },
      {
        id: "priced",
        variants: [{ calculated_price: { calculated_amount: 1000 } }],
      },
    ] as unknown as HttpTypes.StoreProduct[]

    expect(
      sortProducts(structuredClone(missingPrices), "price_asc").map(
        (product) => product.id
      )
    ).toEqual(["zero-price", "priced", "missing-calculated-price"])
    expect(
      sortProducts(structuredClone(missingPrices), "price_desc").map(
        (product) => product.id
      )
    ).toEqual(["priced", "zero-price", "missing-calculated-price"])
  })

  it("sorts newest products first", () => {
    const result = sortProducts(structuredClone(products), "created_at")

    expect(result.map((product) => product.id)).toEqual([
      "multiple-prices",
      "no-variants",
      "expensive",
    ])
  })
})
