import type { HttpTypes } from "@medusajs/types"
import { describe, expect, it } from "vitest"

import {
  getCheckoutAddressPayload,
  getCheckoutStep,
  isOrderReady,
  isPaidByGiftCard,
  isPaymentReady,
  isReviewReady,
} from "../checkout-rules"

type CheckoutCart = Parameters<typeof getCheckoutStep>[0]

const shippingAddress = {
  first_name: "Ada",
  last_name: "Lovelace",
  address_1: "1 Analytical Engine Way",
  city: "London",
  country_code: "gb",
  postal_code: "N1",
}

const billingAddress = {
  ...shippingAddress,
  address_1: "2 Billing Street",
}

const pendingPaymentCollection = {
  payment_sessions: [{ status: "pending", provider_id: "provider" }],
} as HttpTypes.StorePaymentCollection

const completeCart = (): CheckoutCart => ({
  shipping_address: shippingAddress,
  billing_address: billingAddress,
  email: "ada@example.com",
  shipping_methods: [{ id: "shipping-method" }],
  payment_collection: pendingPaymentCollection,
  total: 100,
})

const appendAddress = (
  formData: FormData,
  prefix: "shipping" | "billing",
  address: typeof shippingAddress,
) => {
  Object.entries(address).forEach(([field, value]) => {
    formData.set(`${prefix}_address.${field}`, value)
  })
}

describe("checkout address payload", () => {
  it("maps shipping and separate billing fields", () => {
    const formData = new FormData()
    appendAddress(formData, "shipping", shippingAddress)
    appendAddress(formData, "billing", billingAddress)
    formData.set("email", "ada@example.com")

    const payload = getCheckoutAddressPayload(formData)

    expect(payload.shipping_address).toMatchObject(shippingAddress)
    expect(payload.billing_address).toMatchObject(billingAddress)
    expect(payload.email).toBe("ada@example.com")
  })

  it("replicates shipping when billing is the same", () => {
    const formData = new FormData()
    appendAddress(formData, "shipping", shippingAddress)
    formData.set("same_as_billing", "on")

    const payload = getCheckoutAddressPayload(formData)

    expect(payload.billing_address).toEqual(payload.shipping_address)
  })

  it("uses empty strings for absent values", () => {
    const payload = getCheckoutAddressPayload(new FormData())

    expect(payload.email).toBe("")
    expect(payload.shipping_address).toMatchObject({ first_name: "" })
    expect(payload.billing_address).toMatchObject({ country_code: "" })
  })

  it("does not convert non-string form values to text", () => {
    const formData = new FormData()
    formData.set("shipping_address.first_name", new Blob(["not a name"]))
    formData.set("email", new Blob(["not an email"]))

    const payload = getCheckoutAddressPayload(formData)

    expect(payload.shipping_address).toMatchObject({ first_name: "" })
    expect(payload.email).toBe("")
  })
})

describe("checkout step", () => {
  it("requires an address when the address is incomplete", () => {
    expect(getCheckoutStep({ ...completeCart(), shipping_address: {} })).toBe(
      "address",
    )
  })

  it("requires an address when email is absent", () => {
    expect(getCheckoutStep({ ...completeCart(), email: undefined })).toBe(
      "address",
    )
  })

  it("requires delivery when no shipping method is selected", () => {
    expect(getCheckoutStep({ ...completeCart(), shipping_methods: [] })).toBe(
      "delivery",
    )
  })

  it("requires payment when no pending payment session exists", () => {
    expect(
      getCheckoutStep({ ...completeCart(), payment_collection: undefined }),
    ).toBe("payment")
  })

  it("opens review when a payment session is pending", () => {
    expect(getCheckoutStep(completeCart())).toBe("review")
  })

  it("opens review when gift cards cover the total", () => {
    expect(
      getCheckoutStep({
        ...completeCart(),
        payment_collection: undefined,
        gift_cards: [{}],
        total: 0,
      }),
    ).toBe("review")
  })
})

describe("payment and review readiness", () => {
  it("recognizes a cart ready for payment summary and review", () => {
    const cart = completeCart()

    expect(isPaymentReady(cart)).toBe(true)
    expect(isReviewReady(cart)).toBe(true)
    expect(isOrderReady(cart)).toBe(true)
  })

  it("rejects review without a shipping address", () => {
    expect(
      isReviewReady({ ...completeCart(), shipping_address: undefined }),
    ).toBe(false)
  })

  it("rejects review without a shipping method", () => {
    expect(
      isReviewReady({ ...completeCart(), shipping_methods: undefined }),
    ).toBe(false)
  })

  it("rejects payment and order without a pending payment session", () => {
    const cart = { ...completeCart(), payment_collection: undefined }

    expect(isPaymentReady(cart)).toBe(false)
    expect(isOrderReady(cart)).toBe(false)
  })

  it("does not treat an empty gift card collection as payment", () => {
    const cart = {
      ...completeCart(),
      payment_collection: undefined,
      gift_cards: [],
      total: 0,
    }

    expect(isPaidByGiftCard(cart)).toBe(false)
    expect(isReviewReady(cart)).toBe(false)
  })

  it("accepts a fully gift-card-covered cart without a payment session", () => {
    const cart = {
      ...completeCart(),
      payment_collection: undefined,
      gift_cards: [{}],
      total: 0,
    }

    expect(isOrderReady(cart)).toBe(true)
  })

  it("rejects order placement without billing address or email", () => {
    expect(
      isOrderReady({ ...completeCart(), billing_address: undefined }),
    ).toBe(false)
    expect(isOrderReady({ ...completeCart(), email: undefined })).toBe(false)
  })
})
