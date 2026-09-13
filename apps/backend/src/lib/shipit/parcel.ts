import { ShipitError } from "./errors";

export const SHIPIT_SINGLE_ITEM_PACKING_POLICY = "single-item-v1";
export const SHIPIT_SANDBOX_PACKING_POLICY = "sandbox-packing-v1";
export const GRAMS_PER_KILOGRAM = 1_000;
export const SHIPIT_SANDBOX_MAX_ITEMS = 6;

export type ShipitPackingPolicy =
  | typeof SHIPIT_SINGLE_ITEM_PACKING_POLICY
  | typeof SHIPIT_SANDBOX_PACKING_POLICY;

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
  contentsKey: string;
  items: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packingPolicy: ShipitPackingPolicy;
};

type ValidatedItem = {
  variantId: string;
  quantity: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

type ShipitPackingOptions = {
  sandbox: boolean;
};

function validateItem(item: ShipitCartItem): ValidatedItem {
  const quantity = item.quantity;
  const variant = item.variant;

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "A cart item has an invalid quantity",
    );
  }

  if (!variant || typeof variant.id !== "string" || !variant.id) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Invalid cart variant identity",
    );
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
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0,
    )
  ) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "A cart variant is missing valid physical data",
    );
  }

  return {
    variantId: variant.id,
    quantity,
    weightGrams: variant.weight as number,
    lengthCm: variant.length as number,
    widthCm: variant.width as number,
    heightCm: variant.height as number,
  };
}

function createContentsKey(items: ValidatedItem[]): string {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  return [...quantities.entries()]
    .sort(([variantA], [variantB]) => variantA.localeCompare(variantB))
    .map(([variantId, quantity]) => `${variantId}:${quantity}`)
    .join("|");
}

function sandboxDimensions(totalItems: number) {
  if (totalItems === 2) {
    return { lengthCm: 30, widthCm: 20, heightCm: 6 };
  }

  if (totalItems <= 4) {
    return { lengthCm: 35, widthCm: 28, heightCm: 10 };
  }

  return { lengthCm: 35, widthCm: 25, heightCm: 15 };
}

export function cartItemsToShipitParcel(
  items: ShipitCartItem[],
  options: ShipitPackingOptions = { sandbox: false },
): ShipitParcel {
  if (items.length === 0) {
    throw new ShipitError(
      "CONFIGURATION_ERROR",
      "Cannot build a Shipit parcel from an empty cart",
    );
  }

  const validated = items.map(validateItem);

  const totalItems = validated.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const totalWeightGrams = validated.reduce(
    (sum, item) => sum + item.weightGrams * item.quantity,
    0,
  );

  const contentsKey = createContentsKey(validated);

  if (totalItems === 1 && validated.length === 1) {
    const item = validated[0];

    return {
      contentsKey,
      items: 1,
      weightKg: item.weightGrams / GRAMS_PER_KILOGRAM,
      lengthCm: item.lengthCm,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      packingPolicy: SHIPIT_SINGLE_ITEM_PACKING_POLICY,
    };
  }

  if (!options.sandbox) {
    throw new ShipitError(
      "CONFIGURATION_ERROR",
      "Multi-item Shipit packing requires an approved production packing policy",
    );
  }

  if (totalItems > SHIPIT_SANDBOX_MAX_ITEMS) {
    throw new ShipitError(
      "CONFIGURATION_ERROR",
      `The sandbox Shipit packing policy supports at most ${SHIPIT_SANDBOX_MAX_ITEMS} physical units`,
    );
  }

  const dimensions = sandboxDimensions(totalItems);

  return {
    contentsKey,
    items: totalItems,
    weightKg: totalWeightGrams / GRAMS_PER_KILOGRAM,
    ...dimensions,
    packingPolicy: SHIPIT_SANDBOX_PACKING_POLICY,
  };
}
