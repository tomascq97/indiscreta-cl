import ForgotPassword from "@modules/account/components/forgot-password"
import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"

export const passwordRecoveryMetadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita instrucciones para recuperar tu cuenta de Indiscreta.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  noStore()
  return <ForgotPassword />
}
