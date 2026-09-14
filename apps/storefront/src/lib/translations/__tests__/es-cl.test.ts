import { describe, expect, it } from "vitest"

import { esCl } from "../es-cl"

describe("es-CL storefront dictionary", () => {
  it("exposes critical domain keys in the configured locale", () => {
    expect(esCl.locale).toBe("es-CL")
    expect(esCl.navigation).toMatchObject({ home: "Inicio", cart: "Carrito" })
    expect(esCl.cart).toMatchObject({ title: "Tu carrito", total: "Total" })
    expect(esCl.checkout).toMatchObject({
      payment: "Pago",
      review: "Revisar pedido",
    })
    expect(esCl.account).toMatchObject({
      signIn: "Iniciar sesión",
      signOut: "Cerrar sesión",
    })
    expect(esCl.orders.datePlaced).toBe("Fecha del pedido")
    expect(esCl.checkout.paymentTestNotice).toBe(
      "Atención: este medio de pago es sólo para pruebas y no debe utilizarse en producción.",
    )
  })

  it("interpolates dynamic order messages without placeholders", () => {
    expect(esCl.orders.confirmation(1042)).toBe("Pedido n.º 1042 confirmado")
    expect(esCl.orders.itemCount(1)).toBe("1 producto")
    expect(esCl.orders.itemCount(3)).toBe("3 productos")
  })

  it("contains no unresolved template placeholders", () => {
    const values: string[] = []
    const collectStrings = (value: unknown) => {
      if (typeof value === "string") values.push(value)
      if (value && typeof value === "object") {
        Object.values(value).forEach(collectStrings)
      }
    }

    collectStrings(esCl)
    expect(values).not.toContainEqual(
      expect.stringMatching(/\{\{|\}\}|%[sd]|__\w+__/),
    )
  })
  it("keeps selected critical customer phrases out of the Spanish dictionary", () => {
    const serialized = JSON.stringify(esCl)
    expect(serialized).not.toMatch(
      /Sign in|Place order|Page not found|Shipping Address/,
    )
  })
})
