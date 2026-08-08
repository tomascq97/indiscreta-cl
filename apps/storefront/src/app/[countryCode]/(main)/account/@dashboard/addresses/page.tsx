import { esCl } from "@lib/translations/es-cl"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import AddressBook from "@modules/account/components/address-book"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: esCl.account.addresses,
  description: "Revisa y administra tus direcciones guardadas.",
}

export default async function Addresses(props: {
  params: Promise<{
    countryCode: string
  }>
}) {
  const params = await props.params
  const { countryCode } = params

  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <header className="border-b border-neutral-200 pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
          Datos de envío
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
          {esCl.account.addresses}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
          Administra las direcciones que utilizarás durante el proceso de
          compra. Puedes agregar, editar o eliminar direcciones cuando lo
          necesites.
        </p>
      </header>

      <div className="mt-7">
        <AddressBook customer={customer} region={region} />
      </div>
    </div>
  )
}
