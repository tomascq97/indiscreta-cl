import { beforeEach, describe, expect, it, vi } from "vitest"

const { resetPassword, updateProvider } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
  updateProvider: vi.fn(),
}))

vi.mock("@lib/config", () => ({
  sdk: {
    auth: { resetPassword, updateProvider },
  },
}))

vi.mock("@lib/util/medusa-error", () => ({ default: vi.fn() }))

vi.mock("../cookies", () => ({
  getAuthHeaders: vi.fn(),
  getCacheOptions: vi.fn(),
  getCacheTag: vi.fn(),
  getCartId: vi.fn(),
  getPendingCustomer: vi.fn(),
  removeAuthToken: vi.fn(),
  removeCartId: vi.fn(),
  removePendingCustomer: vi.fn(),
  setAuthToken: vi.fn(),
  setPendingCustomer: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { requestPasswordReset, updatePassword } from "../customer"

const formData = (entries: Record<string, string>) => {
  const data = new FormData()
  Object.entries(entries).forEach(([key, value]) => data.set(key, value))
  return data
}

describe("password reset actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetPassword.mockResolvedValue(undefined)
    updateProvider.mockResolvedValue(undefined)
  })

  it("rejects an invalid email without calling Medusa", async () => {
    await expect(
      requestPasswordReset(null, formData({ email: "incorrecto" })),
    ).resolves.toEqual({
      state: "error",
      error: "Ingresa un correo electrónico válido.",
    })
    expect(resetPassword).not.toHaveBeenCalled()
  })

  it("requests a customer emailpass reset with a normalized email", async () => {
    await expect(
      requestPasswordReset(null, formData({ email: " Cliente@Example.COM " })),
    ).resolves.toEqual({ state: "success" })
    expect(resetPassword).toHaveBeenCalledWith("customer", "emailpass", {
      identifier: "cliente@example.com",
    })
  })

  it("returns the same neutral result if Medusa rejects the request", async () => {
    resetPassword.mockRejectedValueOnce(new Error("identity unavailable"))
    await expect(
      requestPasswordReset(null, formData({ email: "nadie@example.com" })),
    ).resolves.toEqual({ state: "success" })
  })

  it("rejects a missing token and mismatched passwords", async () => {
    const missingToken = await updatePassword(
      null,
      formData({
        email: "cliente@example.com",
        password: "nueva",
        password_confirmation: "nueva",
      }),
    )
    expect(missingToken).toEqual({
      state: "error",
      error: "Este enlace no es válido o ha expirado. Solicita uno nuevo.",
    })

    const mismatch = await updatePassword(
      null,
      formData({
        token: "reset-token",
        email: "cliente@example.com",
        password: "nueva",
        password_confirmation: "otra",
      }),
    )
    expect(mismatch).toEqual({
      state: "error",
      error: "Las contraseñas no coinciden.",
    })
    expect(updateProvider).not.toHaveBeenCalled()
  })

  it("passes the token separately to updateProvider and reports success", async () => {
    await expect(
      updatePassword(
        null,
        formData({
          token: "reset-token",
          email: "cliente@example.com",
          password: "nueva",
          password_confirmation: "nueva",
        }),
      ),
    ).resolves.toEqual({ state: "success" })
    expect(updateProvider).toHaveBeenCalledWith(
      "customer",
      "emailpass",
      { email: "cliente@example.com", password: "nueva" },
      "reset-token",
    )
  })

  it("sanitizes invalid or expired token errors", async () => {
    updateProvider.mockRejectedValueOnce(new Error("technical token details"))
    const result = await updatePassword(
      null,
      formData({
        token: "expired",
        email: "cliente@example.com",
        password: "nueva",
        password_confirmation: "nueva",
      }),
    )
    expect(result).toEqual({
      state: "error",
      error: "Este enlace no es válido o ha expirado. Solicita uno nuevo.",
    })
    expect(JSON.stringify(result)).not.toContain("technical token details")
  })
})
