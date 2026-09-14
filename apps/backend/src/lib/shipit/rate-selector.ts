import { ShipitError } from "./errors";

export type ShipitRateCandidate = {
  courier: { name: string };
  original_courier: string;
  name: string;
  price: number;
  days: number;
  available_to_shipping: boolean;
  destiny?: {
    id: number;
    type_of_destiny: string;
    available: boolean;
    commune_id: number;
    courier_branch_office_id?: unknown;
  } | null;
};

type ShipitRateSelectionInput = {
  rates: ShipitRateCandidate[];
  communeId: number;
  destinationKind: string;
  courier?: string;
};

function normalizeCourier(value: string): string {
  return value.trim().toLowerCase();
}

export function selectEligibleShipitRates(
  input: ShipitRateSelectionInput,
): ShipitRateCandidate[] {
  const expectedDestinationKind = input.destinationKind.toLowerCase();
  const expectedCourier = input.courier
    ? normalizeCourier(input.courier)
    : null;

  const eligible = input.rates.filter((rate) => {
    const destiny = rate.destiny;

    const courierMatches =
      !expectedCourier ||
      normalizeCourier(rate.original_courier) === expectedCourier ||
      normalizeCourier(rate.courier.name) === expectedCourier;

    const destinationMatches = destiny
      ? destiny.available &&
        destiny.commune_id === input.communeId &&
        destiny.type_of_destiny.toLowerCase() === expectedDestinationKind
      : expectedDestinationKind === "domicilio" ||
        (expectedDestinationKind === "courier_branch_office" &&
          expectedCourier !== null);

    return (
      rate.available_to_shipping &&
      courierMatches &&
      destinationMatches &&
      Number.isSafeInteger(rate.price) &&
      rate.price >= 0
    );
  });

  const unique = new Map<string, ShipitRateCandidate>();

  for (const rate of eligible) {
    const key = [
      rate.original_courier,
      rate.name,
      rate.destiny?.id ?? input.communeId,
      rate.destiny?.courier_branch_office_id ?? "none",
      rate.price,
      rate.days,
    ].join(":");

    if (!unique.has(key)) {
      unique.set(key, rate);
    }
  }

  return [...unique.values()].sort(
    (left, right) =>
      left.price - right.price ||
      left.days - right.days ||
      left.original_courier.localeCompare(right.original_courier) ||
      left.name.localeCompare(right.name),
  );
}

export function requireEligibleShipitRates(
  input: ShipitRateSelectionInput,
) {
  const rates = selectEligibleShipitRates(input);

  if (!rates.length) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "No eligible Shipit rates",
    );
  }

  return rates;
}

export function selectCheapestShipitRate(
  input: ShipitRateSelectionInput,
): ShipitRateCandidate {
  return requireEligibleShipitRates(input)[0];
}
