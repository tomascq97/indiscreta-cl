"use client"

import { requestPasswordReset } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

const ForgotPassword = () => {
  const [result, formAction] = useActionState(requestPasswordReset, null)

  if (result?.state === "success") {
    return (
      <div
        className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        data-testid="forgot-password-success"
      >
        <h1 className="mb-6 text-large-semi uppercase">Revisa tu correo</h1>
        <p className="text-base-regular text-ui-fg-base">
          Si existe una cuenta asociada a este correo, recibirás las
          instrucciones para restablecer tu contraseña.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-6 underline underline-offset-4"
        >
          Volver a iniciar sesión
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="mb-6 text-large-semi uppercase">Recuperar contraseña</h1>
      <p className="mb-8 text-center text-base-regular text-ui-fg-base">
        Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones
        para crear una nueva contraseña.
      </p>
      <form action={formAction} className="w-full" noValidate>
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="forgot-password-email"
        />
        <ErrorMessage
          error={result?.state === "error" ? result.error : null}
          data-testid="forgot-password-error"
        />
        <SubmitButton
          className="mt-6 w-full"
          data-testid="forgot-password-submit"
        >
          Enviar instrucciones
        </SubmitButton>
      </form>
      <LocalizedClientLink
        href="/account"
        className="mt-6 underline underline-offset-4"
      >
        Volver a iniciar sesión
      </LocalizedClientLink>
    </div>
  )
}

export default ForgotPassword
