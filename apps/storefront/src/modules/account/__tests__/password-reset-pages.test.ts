import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8")

describe("password reset pages", () => {
  it("shows the forgot-password link in login", () => {
    const source = readSource("../components/login/index.tsx")
    expect(source).toContain('href="/account/forgot-password"')
    expect(source).toContain("¿Olvidaste tu contraseña?")
  })

  it("marks both technical pages noindex and disables caching", () => {
    for (const file of [
      "../templates/forgot-password-page.tsx",
      "../templates/reset-password-page.tsx",
    ]) {
      const source = readSource(file)
      expect(source).toContain("index: false")
      expect(source).toContain("follow: false")
      expect(source).toContain("noStore()")
    }
  })

  it("does not persist the reset token in browser storage or cookies", () => {
    const source = readSource("../components/reset-password/index.tsx")
    expect(source).not.toMatch(/localStorage|sessionStorage|document\.cookie/)
    expect(source).toContain('type="hidden" name="token"')
  })
})
