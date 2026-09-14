import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function NewCollectionBanner() {
  return (
    <section className="bg-white py-4 lg:py-6">
      <div className="store-container">
        <div className="overflow-hidden rounded-sm">
          <div className="grid min-h-[330px] lg:grid-cols-[35%_65%]">
            {/* Texto */}

            <div className="flex items-center bg-[var(--color-rose)] px-12 py-12 text-white">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/75">
                  En línea y en tienda
                </p>

                <h2 className="mt-4 font-editorial text-6xl leading-[0.88]">
                  Nueva
                  <br />
                  colección
                </h2>

                <p className="mt-5 text-sm text-white/85">
                  Descubre lo último de la temporada.
                </p>

                <LocalizedClientLink
                  href="/store"
                  className="mt-8 inline-flex h-12 items-center bg-black px-8 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:bg-white hover:text-black"
                >
                  Compra ahora
                </LocalizedClientLink>
              </div>
            </div>

            {/* Imagen */}

            <div className="relative">
              <Image
                src="/images/home/new-collection-banner.png"
                alt="Nueva colección de moda femenina Indiscreta"
                fill
                priority
                sizes="65vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
