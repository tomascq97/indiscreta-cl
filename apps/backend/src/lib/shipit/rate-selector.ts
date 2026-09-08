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

export function selectEligibleShipitRates(input: {
  rates: ShipitRateCandidate[];
  communeId: number;
  destinationKind: string;
}): ShipitRateCandidate[] {
  const eligible = input.rates.filter(
    (rate) => {
      const destiny = rate.destiny
      const destinationMatches = destiny
        ? destiny.available &&
          destiny.commune_id === input.communeId &&
          destiny.type_of_destiny.toLowerCase() ===
            input.destinationKind.toLowerCase()
        : input.destinationKind.toLowerCase() === "domicilio"
      return (
        rate.available_to_shipping &&
        destinationMatches &&
        Number.isSafeInteger(rate.price) &&
        rate.price >= 0
      )
    },
  );
  const unique = new Map<string, ShipitRateCandidate>();
  for (const rate of eligible) {
    const key = [
      rate.original_courier,
      rate.name,
      rate.destiny?.id ?? input.communeId,
      rate.destiny?.courier_branch_office_id ?? "home",
      rate.price,
      rate.days,
    ].join(":");
    if (!unique.has(key)) unique.set(key, rate);
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
  input: Parameters<typeof selectEligibleShipitRates>[0],
) {
  const rates = selectEligibleShipitRates(input);
  if (!rates.length) {
    throw new ShipitError("INVALID_RESPONSE", "No eligible Shipit rates");
  }
  return rates;
}

export function selectCheapestShipitRate(
  input: Parameters<typeof selectEligibleShipitRates>[0],
): ShipitRateCandidate {
  return requireEligibleShipitRates(input)[0];
}
