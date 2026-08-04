import type { HttpTypes } from "@medusajs/types"

type CheckoutCart = {
  billing_address?: unknown
  email?: string | null
  payment_collection?: {
    payment_sessions?: { status?: string | null }[] | null
  } | null
  shipping_address?: { address_1?: string | null } | null
  shipping_methods?: unknown[] | null
  total?: number | null
  gift_cards?: unknown[] | null
}

export type CheckoutStep = "address" | "delivery" | "payment" | "review"

const addressFields = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
] as const

const getString = (formData: FormData, key: string) => {
  const value = formData.get(key)

  return typeof value === "string" ? value : ""
}

const getAddress = (formData: FormData, prefix: "shipping" | "billing") => {
  const address = Object.fromEntries(
    addressFields.map((field) => [
      field,
      getString(formData, `${prefix}_address.${field}`),
    ]),
  )

  return {
    ...address,
    address_2: "",
  }
}

export const getCheckoutAddressPayload = (
  formData: FormData,
): HttpTypes.StoreUpdateCart => {
  const shippingAddress = getAddress(formData, "shipping")
  const sameAsBilling = formData.get("same_as_billing") === "on"

  return {
    shipping_address: shippingAddress,
    billing_address: sameAsBilling
      ? shippingAddress
      : getAddress(formData, "billing"),
    email: getString(formData, "email"),
  }
}

export const isPaidByGiftCard = (cart: CheckoutCart) =>
  Boolean(cart.gift_cards?.length && cart.total === 0)

export const hasPendingPaymentSession = (cart: CheckoutCart) =>
  Boolean(
    cart.payment_collection?.payment_sessions?.some(
      (session) => session.status === "pending",
    ),
  )

export const isPaymentReady = (cart: CheckoutCart) =>
  Boolean(
    (hasPendingPaymentSession(cart) && cart.shipping_methods?.length) ||
    isPaidByGiftCard(cart),
  )

export const isReviewReady = (cart: CheckoutCart) =>
  Boolean(
    cart.shipping_address &&
    cart.shipping_methods?.length &&
    (hasPendingPaymentSession(cart) || isPaidByGiftCard(cart)),
  )

export const isOrderReady = (cart: CheckoutCart) =>
  Boolean(
    cart.shipping_address &&
    cart.billing_address &&
    cart.email &&
    cart.shipping_methods?.length &&
    (hasPendingPaymentSession(cart) || isPaidByGiftCard(cart)),
  )

export const getCheckoutStep = (cart: CheckoutCart): CheckoutStep => {
  if (!cart.shipping_address?.address_1 || !cart.email) {
    return "address"
  }

  if (!cart.shipping_methods?.length) {
    return "delivery"
  }

  if (hasPendingPaymentSession(cart) || isPaidByGiftCard(cart)) {
    return "review"
  }

  return "payment"
}
