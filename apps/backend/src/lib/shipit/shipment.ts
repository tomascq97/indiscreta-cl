import { createHash } from "node:crypto";

import type { ShipitConfiguration } from "../env";
import type { ShipitApiClient, ShipitPricesClient } from "./clients";
import { shipitShipmentRequestSchema } from "./contracts";
import { ShipitError } from "./errors";

type ShipmentData = {
  courier?: unknown;
  destination_commune_id?: unknown;
  destination_commune_name?: unknown;
  parcel?: unknown;
};

function requiredString(value: unknown, field: string) {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new ShipitError(
    "INVALID_RESPONSE",
    `Missing ${field} for Shipit shipment`,
  );
}

export function createShipitReference(orderId: string) {
  return `I${createHash("sha256").update(orderId).digest("hex").slice(0, 14)}`;
}

export function splitStreetAndNumber(address: string) {
  const match = address.trim().match(/^(.*?)\s+([0-9]+(?:[-A-Za-z0-9]*)?)$/);
  if (!match?.[1] || !match[2]) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Shipping address must end with a street number",
    );
  }
  return { street: match[1].trim(), number: match[2] };
}

export async function createIdempotentShipitShipment(input: {
  api: Pick<ShipitApiClient, "shipmentByReference" | "createShipment">;
  prices: Pick<ShipitPricesClient, "couriers">;
  configuration: ShipitConfiguration;
  data: ShipmentData;
  order: {
    id?: string;
    email?: string;
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      address_1?: string;
      address_2?: string;
      phone?: string;
    };
  };
}) {
  const orderId = requiredString(input.order.id, "order ID");
  const reference = createShipitReference(orderId);

  try {
    return await input.api.shipmentByReference(reference);
  } catch {
    // A missing shipment is expected before its first creation.
  }

  const address = input.order.shipping_address;
  const fullName = [address?.first_name, address?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const { street, number } = splitStreetAndNumber(
    requiredString(address?.address_1, "shipping address"),
  );
  const courierName = requiredString(input.data.courier, "courier");
  const couriers = await input.prices.couriers();
  const courier = couriers.find(
    (candidate) =>
      candidate.available_to_ship &&
      candidate.name.localeCompare(courierName, "es", {
        sensitivity: "base",
      }) === 0,
  );
  if (!courier) {
    throw new ShipitError(
      "INVALID_RESPONSE",
      "Quoted Shipit courier is unavailable",
    );
  }

  const parcel = input.data.parcel as Record<string, unknown> | undefined;
  const request = shipitShipmentRequestSchema.parse({
    kind: 0,
    platform: 2,
    reference,
    destiny: {
      street,
      number,
      complement: address?.address_2 || undefined,
      commune_id: input.data.destination_commune_id,
      commune_name: input.data.destination_commune_name,
      full_name: fullName,
      email: input.order.email || undefined,
      phone: address?.phone || undefined,
      kind: "home_delivery",
    },
    sizes: {
      length: parcel?.length_cm,
      width: parcel?.width_cm,
      height: parcel?.height_cm,
      weight: parcel?.weight_kg,
    },
    items: parcel?.items,
    sandbox: input.configuration.sandbox,
    courier: {
      id: courier.id,
      client: courier.name,
      payable: false,
      selected: true,
    },
  });

  try {
    return await input.api.createShipment(request);
  } catch (creationError) {
    try {
      return await input.api.shipmentByReference(reference);
    } catch {
      throw creationError;
    }
  }
}
