"use client"

import { FormEvent, useState } from "react"

const recipient = "contacto.indiscreta@gmail.com"

export default function HelpContactForm() {
  const [message, setMessage] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const order = String(form.get("order") ?? "").trim()
    const subject = String(form.get("subject") ?? "").trim()
    const details = String(form.get("details") ?? "").trim()

    if (!name || !email || !subject || !details) {
      setMessage("Completa los campos obligatorios.")
      return
    }

    const body = [
      `Nombre: ${name}`,
      `Correo: ${email}`,
      `Número de pedido: ${order || "No aplica"}`,
      "",
      "Detalle:",
      details,
    ].join("\n")

    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(
      `[Indiscreta] ${subject}`,
    )}&body=${encodeURIComponent(body)}`

    setMessage(
      "Se abrirá tu aplicación de correo para que revises y envíes la solicitud.",
    )
    window.location.href = mailto
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-neutral-200 bg-white p-6 sm:p-7"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-black">
          Nombre completo *
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="mt-2 h-12 w-full border border-neutral-300 px-4 font-normal outline-none transition-colors focus:border-[var(--color-rose)]"
          />
        </label>

        <label className="text-sm font-semibold text-black">
          Correo electrónico *
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2 h-12 w-full border border-neutral-300 px-4 font-normal outline-none transition-colors focus:border-[var(--color-rose)]"
          />
        </label>

        <label className="text-sm font-semibold text-black">
          Número de pedido
          <input
            name="order"
            type="text"
            className="mt-2 h-12 w-full border border-neutral-300 px-4 font-normal outline-none transition-colors focus:border-[var(--color-rose)]"
          />
        </label>

        <label className="text-sm font-semibold text-black">
          Asunto *
          <select
            name="subject"
            defaultValue=""
            className="mt-2 h-12 w-full border border-neutral-300 bg-white px-4 font-normal outline-none transition-colors focus:border-[var(--color-rose)]"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="Consulta general">Consulta general</option>
            <option value="Estado de pedido">Estado de pedido</option>
            <option value="Problema con el despacho">
              Problema con el despacho
            </option>
            <option value="Cambio o devolución">Cambio o devolución</option>
            <option value="Garantía">Garantía</option>
            <option value="Consulta de talla">Consulta de talla</option>
          </select>
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-black">
        Detalle de la consulta *
        <textarea
          name="details"
          rows={6}
          className="mt-2 w-full resize-y border border-neutral-300 px-4 py-3 font-normal outline-none transition-colors focus:border-[var(--color-rose)]"
        />
      </label>

      <button
        type="submit"
        className="mt-6 inline-flex min-h-12 items-center justify-center bg-[var(--color-rose)] px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
      >
        Preparar correo
      </button>

      {message ? (
        <p className="mt-4 text-sm leading-6 text-neutral-600" role="status">
          {message}
        </p>
      ) : null}
    </form>
  )
}
