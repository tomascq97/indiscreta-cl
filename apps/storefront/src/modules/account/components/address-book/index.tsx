import React from "react"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const addresses = customer.addresses ?? []

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.025em] text-black">
            Direcciones guardadas
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {addresses.length === 1
              ? "Tienes 1 dirección registrada."
              : `Tienes ${addresses.length} direcciones registradas.`}
          </p>
        </div>

        <AddAddress region={region} addresses={addresses} />
      </div>

      {addresses.length ? (
        <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {addresses.map((address) => (
            <EditAddress
              region={region}
              address={address}
              key={address.id}
              isActive={Boolean(address.is_default_shipping)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-black">
            No tienes direcciones guardadas
          </p>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-600">
            Agrega una dirección para completar más rápido tus próximas compras
            y calcular correctamente las opciones de despacho.
          </p>

          <div className="mt-6 flex justify-center">
            <AddAddress
              region={region}
              addresses={addresses}
              variant="primary"
              label="Agregar primera dirección"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressBook
