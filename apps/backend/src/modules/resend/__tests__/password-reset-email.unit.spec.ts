import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("password reset email", () => {
  it("renders the Indiscreta reset call to action and supplied URL", () => {
    const source = readFileSync(
      join(__dirname, "..", "emails", "password-reset.tsx"),
      "utf8",
    );

    expect(source).toContain("INDISCRETA");
    expect(source).toContain("RESTABLECER CONTRASEÑA");
    expect(source).toContain("duración limitada");
    expect(source).toContain("Si no solicitaste este cambio");
    expect(source).toContain("reset_url");
  });
});
