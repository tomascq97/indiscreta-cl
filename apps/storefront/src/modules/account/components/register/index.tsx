"use client"
import { esCl } from "@lib/translations/es-cl"
import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"
type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}
const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)
  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Únete a Indiscreta</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Crea tu cuenta de Indiscreta y accede a una experiencia de compra
        personalizada, seguimiento de pedidos y direcciones guardadas.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-4 text-center text-base-regular text-ui-fg-base bg-ui-bg-subtle border border-ui-border-base rounded-rounded p-4"
          data-testid="register-verification-message"
        >
          Te enviamos un enlace de verificación a{" "}
          <strong>{message.email}</strong>. Por favor, revisa tu bandeja de
          entrada para verificar tu correo electrónico y luego inicia sesión.
        </div>
      )}
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Nombre"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Apellido"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label={esCl.account.email}
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label={esCl.account.password}
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          Al crear una cuenta, aceptas la{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Política de privacidad
          </LocalizedClientLink>{" "}
          y{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Términos y condiciones
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Unirme
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        ¿Ya eres miembro?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          {esCl.account.signIn}
        </button>
        .
      </span>
    </div>
  )
}
export default Register
