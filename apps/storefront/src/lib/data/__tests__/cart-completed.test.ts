import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  fetchCart,
  createCart,
  updateCart,
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
  getRegion,
  getLocale,
  revalidateTag,
} = vi.hoisted(() => ({
  fetchCart: vi.fn(),
  createCart: vi.fn(),
  updateCart: vi.fn(),
  getAuthHeaders: vi.fn(),
  getCacheOptions: vi.fn(),
  getCacheTag: vi.fn(),
  getCartId: vi.fn(),
  removeCartId: vi.fn(),
  setCartId: vi.fn(),
  getRegion: vi.fn(),
  getLocale: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: fetchCart,
    },
    store: {
      cart: {
        create: createCart,
        update: updateCart,
      },
    },
  },
}))

vi.mock("@lib/util/medusa-error", () => ({ default: vi.fn() }))
vi.mock("@lib/util/checkout-rules", () => ({ getCheckoutAddressPayload: vi.fn() }))
vi.mock("@lib/util/chilean-rut", () => ({ formatChileanRut: vi.fn(), isValidChileanRut: vi.fn() }))

vi.mock("../cookies", () => ({
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
}))

vi.mock("../regions", () => ({
  getRegion,
}))

vi.mock("../locale-actions", () => ({
  getLocale,
}))

vi.mock("next/cache", () => ({
  revalidateTag,
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

import { getOrSetCart } from "../cart"

describe("getOrSetCart completed cart recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getRegion.mockResolvedValue({ id: "reg_1" })
    getAuthHeaders.mockResolvedValue({})
    getCacheOptions.mockResolvedValue({})
    getCacheTag.mockResolvedValue("carts")
    getCartId.mockResolvedValue("cart_completed")
    getLocale.mockResolvedValue("es-CL")

    fetchCart.mockResolvedValue({
      cart: {
        id: "cart_completed",
        region_id: "reg_1",
        completed_at: "2026-09-14T17:48:25.892Z",
      },
    })

    createCart.mockResolvedValue({
      cart: {
        id: "cart_new",
        region_id: "reg_1",
        completed_at: null,
      },
    })
  })

  it("replaces a completed cart with a new active cart", async () => {
    const cart = await getOrSetCart("cl")

    expect(fetchCart).toHaveBeenCalledOnce()
    expect(removeCartId).toHaveBeenCalledOnce()

    expect(createCart).toHaveBeenCalledWith(
      {
        region_id: "reg_1",
        locale: "es-CL",
      },
      {},
      {},
    )

    expect(setCartId).toHaveBeenCalledWith("cart_new")
    expect(updateCart).not.toHaveBeenCalled()
    expect(cart.id).toBe("cart_new")
  })
})
