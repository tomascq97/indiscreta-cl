import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Hero() {
  return (
    <section className="overflow-hidden bg-black">
      <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[45%_55%]">
        <div className="flex items-center bg-black px-6 py-16 text-white sm:px-10 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-rose)]">
              Nueva temporada
            </p>

            <h1 className="mt-6 font-editorial text-[58px] font-medium leading-[0.88] tracking-[-0.035em] text-white sm:text-[72px] lg:text-[84px] xl:text-[94px]">
              Elegancia
              <br />
              para todos
              <br />
              <span className="text-[var(--color-rose)]">tus días</span>
            </h1>

            <p className="mt-8 max-w-md text-sm leading-6 text-white/75">
              Prendas, calzado y accesorios seleccionados para una mujer
              moderna, femenina y segura de su propio estilo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center bg-[var(--color-rose)] px-8 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
              >
                Comprar ahora
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-[52px] items-center justify-center border border-white/70 px-8 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-black"
              >
                Nueva colección
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[640px]">
          <Image
            src="/images/home/hero-campaign.png"
            alt="Mujer luciendo una propuesta de moda femenina en tonos beige y rosado"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 55vw"
            className="object-cover object-[center_22%]"
          />
        </div>
      </div>
    </section>
  )
}