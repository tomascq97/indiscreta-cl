"use client"

import { esCl } from "@lib/translations/es-cl"
import { Plus } from "@medusajs/icons"
import { useActionState, useEffect, useState } from "react"
import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"

const AddAddress = ({
  region,
  variant = "secondary",
  label = "Agregar dirección",
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
  variant?: "primary" | "secondary"
  label?: string
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as {
    success: boolean
    error: string | null
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        type="button"
        className={
          variant === "primary"
            ? "inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--color-rose)] px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-rose-dark)]"
            : "inline-flex min-h-11 items-center justify-center gap-2 border border-black px-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
        }
        onClick={open}
        data-testid="add-address-button"
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
              Datos de envío
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
              Agregar dirección
            </h2>
          </div>
        </Modal.Title>

        <form action={formAction}>
          <Modal.Body>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <Input
                label="Empresa (opcional)"
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />

              <Input
                label="Dirección"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />

              <Input
                label="Departamento, oficina, etc. (opcional)"
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                <Input
                  label="Código postal"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />

                <Input
                  label="Comuna"
                  name="city"
                  required
                  autoComplete="address-level2"
                  data-testid="city-input"
                />
              </div>

              <Input
                label="Región"
                name="province"
                required
                autoComplete="address-level1"
                data-testid="state-input"
              />

              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
              />

              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                data-testid="phone-input"
              />

              {formState.error ? (
                <div
                  className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800"
                  data-testid="address-error"
                >
                  {formState.error}
                </div>
              ) : null}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="reset"
                onClick={close}
                className="inline-flex min-h-11 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-colors hover:bg-black hover:text-white"
                data-testid="cancel-button"
              >
                {esCl.common.cancel}
              </button>

              <div className="[&_button]:min-h-11 [&_button]:bg-[var(--color-rose)] [&_button]:px-6 [&_button]:text-[11px] [&_button]:font-semibold [&_button]:uppercase [&_button]:tracking-[0.1em] [&_button]:text-white hover:[&_button]:bg-[var(--color-rose-dark)]">
                <SubmitButton data-testid="save-button">
                  Guardar dirección
                </SubmitButton>
              </div>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
