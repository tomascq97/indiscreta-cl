import { selectAvailableCouriers } from "../route";

describe("Shipit couriers route helpers", () => {
  it("returns only couriers available to ship", () => {
    expect(
      selectAvailableCouriers([
        {
          id: 2,
          name: "Starken",
          available_to_ship: true,
        },
        {
          id: 3,
          name: "Inactive",
          available_to_ship: false,
        },
        {
          id: 1,
          name: "Chilexpress",
          available_to_ship: true,
        },
      ]),
    ).toEqual([
      {
        id: 1,
        name: "Chilexpress",
      },
      {
        id: 2,
        name: "Starken",
      },
    ]);
  });

  it("returns an empty catalog when no courier is available", () => {
    expect(
      selectAvailableCouriers([
        {
          id: 1,
          name: "Unavailable",
          available_to_ship: false,
        },
      ]),
    ).toEqual([]);
  });
});
