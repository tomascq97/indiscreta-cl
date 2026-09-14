import { createHash } from "node:crypto";

import { ShipitError } from "./errors";

export type ShipitCommune = {
  id: number;
  name: string;
  is_available?: boolean;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function resolveShipitCommune(
  value: string,
  communes: ShipitCommune[],
): ShipitCommune {
  const expected = normalize(value);
  const matches = communes.filter(
    (commune) =>
      commune.is_available !== false && normalize(commune.name) === expected,
  );
  if (matches.length !== 1) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      matches.length
        ? "Shipit commune is ambiguous"
        : "Shipit commune was not found",
    );
  }
  return matches[0];
}

export function createShipitDestinationContext(address: {
  country_code?: string | null;
  city?: string | null;
  province?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  postal_code?: string | null;
}) {
  const canonical = {
    country_code: normalize(address.country_code ?? ""),
    city: normalize(address.city ?? ""),
    province: normalize(address.province ?? ""),
    address_1: normalize(address.address_1 ?? ""),
    address_2: normalize(address.address_2 ?? ""),
    postal_code: normalize(address.postal_code ?? ""),
  }
  return createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("base64url");
}
