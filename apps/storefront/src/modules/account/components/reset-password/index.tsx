"use client"

import { updatePassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type ResetPasswordProps = {
  token: string
  email: string
}

const invalidLinkMessage =
  "Este enlace no es válido o ha expirado. Solicita uno nuevo."

const ResetPassword = ({ token, email }: ResetPasswordProps) => {
  const [result, formAction] = useActionState(updatePassword, null)

  if (!token || !email) {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        data-testid="reset-password-invalid-link"
      >
        <h1 className="mb-6 text-large-semi uppercase">Enlace no válido</h1>
        <p className="text-base-regular text-ui-fg-base">
          {invalidLinkMessage}
        </p>
        <LocalizedClientLink
          href="/account/forgot-password"
          className="mt-6 underline underline-offset-4"
        >
          Solicitar un nuevo enlace
        </LocalizedClientLink>
      </div>
    )
  }

  if (result?.state === "success") {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        data-testid="reset-password-success"
      >
        <h1 className="mb-6 text-large-semi uppercase">
          Contraseña actualizada
        </h1>
        <p className="text-base-regular text-ui-fg-base">
          Tu contraseña fue actualizada correctamente.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-6 inline-flex min-h-12 items-center justify-center bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
        >
          Iniciar sesión
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="mb-6 text-large-semi uppercase">Crear nueva contraseña</h1>
      <form action={formAction} className="w-full" noValidate>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div className="flex w-full flex-col gap-y-2">
          <Input
            label="Nueva contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirmar nueva contraseña"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage
          error={result?.state === "error" ? result.error : null}
          data-testid="reset-password-error"
        />
        <SubmitButton
          className="mt-6 w-full"
          data-testid="reset-password-submit"
        >
          Actualizar contraseña
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
