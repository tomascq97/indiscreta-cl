import { esCl } from "@lib/translations/es-cl"
import { HttpTypes } from "@medusajs/types"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((country) => country.iso_2),
    [cart?.region],
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (address) =>
          address.country_code &&
          countriesInRegion?.includes(address.country_code),
      ),
    [customer?.addresses, countriesInRegion],
  )

  const setFormAddress = useCallback(
    (address?: HttpTypes.StoreCartAddress, email?: string) => {
      if (address) {
        setFormData((previousState) => ({
          ...previousState,
          "shipping_address.first_name": address.first_name || "",
          "shipping_address.last_name": address.last_name || "",
          "shipping_address.address_1": address.address_1 || "",
          "shipping_address.company": address.company || "",
          "shipping_address.postal_code": address.postal_code || "",
          "shipping_address.city": address.city || "",
          "shipping_address.country_code": address.country_code || "",
          "shipping_address.province": address.province || "",
          "shipping_address.phone": address.phone || "",
        }))
      }

      if (email) {
        setFormData((previousState) => ({
          ...previousState,
          email,
        }))
      }
    },
    [],
  )

  useEffect(() => {
    if (cart?.shipping_address) {
      setFormAddress(cart.shipping_address, cart.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart, customer?.email, setFormAddress])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  return (
    <div className="space-y-9">
      {customer && (addressesInRegion?.length || 0) > 0 ? (
        <section className="border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Direcciones guardadas
          </p>

          <h3 className="mt-2 text-lg font-semibold text-black">
            Usa una dirección anterior
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Hola {customer.first_name || ""}, selecciona una dirección guardada
            o completa los datos manualmente.
          </p>

          <div className="mt-5">
            <AddressSelect
              addresses={addressesInRegion ?? []}
              addressInput={
                mapKeys(formData, (_, key) =>
                  key.replace("shipping_address.", ""),
                ) as unknown as HttpTypes.StoreCartAddress
              }
              onSelect={setFormAddress}
            />
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Datos personales
          </p>
          <h3 className="mt-2 text-xl font-semibold text-black">
            ¿Quién recibirá el pedido?
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            name="shipping_address.first_name"
            autoComplete="given-name"
            value={formData["shipping_address.first_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-first-name-input"
          />

          <Input
            label="Apellido"
            name="shipping_address.last_name"
            autoComplete="family-name"
            value={formData["shipping_address.last_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-last-name-input"
          />
        </div>
      </section>

      <section className="border-t border-neutral-200 pt-8">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Dirección
          </p>
          <h3 className="mt-2 text-xl font-semibold text-black">
            ¿Dónde enviaremos tu compra?
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Dirección"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />

          <Input
            label="Empresa o departamento"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="shipping-company-input"
          />

          <Input
            label="Código postal"
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-postal-code-input"
          />

          <Input
            label="Comuna"
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            data-testid="shipping-city-input"
          />

          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            placeholder="País"
            required
            data-testid="shipping-country-select"
          />

          <Input
            label="Región"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
        </div>
      </section>

      <section className="border-t border-neutral-200 pt-8">
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-rose)]">
            Contacto
          </p>
          <h3 className="mt-2 text-xl font-semibold text-black">
            Datos para informarte sobre el pedido
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={esCl.account.email}
            name="email"
            type="email"
            title={esCl.errors.invalidEmail}
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            data-testid="shipping-email-input"
          />

          <Input
            label="Teléfono"
            name="shipping_address.phone"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            data-testid="shipping-phone-input"
          />
        </div>
      </section>

      <div className="border-t border-neutral-200 pt-6">
        <Checkbox
          label="Usar esta misma dirección para facturación"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
    </div>
  )
}

export default ShippingAddress
