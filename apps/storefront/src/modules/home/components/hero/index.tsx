import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero() {
  return (
    <section className="bg-black">
      <div className="grid min-h-[680px] lg:grid-cols-[44%_56%]">
        <div className="flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:px-20">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
              Nueva temporada
            </p>

            <h1 className="mt-6 font-sans text-[54px] font-extrabold uppercase leading-[0.86] tracking-[-0.045em] text-white sm:text-[68px] lg:text-[78px] xl:text-[92px]">
              Vive
              <br />
              <span className="text-[var(--color-rose)]">tu estilo</span>
              <br />
              sin límites
            </h1>

            <p className="mt-8 max-w-[460px] text-sm leading-7 text-white/75 sm:text-base">
              Moda, calzado y accesorios para expresarte a tu manera.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center bg-[var(--color-rose)] px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
              >
                Comprar ahora
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center border border-white/70 px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black"
              >
                Ver novedades
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[680px]">
          <Image
            src="/images/home/hero-campaign.png"
            alt="Mujer luciendo una propuesta de moda femenina en tonos beige y rosado"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 56vw"
            className="object-cover object-[center_22%]"
          />
        </div>
      </div>
    </section>
  )
}
