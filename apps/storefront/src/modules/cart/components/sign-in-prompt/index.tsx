import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <section className="flex flex-col gap-5 border border-neutral-200 bg-neutral-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
          Tu cuenta
        </p>

        <h2 className="mt-2 text-xl font-bold tracking-[-0.025em] text-black">
          ¿Ya eres cliente?
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
          Inicia sesión para usar tus direcciones guardadas y revisar tus
          pedidos desde tu cuenta.
        </p>
      </div>

      <LocalizedClientLink
        href="/account"
        className="inline-flex min-h-11 shrink-0 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
        data-testid="sign-in-button"
      >
        Iniciar sesión
      </LocalizedClientLink>
    </section>
  )
}

export default SignInPrompt
