import ResetPassword from "@modules/account/components/reset-password"
import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"

export const resetPasswordMetadata: Metadata = {
  title: "Crear nueva contraseña",
  description: "Crea una nueva contraseña para tu cuenta de Indiscreta.",
  robots: { index: false, follow: false },
}

type ResetPageProps = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPageProps) {
  noStore()
  const { token = "", email = "" } = await searchParams
  return <ResetPassword token={token} email={email} />
}
