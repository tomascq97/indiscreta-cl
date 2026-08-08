"use client"

import { esCl } from "@lib/translations/es-cl"
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import React, { useActionState, useEffect, useState } from "react"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
  } as {
    success: boolean
    error: string | null
    addressId: string
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

  const removeAddress = async () => {
    setRemoving(true)
    setDeleteError(null)

    try {
      await deleteCustomerAddress(address.id)
      setConfirmingDelete(false)
    } catch (error) {
      setDeleteError(String(error))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <article
        className="flex min-h-[280px] w-full flex-col justify-between border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400"
        data-testid="address-container"
      >
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Dirección de despacho
              </p>

              <h3
                className="mt-2 text-lg font-bold tracking-[-0.02em] text-black"
                data-testid="address-name"
              >
                {address.first_name} {address.last_name}
              </h3>
            </div>

            {isActive ? (
              <span className="bg-[var(--color-rose)] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                Principal
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-1 text-sm leading-6 text-neutral-600">
            {address.company ? (
              <span data-testid="address-company">{address.company}</span>
            ) : null}

            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 ? `, ${address.address_2}` : ""}
            </span>

            <span data-testid="address-postal-city">
              {[address.postal_code, address.city].filter(Boolean).join(", ")}
            </span>

            <span data-testid="address-province-country">
              {[address.province, address.country_code?.toUpperCase()]
                .filter(Boolean)
                .join(", ")}
            </span>

            {address.phone ? <span>{address.phone}</span> : null}
          </div>
        </div>

        <div className="mt-8">
          {confirmingDelete ? (
            <div className="border-l-4 border-red-600 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                ¿Eliminar esta dirección?
              </p>

              <p className="mt-1 text-xs leading-5 text-red-800">
                Esta acción no puede deshacerse.
              </p>

              {deleteError ? (
                <p className="mt-2 text-xs text-red-700">{deleteError}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={removing}
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={removeAddress}
                  disabled={removing}
                  className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-700 disabled:opacity-50"
                  data-testid="confirm-address-delete-button"
                >
                  {removing ? <Spinner /> : null}
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-5 border-t border-neutral-200 pt-5">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:text-[var(--color-rose-dark)]"
                onClick={open}
                data-testid="address-edit-button"
              >
                <Edit className="h-4 w-4" />
                {esCl.common.edit}
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 transition-colors hover:text-red-700"
                onClick={() => setConfirmingDelete(true)}
                data-testid="address-delete-button"
              >
                <Trash className="h-4 w-4" />
                {esCl.common.remove}
              </button>
            </div>
          )}
        </div>
      </article>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
              Datos de envío
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-black">
              Editar dirección
            </h2>
          </div>
        </Modal.Title>

        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />

          <Modal.Body>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || undefined}
                  data-testid="first-name-input"
                />

                <Input
                  label="Apellido"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || undefined}
                  data-testid="last-name-input"
                />
              </div>

              <Input
                label="Empresa (opcional)"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />

              <Input
                label="Dirección"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address_1 || undefined}
                data-testid="address-1-input"
              />

              <Input
                label="Departamento, oficina, etc. (opcional)"
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || undefined}
                data-testid="address-2-input"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                <Input
                  label="Código postal"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address.postal_code || undefined}
                  data-testid="postal-code-input"
                />

                <Input
                  label="Comuna"
                  name="city"
                  required
                  autoComplete="address-level2"
                  defaultValue={address.city || undefined}
                  data-testid="city-input"
                />
              </div>

              <Input
                label="Región"
                name="province"
                required
                autoComplete="address-level1"
                defaultValue={address.province || undefined}
                data-testid="state-input"
              />

              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address.country_code || undefined}
                data-testid="country-select"
              />

              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                defaultValue={address.phone || undefined}
                data-testid="phone-input"
              />

              {formState.error ? (
                <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
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
                  Guardar cambios
                </SubmitButton>
              </div>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
