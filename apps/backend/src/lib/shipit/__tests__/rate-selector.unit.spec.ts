import {
  requireEligibleShipitRates,
  selectCheapestShipitRate,
} from "../rate-selector";

describe("Shipit rate selector", () => {
  it("keeps the existing home-delivery fallback when destiny is null", () => {
    const rate = selectCheapestShipitRate({
      communeId: 146,
      destinationKind: "domicilio",
      rates: [
        {
          courier: { name: "chilexpress" },
          original_courier: "chilexpress",
          name: "normal",
          price: 6613,
          days: 2,
          available_to_shipping: true,
          destiny: null,
        },
      ],
    });

    expect(rate.original_courier).toBe("chilexpress");
  });

  it("accepts a null-destiny branch rate when the forced courier matches", () => {
    const rate = selectCheapestShipitRate({
      communeId: 146,
      destinationKind: "courier_branch_office",
      courier: "chilexpress",
      rates: [
        {
          courier: { name: "chilexpress" },
          original_courier: "chilexpress",
          name: "normal",
          price: 6613,
          days: 2,
          available_to_shipping: true,
          destiny: null,
        },
      ],
    });

    expect(rate.original_courier).toBe("chilexpress");
    expect(rate.price).toBe(6613);
  });

  it("rejects a null-destiny branch rate without a selected courier", () => {
    expect(() =>
      requireEligibleShipitRates({
        communeId: 146,
        destinationKind: "courier_branch_office",
        rates: [
          {
            courier: { name: "chilexpress" },
            original_courier: "chilexpress",
            name: "normal",
            price: 6613,
            days: 2,
            available_to_shipping: true,
            destiny: null,
          },
        ],
      }),
    ).toThrow("No eligible Shipit rates");
  });

  it("rejects a branch rate from a different courier", () => {
    expect(() =>
      requireEligibleShipitRates({
        communeId: 146,
        destinationKind: "courier_branch_office",
        courier: "chilexpress",
        rates: [
          {
            courier: { name: "bluexpress" },
            original_courier: "bluexpress",
            name: "normal",
            price: 5000,
            days: 2,
            available_to_shipping: true,
            destiny: null,
          },
        ],
      }),
    ).toThrow("No eligible Shipit rates");
  });

  it("accepts an explicit matching branch destiny", () => {
    const rate = selectCheapestShipitRate({
      communeId: 146,
      destinationKind: "courier_branch_office",
      courier: "chilexpress",
      rates: [
        {
          courier: { name: "chilexpress" },
          original_courier: "chilexpress",
          name: "normal",
          price: 6613,
          days: 2,
          available_to_shipping: true,
          destiny: {
            id: 55,
            type_of_destiny: "courier_branch_office",
            available: true,
            commune_id: 146,
          },
        },
      ],
    });

    expect(rate.destiny?.id).toBe(55);
  });
});
