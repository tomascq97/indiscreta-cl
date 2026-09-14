import {
  SHIPIT_FULFILLMENT_PROVIDER_ID,
  shipitBranchOfficeOption,
  shipitHomeEconomyOption,
} from "../../../modules/shipit-fulfillment/service";
import { validateShipitCheckoutBeforeWebpay } from "../index";

function containerWithMethod(
  method: Record<string, unknown>,
) {
  return {
    resolve: () => ({
      graph: async () => ({
        data: [
          {
            id: "cart_1",
            shipping_methods: [method],
          },
        ],
      }),
    }),
  };
}

describe("Shipit pre-Webpay workflow gate", () => {
  it("re-quotes the exact selected branch before Webpay", async () => {
    const method = {
      id: "sm_branch",
      amount: 7869,
      data: {
        ...shipitBranchOfficeOption,
        shipit_quote_id: "shq_branch",
        shipit_quote_hash: "branch-hash",
        courier: "Chilexpress",
        courier_id: 1,
        branch_office_id: 940,
        branch_office_name: "MANIPULABLE",
        branch_office_address: "MANIPULABLE 999",
        destination_commune_id: 146,
      },
      shipping_option: {
        provider_id:
          SHIPIT_FULFILLMENT_PROVIDER_ID,
        price_type: "calculated",
      },
    };

    const quote = jest.fn(async () => ({
      quote_id: "shq_branch",
      quote_hash: "branch-hash",
      calculated_amount: 7869,
    }));

    await expect(
      validateShipitCheckoutBeforeWebpay(
        containerWithMethod(method) as never,
        "cart_1",
        { quote },
      ),
    ).resolves.toBeUndefined();

    expect(quote).toHaveBeenCalledTimes(1);

    expect(quote).toHaveBeenCalledWith({
      cartId: "cart_1",
      selection: {
        destinationKind:
          "courier_branch_office",
        courierId: 1,
        branchOfficeId: 940,
        destinationCommuneId: 146,
      },
    });
  });

  it("re-quotes home delivery without branch metadata", async () => {
    const method = {
      id: "sm_home",
      amount: 4760,
      data: {
        ...shipitHomeEconomyOption,
        shipit_quote_id: "shq_home",
        shipit_quote_hash: "home-hash",
        courier: "Bluexpress",
        destination_commune_id: 131,
      },
      shipping_option: {
        provider_id:
          SHIPIT_FULFILLMENT_PROVIDER_ID,
        price_type: "calculated",
      },
    };

    const quote = jest.fn(async () => ({
      quote_id: "shq_home",
      quote_hash: "home-hash",
      calculated_amount: 4760,
    }));

    await validateShipitCheckoutBeforeWebpay(
      containerWithMethod(method) as never,
      "cart_1",
      { quote },
    );

    expect(quote).toHaveBeenCalledWith({
      cartId: "cart_1",
      selection: {
        destinationKind: "home_delivery",
      },
    });
  });

  it("blocks Webpay when the selected branch quote changed", async () => {
    const method = {
      id: "sm_branch",
      amount: 6613,
      data: {
        ...shipitBranchOfficeOption,
        shipit_quote_id: "shq_branch",
        shipit_quote_hash: "old-hash",
        courier: "Chilexpress",
        courier_id: 1,
        branch_office_id: 940,
        branch_office_name: "Sucursal",
        branch_office_address: "Direccion 123",
        destination_commune_id: 146,
      },
      shipping_option: {
        provider_id:
          SHIPIT_FULFILLMENT_PROVIDER_ID,
        price_type: "calculated",
      },
    };

    const quote = jest.fn(async () => ({
      quote_id: "shq_new",
      quote_hash: "new-hash",
      calculated_amount: 7869,
    }));

    await expect(
      validateShipitCheckoutBeforeWebpay(
        containerWithMethod(method) as never,
        "cart_1",
        { quote },
      ),
    ).rejects.toThrow("El despacho");

    expect(quote).toHaveBeenCalledTimes(1);
  });

  it("ignores non-Shipit shipping methods", async () => {
    const method = {
      id: "sm_other",
      amount: 5000,
      data: {},
      shipping_option: {
        provider_id: "other-provider",
        price_type: "calculated",
      },
    };

    const quote = jest.fn();

    await expect(
      validateShipitCheckoutBeforeWebpay(
        containerWithMethod(method) as never,
        "cart_1",
        { quote },
      ),
    ).resolves.toBeUndefined();

    expect(quote).not.toHaveBeenCalled();
  });
});
