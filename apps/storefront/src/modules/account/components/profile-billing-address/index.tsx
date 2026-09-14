"use client"

import { esCl } from "@lib/translations/es-cl"
import React, { useActionState, useEffect, useMemo } from "react"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { addCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import AccountInfo from "../account-info"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({
  customer,
  regions,
}) => {
  const regionOptions = useMemo(() => {
    return (
      regions
        ?.flatMap(
          (region) =>
            region.countries?.map((country) => ({
              value: country.iso_2,
              label: country.display_name,
            })) ?? [],
        )
        .filter(Boolean) || []
    )
  }, [regions])

  const [successState, setSuccessState] = React.useState(false)

  const billingAddress = customer.addresses?.find(
    (address) => address.is_default_billing,
  )

  const initialState: Record<string, unknown> = {
    isDefaultBilling: true,
    isDefaultShipping: false,
    error: false,
    success: false,
    ...(billingAddress ? { addressId: billingAddress.id } : {}),
  }

  const [state, formAction] = useActionState(
    billingAddress ? updateCustomerAddress : addCustomerAddress,
    initialState,
  )

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(Boolean(state.success))
  }, [state])

  const currentInfo = useMemo(() => {
    if (!billingAddress) {
      return "No registrada"
    }

    const country =
      regionOptions.find(
        (option) => option?.value === billingAddress.country_code,
      )?.label || billingAddress.country_code?.toUpperCase()

    return (
      <div
        className="flex flex-col gap-0.5 font-medium"
        data-testid="current-info"
      >
        <span>
          {billingAddress.first_name} {billingAddress.last_name}
        </span>
        {billingAddress.company ? <span>{billingAddress.company}</span> : null}
        <span>
          {billingAddress.address_1}
          {billingAddress.address_2 ? `, ${billingAddress.address_2}` : ""}
        </span>
        <span>
          {[billingAddress.postal_code, billingAddress.city]
            .filter(Boolean)
            .join(", ")}
        </span>
        {billingAddress.province ? (
          <span>{billingAddress.province}</span>
        ) : null}
        <span>{country}</span>
      </div>
    )
  }, [billingAddress, regionOptions])

  return (
    <form action={formAction} onReset={clearState} className="w-full">
      <input type="hidden" name="addressId" value={billingAddress?.id} />

      <AccountInfo
        label={esCl.checkout.billingAddress}
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={Boolean(state.error)}
        errorMessage={typeof state.error === "string" ? state.error : undefined}
        clearState={clearState}
        helperText="Esta dirección puede utilizarse para documentos de compra y facturación."
        data-testid="account-billing-address-editor"
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              name="first_name"
              defaultValue={billingAddress?.first_name || undefined}
              required
              data-testid="billing-first-name-input"
            />
            <Input
              label="Apellido"
              name="last_name"
              defaultValue={billingAddress?.last_name || undefined}
              required
              data-testid="billing-last-name-input"
            />
          </div>

          <Input
            label="Empresa (opcional)"
            name="company"
            defaultValue={billingAddress?.company || undefined}
            data-testid="billing-company-input"
          />

          <Input
            label="Teléfono"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={billingAddress?.phone ?? customer.phone ?? ""}
            data-testid="billing-phone-input"
          />

          <Input
            label="Dirección"
            name="address_1"
            defaultValue={billingAddress?.address_1 || undefined}
            required
            data-testid="billing-address-1-input"
          />

          <Input
            label="Departamento, oficina, etc. (opcional)"
            name="address_2"
            defaultValue={billingAddress?.address_2 || undefined}
            data-testid="billing-address-2-input"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <Input
              label="Código postal"
              name="postal_code"
              defaultValue={billingAddress?.postal_code || undefined}
              required
              data-testid="billing-postcal-code-input"
            />
            <Input
              label="Comuna"
              name="city"
              defaultValue={billingAddress?.city || undefined}
              required
              data-testid="billing-city-input"
            />
          </div>

          <Input
            label="Región"
            name="province"
            defaultValue={billingAddress?.province || undefined}
            required
            data-testid="billing-province-input"
          />

          <label className="text-sm font-medium text-black">
            País
            <NativeSelect
              name="country_code"
              defaultValue={billingAddress?.country_code || "cl"}
              required
              data-testid="billing-country-code-select"
            >
              <option value="">Selecciona un país</option>
              {regionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
