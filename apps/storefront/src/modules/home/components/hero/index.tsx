import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      <div className="store-container grid min-h-[78vh] grid-cols-1 items-center gap-12 py-14 md:grid-cols-2 md:py-20 lg:min-h-[82vh]">
        <div className="max-w-2xl">
          <p className="editorial-eyebrow">Nueva temporada</p>

          <h1 className="editorial-title mt-7">
            Elegancia para todos tus días
          </h1>

          <p className="body-copy mt-8 max-w-lg">
            Prendas, calzado y accesorios seleccionados para una mujer moderna,
            femenina y segura de su propio estilo.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink href="/store" className="btn-primary">
              Comprar ahora
            </LocalizedClientLink>

            <LocalizedClientLink href="/store" className="btn-secondary">
              Nueva colección
            </LocalizedClientLink>
          </div>
        </div>

        <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-beige)]">
          <Image
            src="/images/home/hero-campaign.png"
            alt="Mujer luciendo una propuesta de moda femenina en tonos beige y rosado"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-cover object-center"
          />

          <div className="pointer-events-none absolute inset-0 bg-black/5" />
        </div>
      </div>
    </section>
  )
}