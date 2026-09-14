"use client"
import { esCl } from "@lib/translations/es-cl"
import FilterRadioGroup from "@modules/common/components/filter-radio-group"
export type SortOptions = "price_asc" | "price_desc" | "created_at"
type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}
const sortOptions = [
  {
    value: "created_at",
    label: esCl.product.latest,
  },
  {
    value: "price_asc",
    label: esCl.product.priceAscending,
  },
  {
    value: "price_desc",
    label: esCl.product.priceDescending,
  },
]
const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }
  return (
    <FilterRadioGroup
      title={esCl.product.sortBy}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}
export default SortProducts
