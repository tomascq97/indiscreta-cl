import { ShipitError } from "./errors";

export const CHILE_IVA_RATE_BPS = 1_900;

export function addChileIvaToNetClp(netPrice: number) {
  if (!Number.isSafeInteger(netPrice) || netPrice < 0) {
    throw new ShipitError("INVALID_RESPONSE", "Invalid net Shipit CLP price");
  }
  const taxAmount = Math.round((netPrice * CHILE_IVA_RATE_BPS) / 10_000);
  return {
    netPrice,
    taxAmount,
    grossPrice: netPrice + taxAmount,
    taxRateBps: CHILE_IVA_RATE_BPS,
    taxInclusive: true as const,
  };
}
