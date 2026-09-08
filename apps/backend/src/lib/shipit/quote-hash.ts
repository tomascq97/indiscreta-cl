import { createHash } from "node:crypto";

export type ShipitQuoteHashInput = {
  cartId: string;
  variantId: string;
  quantity: number;
  packingPolicy: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  originCommuneId: number;
  destinationCommuneId: number;
  destinationKind: string;
  destinationContext: string;
  courier: string;
  service: string;
  shipitDestinyId: number;
  branchOfficeId?: number | null;
  price: number;
  days: number;
  contractVersion: string;
};

function normalize(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function createShipitQuoteHash(input: ShipitQuoteHashInput): string {
  const canonical = {
    ...input,
    cartId: normalize(input.cartId),
    variantId: normalize(input.variantId),
    destinationKind: normalize(input.destinationKind),
    destinationContext: normalize(input.destinationContext),
    courier: normalize(input.courier),
    service: normalize(input.service),
    branchOfficeId: input.branchOfficeId ?? null,
  };
  return createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("base64url");
}
