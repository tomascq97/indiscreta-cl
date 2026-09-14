import { Listbox, Transition } from "@headlessui/react"
import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { Fragment, useMemo } from "react"

import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import Radio from "@modules/common/components/radio"

type AddressSelectProps = {
  addresses: HttpTypes.StoreCustomerAddress[]
  addressInput: HttpTypes.StoreCartAddress | null
  onSelect: (
    address: HttpTypes.StoreCartAddress | undefined,
    email?: string,
  ) => void
}

const AddressSelect = ({
  addresses,
  addressInput,
  onSelect,
}: AddressSelectProps) => {
  const handleSelect = (id: string) => {
    const savedAddress = addresses.find((address) => address.id === id)

    if (savedAddress) {
      onSelect(savedAddress as HttpTypes.StoreCartAddress)
    }
  }

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) => addressInput && compareAddresses(address, addressInput),
      ),
    [addresses, addressInput],
  )

  return (
    <Listbox onChange={handleSelect} value={selectedAddress?.id ?? ""}>
      <div className="relative">
        <Listbox.Button
          className="relative flex min-h-[58px] w-full cursor-default items-center justify-between border border-neutral-300 bg-white px-4 text-left text-sm text-black outline-none transition-colors hover:border-neutral-500 focus:border-[var(--color-rose)]"
          data-testid="shipping-address-select"
        >
          {({ open }) => (
            <>
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {selectedAddress
                    ? `${selectedAddress.first_name || ""} ${
                        selectedAddress.last_name || ""
                      }`.trim()
                    : "Selecciona una dirección de envío"}
                </span>

                {selectedAddress ? (
                  <span className="mt-1 block truncate text-xs text-neutral-500">
                    {selectedAddress.address_1}
                    {selectedAddress.city ? `, ${selectedAddress.city}` : ""}
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-neutral-500">
                    Puedes completar el formulario manualmente.
                  </span>
                )}
              </span>

              <ChevronUpDown
                className={clx(
                  "ml-4 h-5 w-5 shrink-0 transition-transform duration-200",
                  {
                    "rotate-180": open,
                  },
                )}
              />
            </>
          )}
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-30 mt-2 max-h-72 w-full overflow-auto border border-neutral-200 bg-white p-2 shadow-xl focus:outline-none"
            data-testid="shipping-address-options"
          >
            {addresses.map((address) => (
              <Listbox.Option
                key={address.id}
                value={address.id}
                className={({ active }) =>
                  clx(
                    "relative cursor-pointer select-none border p-4 transition-colors",
                    active
                      ? "border-[var(--color-rose)] bg-neutral-50"
                      : "border-transparent",
                  )
                }
                data-testid="shipping-address-option"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <Radio
                      checked={selectedAddress?.id === address.id}
                      data-testid="shipping-address-radio"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-black">
                      {address.first_name} {address.last_name}
                    </p>

                    {address.company ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        {address.company}
                      </p>
                    ) : null}

                    <div className="mt-2 space-y-1 text-sm leading-5 text-neutral-600">
                      <p>
                        {address.address_1}
                        {address.address_2 ? `, ${address.address_2}` : ""}
                      </p>
                      <p>
                        {address.postal_code}
                        {address.city ? `, ${address.city}` : ""}
                      </p>
                      <p>
                        {address.province ? `${address.province}, ` : ""}
                        {address.country_code?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

export default AddressSelect
