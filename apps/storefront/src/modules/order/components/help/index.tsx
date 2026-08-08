import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Help = () => {
  return (
    <section className="mt-8 border border-neutral-200 bg-white p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
        Atención al cliente
      </p>

      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            ¿Necesitas ayuda con tu pedido?
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Revisa nuestras preguntas frecuentes o escríbenos para recibir ayuda
            con tu compra.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LocalizedClientLink
            href="/ayuda#contacto"
            className="inline-flex min-h-11 items-center justify-center bg-black px-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
          >
            Contacto
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/ayuda#cambios-y-devoluciones"
            className="inline-flex min-h-11 items-center justify-center border border-black px-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
          >
            Cambios y devoluciones
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Help
