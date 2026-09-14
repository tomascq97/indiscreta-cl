import {
  createShipitDestinationContext,
  resolveShipitCommune,
} from "../location";
import { cartItemsToShipitParcel } from "../parcel";
import { buildShipitHomeRateRequest } from "../quote-request";

describe("Shipit checkout location", () => {
  it("resolves one available commune accent-insensitively", () => {
    expect(
      resolveShipitCommune("  Ñuñoa ", [
        { id: 1, name: "NUNOA", is_available: true },
      ]).id,
    ).toBe(1);
  });

  it("fails closed for unavailable or ambiguous communes", () => {
    expect(() =>
      resolveShipitCommune("Santiago", [
        { id: 1, name: "Santiago", is_available: true },
        { id: 2, name: "Santiago", is_available: true },
      ]),
    ).toThrow("ambiguous");
  });

  it("hashes address context without persisting its plaintext", () => {
    const first = createShipitDestinationContext({
      country_code: "cl",
      city: "Ñuñoa",
      address_1: "Calle 1",
    });
    expect(first).toBe(
      createShipitDestinationContext({
        country_code: "CL",
        city: "NUNOA",
        address_1: "calle 1",
      }),
    );
    expect(first).not.toContain("Calle");
  });

  it("builds the documented home rate request from server data", () => {
    const parcel = cartItemsToShipitParcel([
      {
        quantity: 1,
        variant: {
          id: "variant_1",
          weight: 500,
          length: 20,
          width: 10,
          height: 5,
        },
      },
    ]);
    expect(
      buildShipitHomeRateRequest({
        parcel,
        originCommuneId: 308,
        destinationCommuneId: 131,
      }),
    ).toEqual({
      parcel: {
        length: 20,
        height: 5,
        width: 10,
        weight: 0.5,
        origin_id: 308,
        destiny_id: 131,
        type_of_destiny: "domicilio",
        algorithm: 1,
      },
    });
  });
});
