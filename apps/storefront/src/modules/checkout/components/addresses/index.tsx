"use client"

import { esCl } from "@lib/translations/es-cl"
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart.shipping_address, cart.billing_address)
      : true,
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <section className="bg-white p-5 sm:p-7 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-5 border-b border-neutral-200 pb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-rose)]">
            Paso 01
          </p>

          <h2 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-[-0.03em] text-black sm:text-3xl">
            {esCl.checkout.shippingAddress}
            {!isOpen ? (
              <CheckCircleSolid className="h-5 w-5 text-[var(--color-rose)]" />
            ) : null}
          </h2>

          {isOpen ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
              Ingresa los datos necesarios para coordinar correctamente la
              entrega de tu pedido.
            </p>
          ) : null}
        </div>

        {!isOpen && cart?.shipping_address ? (
          <button
            type="button"
            onClick={handleEdit}
            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-[var(--color-rose-dark)]"
            data-testid="edit-address-button"
          >
            {esCl.common.edit}
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <form action={formAction}>
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
          />

          {!sameAsBilling ? <BillingAddress cart={cart} /> : null}

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <SubmitButton
              className="min-h-[52px] w-full bg-black px-8 text-[11px] font-semibold uppercase tracking-[0.12em] !text-white transition-colors hover:bg-[var(--color-rose-dark)] sm:w-auto"
              data-testid="submit-address-button"
            >
              Continuar al despacho →
            </SubmitButton>

            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          {cart?.shipping_address ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div
                className="border border-neutral-200 bg-neutral-50 p-5"
                data-testid="shipping-address-summary"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-rose)]">
                  Despacho
                </p>
                <p className="mt-3 font-semibold text-black">
                  {cart.shipping_address.first_name}{" "}
                  {cart.shipping_address.last_name}
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {cart.shipping_address.address_1}{" "}
                  {cart.shipping_address.address_2}
                  <br />
                  {cart.shipping_address.postal_code},{" "}
                  {cart.shipping_address.city}
                  <br />
                  {cart.shipping_address.country_code?.toUpperCase()}
                </p>
              </div>

              <div
                className="border border-neutral-200 bg-neutral-50 p-5"
                data-testid="shipping-contact-summary"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-rose)]">
                  Contacto
                </p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {cart.shipping_address.phone || "Teléfono no registrado"}
                  <br />
                  {cart.email}
                </p>
              </div>

              <div
                className="border border-neutral-200 bg-neutral-50 p-5"
                data-testid="billing-address-summary"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-rose)]">
                  Facturación
                </p>

                {sameAsBilling ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    La dirección de facturación es la misma que la dirección de
                    despacho.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {cart.billing_address?.first_name}{" "}
                    {cart.billing_address?.last_name}
                    <br />
                    {cart.billing_address?.address_1}{" "}
                    {cart.billing_address?.address_2}
                    <br />
                    {cart.billing_address?.postal_code},{" "}
                    {cart.billing_address?.city}
                    <br />
                    {cart.billing_address?.country_code?.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default Addresses
