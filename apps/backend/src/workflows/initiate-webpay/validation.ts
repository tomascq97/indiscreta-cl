import { MedusaError } from "@medusajs/framework/utils";

export function validateClpAmount(
  amount: unknown,
  currencyCode: string,
): number {
  if (currencyCode.toLowerCase() !== "clp") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Webpay Plus only supports CLP",
    );
  }

  const numericAmount = Number(amount);

  if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Webpay Plus requires a positive integer CLP amount",
    );
  }

  return numericAmount;
}
