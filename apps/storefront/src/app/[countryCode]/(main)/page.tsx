import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import StoreBenefits from "@modules/home/components/store-benefits"

export const metadata: Metadata = {
  title: "Tienda de moda femenina",
  description:
    "Moda femenina, calzado y accesorios con despacho a todo Chile.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  return (
    <>
      <Hero />
      <StoreBenefits />
      
      {region && collections?.length > 0 ? (
        <div className="py-12">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      ) : (
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-center text-sm text-neutral-500">
            Los productos destacados estarán disponibles próximamente.
          </p>
        </section>
      )}
    </>
  )
}