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

        <div
          className="relative min-h-[520px] overflow-hidden md:min-h-[640px]"
          style={{ backgroundColor: "var(--color-beige)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="editorial-eyebrow">Imagen de campaña</span>
          </div>

          <div
            className="absolute bottom-0 left-0 h-28 w-28"
            style={{ backgroundColor: "var(--color-rose)" }}
          />
        </div>
      </div>
    </section>
  )
}