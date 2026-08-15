import { validateClpAmount } from "../validation";

describe("validateClpAmount", () => {
  it("accepts a positive integer CLP amount without scaling", () => {
    expect(validateClpAmount(15990, "clp")).toBe(15990);
  });

  it.each([
    [0, "clp"],
    [-1, "clp"],
    [10.5, "clp"],
    [1000, "usd"],
    [Number.MAX_SAFE_INTEGER + 1, "clp"],
  ])("rejects invalid amount %p and currency %p", (amount, currency) => {
    expect(() => validateClpAmount(amount, currency)).toThrow();
  });
});
