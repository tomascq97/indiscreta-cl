import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import StoreBenefits from "@modules/home/components/store-benefits"
import ShopByCategory from "@modules/home/components/shop-by-category"
import NewCollectionBanner from "@modules/home/components/new-collection-banner"
import NewArrivals from "@modules/home/components/new-arrivals"

export const metadata: Metadata = {
  title: "Indiscreta | Moda femenina, calzado y accesorios",
  description:
    "Descubre Indiscreta: moda femenina, calzado y accesorios para mujeres que no pasan desapercibidas. Despachos a todo Chile.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <>
      <Hero />
      <StoreBenefits />
      <ShopByCategory />
      <NewCollectionBanner />
      <NewArrivals countryCode={countryCode} />
    </>
  )
}