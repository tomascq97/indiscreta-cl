import type { ShipitRateRequest } from "./contracts";
import type { ShipitParcel } from "./parcel";

export function buildShipitHomeRateRequest(input: {
  parcel: ShipitParcel;
  originCommuneId: number;
  destinationCommuneId: number;
}): ShipitRateRequest {
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
