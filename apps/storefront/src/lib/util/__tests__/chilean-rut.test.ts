import { describe, expect, it } from "vitest"

import {
  formatChileanRut,
  isValidChileanRut,
  normalizeChileanRut,
} from "../chilean-rut"

describe("Chilean RUT", () => {
  it("normalizes and limits the identifier to eight digits plus verifier", () => {
    expect(normalizeChileanRut("12.345.678-5 extra")).toBe("123456785")
  })

  it("formats a normalized RUT", () => {
    expect(formatChileanRut("123456785")).toBe("12.345.678-5")
  })

  it("validates the modulus 11 verifier including K", () => {
    expect(isValidChileanRut("12.345.678-5")).toBe(true)
    expect(isValidChileanRut("6.155.761-K")).toBe(true)
    expect(isValidChileanRut("12.345.678-9")).toBe(false)
  })
})
