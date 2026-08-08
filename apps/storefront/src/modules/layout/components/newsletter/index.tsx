"use client"
import { esCl } from "@lib/translations/es-cl"
import { FormEvent, useState } from "react"
export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      setMessage("Ingresa tu correo electrónico.")
      return
    }
    setMessage("Gracias por sumarte a Indiscreta.")
    setEmail("")
  }
  return (
    <section className="border-b border-white/15 bg-black text-white">
      <div className="store-container">
        <div className="grid gap-6 py-7 lg:grid-cols-[34%_1fr] lg:items-center lg:gap-12">
          <div className="relative pl-9">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 text-[30px] leading-none text-[var(--color-rose)]"
            >
              ✦
            </span>

            <h2 className="text-lg font-medium uppercase tracking-[0.12em]">
              Súmate a Indiscreta
            </h2>

            <p className="mt-1.5 max-w-sm text-[11px] leading-4 text-white/65">
              Recibe novedades, beneficios exclusivos y acceso anticipado a
              nuestros lanzamientos.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-3 sm:grid-cols-[1fr_190px]"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {esCl.account.email}
            </label>

            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setMessage("")
              }}
              placeholder="Tu email"
              className="h-12 w-full border border-white/20 bg-white px-5 text-sm text-black outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--color-rose)]"
            />

            <button
              type="submit"
              className="h-12 bg-[var(--color-rose)] px-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            >
              Suscribirme
            </button>

            {message && (
              <p className="text-xs text-white/65 sm:col-span-2" role="status">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
