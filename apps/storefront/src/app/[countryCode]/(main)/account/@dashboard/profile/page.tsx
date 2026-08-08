import { esCl } from "@lib/translations/es-cl"
import { Metadata } from "next"
import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: esCl.account.profile,
  description: "Consulta y edita tu perfil de Indiscreta.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <header className="border-b border-neutral-200 pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Datos personales
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          {esCl.account.profile}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
          Consulta y actualiza tu nombre, teléfono y dirección de facturación.
          El correo asociado a tu cuenta se muestra como dato de referencia.
        </p>
      </header>

      <div className="mt-7 flex w-full flex-col gap-5">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}
