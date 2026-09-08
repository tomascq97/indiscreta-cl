import { ShipitError } from "./errors";

export const SHIPIT_PACKING_POLICY = "single-item-v1";
export const GRAMS_PER_KILOGRAM = 1_000;

export type ShipitCartItem = {
  quantity: unknown;
  variant?: {
    id?: unknown;
    weight?: unknown;
    length?: unknown;
    width?: unknown;
    height?: unknown;
  } | null;
};

export type ShipitParcel = {
  variantId: string;
  items: 1;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packingPolicy: typeof SHIPIT_PACKING_POLICY;
};

export function cartItemsToShipitParcel(items: ShipitCartItem[]): ShipitParcel {
  if (items.length !== 1 || items[0].quantity !== 1) {
    throw new ShipitError(
      "CONFIGURATION_ERROR",
      "The current Shipit packing policy supports one physical unit only",
    );
  }
  const variant = items[0].variant;
  if (!variant || typeof variant.id !== "string" || !variant.id) {
    throw new ShipitError("INVALID_RESPONSE", "Invalid cart variant identity");
  }
  const values = [
    variant.weight,
    variant.length,
    variant.width,
    variant.height,
  ];
  if (
    values.some(
      (value) =>
        typeof value !== "number" || !Number.isFinite(value) || value <= 0,
    )
  ) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "A cart variant is missing valid physical data",
    );
  }
  return {
    variantId: variant.id,
    items: 1,
    weightKg: (variant.weight as number) / GRAMS_PER_KILOGRAM,
    lengthCm: variant.length as number,
    widthCm: variant.width as number,
    heightCm: variant.height as number,
    packingPolicy: SHIPIT_PACKING_POLICY,
  };
}
