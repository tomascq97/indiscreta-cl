import HeroMediaCarousel from "@modules/home/components/hero-media-carousel"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero() {
  return (
    <section className="bg-black">
      <div className="grid lg:min-h-[680px] lg:grid-cols-[44%_56%]">
        <div className="flex items-center px-6 py-8 sm:px-10 lg:px-16 lg:py-16 xl:px-20">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-rose)]">
              Nueva temporada
            </p>

            <h1 className="mt-4 font-sans text-[46px] font-extrabold uppercase leading-[0.88] tracking-[-0.045em] text-white sm:text-[62px] lg:mt-6 lg:text-[78px] lg:leading-[0.86] xl:text-[92px]">
              Vive
              <br />
              <span className="text-[var(--color-rose)]">tu estilo</span>
              <br />
              sin límites
            </h1>

            <p className="mt-6 max-w-[460px] text-sm leading-6 text-white/75 sm:text-base lg:mt-8 lg:leading-7">
              Moda, calzado y accesorios para expresarte a tu manera.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 lg:mt-10">
              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center bg-[var(--color-rose)] px-4 text-[10px] sm:px-6 sm:text-[11px] lg:px-8 font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
              >
                Comprar ahora
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center border border-white/70 px-4 text-[10px] sm:px-6 sm:text-[11px] lg:px-8 font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black"
              >
                Ver novedades
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/4] lg:aspect-auto lg:min-h-[680px]">
          <HeroMediaCarousel />
        </div>
      </div>
    </section>
  )
}
