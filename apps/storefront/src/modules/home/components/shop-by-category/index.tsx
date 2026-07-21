import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const categories = [
  {
    title: "Botas",
    href: "/categories/botas",
    image: "/images/home/hero-campaign.png",
    position: "object-[35%_center]",
  },
  {
    title: "Zapatos",
    href: "/categories/zapatos",
    image: "/images/home/hero-campaign.png",
    position: "object-[48%_center]",
  },
  {
    title: "Vestuario",
    href: "/categories/vestuario",
    image: "/images/home/hero-campaign.png",
    position: "object-[55%_center]",
  },
  {
    title: "Accesorios",
    href: "/categories/accesorios",
    image: "/images/home/hero-campaign.png",
    position: "object-[70%_center]",
  },
]

export default function ShopByCategory() {
  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="store-container">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Descubre tu estilo
          </p>

          <h2 className="mt-3 text-[22px] font-medium uppercase tracking-[0.08em] text-black sm:text-[26px]">
            Selecciona una categoría
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <LocalizedClientLink
              key={category.title}
              href={category.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100"
            >
              <Image
                src={category.image}
                alt={`Colección de ${category.title.toLowerCase()}`}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${category.position}`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-7 text-center text-white">
                <h3 className="text-lg font-medium uppercase tracking-[0.08em]">
                  {category.title}
                </h3>

                <span className="mt-4 inline-flex min-h-[38px] min-w-[112px] items-center justify-center border border-white px-5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                  Ver más
                </span>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}