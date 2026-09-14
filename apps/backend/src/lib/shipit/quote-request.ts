import { MedusaError } from "@medusajs/framework/utils";

import type { ShipitRateRequest } from "./contracts";
import type { ShipitParcel } from "./parcel";

type ShipitRateRequestBase = {
  parcel: ShipitParcel;
  originCommuneId: number;
  destinationCommuneId: number;
};

export function buildShipitHomeRateRequest(
  input: ShipitRateRequestBase,
): ShipitRateRequest {
  return {
    parcel: {
      length: input.parcel.lengthCm,
      height: input.parcel.heightCm,
      width: input.parcel.widthCm,
      weight: input.parcel.weightKg,
      origin_id: input.originCommuneId,
      destiny_id: input.destinationCommuneId,
      type_of_destiny: "domicilio",
      algorithm: 1,
    },
  };
}

export function buildShipitBranchOfficeRateRequest(
  input: ShipitRateRequestBase & {
    courier: string;
  },
): ShipitRateRequest {
  const courier = input.courier.trim().toLowerCase();

  if (!courier) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Shipit branch-office rate request requires a courier",
    );
  }

  return {
    parcel: {
      length: input.parcel.lengthCm,
      height: input.parcel.heightCm,
      width: input.parcel.widthCm,
      weight: input.parcel.weightKg,
      origin_id: input.originCommuneId,
      destiny_id: input.destinationCommuneId,
      type_of_destiny: "courier_branch_office",
      courier_for_client: courier,
      algorithm: 1,
    },
  };
}
