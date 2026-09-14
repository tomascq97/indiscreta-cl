import type { ShipitParcel } from "../parcel";
import {
  buildShipitBranchOfficeRateRequest,
  buildShipitHomeRateRequest,
} from "../quote-request";

const parcel: ShipitParcel = {
  contentsKey: "variant_test:1",
  items: 1,
  packingPolicy: "single-item-v1",
  weightKg: 0.5,
  lengthCm: 20,
  widthCm: 15,
  heightCm: 5,
};

describe("Shipit rate request builders", () => {
  it("builds a home-delivery rate request", () => {
    expect(
      buildShipitHomeRateRequest({
        parcel,
        originCommuneId: 131,
        destinationCommuneId: 146,
      }),
    ).toEqual({
      parcel: {
        length: 20,
        height: 5,
        width: 15,
        weight: 0.5,
        origin_id: 131,
        destiny_id: 146,
        type_of_destiny: "domicilio",
        algorithm: 1,
      },
    });
  });

  it("builds a branch-office rate request for a selected courier", () => {
    expect(
      buildShipitBranchOfficeRateRequest({
        parcel,
        originCommuneId: 131,
        destinationCommuneId: 146,
        courier: "chilexpress",
      }),
    ).toEqual({
      parcel: {
        length: 20,
        height: 5,
        width: 15,
        weight: 0.5,
        origin_id: 131,
        destiny_id: 146,
        type_of_destiny: "courier_branch_office",
        courier_for_client: "chilexpress",
        algorithm: 1,
      },
    });
  });

  it("normalizes the selected courier", () => {
    const request = buildShipitBranchOfficeRateRequest({
      parcel,
      originCommuneId: 131,
      destinationCommuneId: 146,
      courier: "  Chilexpress  ",
    });

    expect(request.parcel.courier_for_client).toBe("chilexpress");
  });

  it("rejects an empty courier for branch-office rates", () => {
    expect(() =>
      buildShipitBranchOfficeRateRequest({
        parcel,
        originCommuneId: 131,
        destinationCommuneId: 146,
        courier: "   ",
      }),
    ).toThrow(
      "Shipit branch-office rate request requires a courier",
    );
  });
});
