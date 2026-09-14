import { esCl } from "@lib/translations/es-cl"
import { Metadata } from "next"
import LoginTemplate from "@modules/account/templates/login-template"
export const metadata: Metadata = {
  title: esCl.account.signIn,
  description: "Inicia sesión en tu cuenta de Indiscreta.",
}
export default function Login() {
  return <LoginTemplate />
}
