import type { ShipitConfiguration } from "../../../lib/env";
import { buildShipitShippingMethodData } from "../../../modules/shipit-fulfillment/service";
import { assertShipitCheckoutQuote } from "../../validate-shipit-checkout/operation";
import { quoteShipitShippingOperation } from "../operation";

const configuration: ShipitConfiguration = {
  enabled: true,
  shipmentCreationEnabled: false,
  sandbox: true,
  apiBaseUrl: "https://api.shipit.cl",
  pricesBaseUrl: "https://prices.shipit.cl",
  trackingBaseUrl: "https://courierstatus.shipit.cl",
  email: "account@example.invalid",
  accessToken: "test-token",
  timeoutMs: 1000,
  readMaxRetries: 0,
  originCommuneId: 308,
  quoteMaxAgeSeconds: 900,
  catalogCacheTtlSeconds: 3600,
  ratesAreNet: true,
};

describe("Shipit mocked checkout flow", () => {
  it("selects the cheapest rate, adds IVA and passes the Webpay gate", async () => {
    const cacheValues = new Map<string, unknown>();
    const create = jest.fn(async (data: Record<string, unknown>) => ({
      id: "shq_1",
      cart_id: data.cart_id as string,
      quote_hash: data.quote_hash as string,
      quoted_at: data.quoted_at as Date,
      invalidated_at: null,
      price: data.price,
      net_price: data.net_price,
      tax_amount: data.tax_amount,
      courier_name: data.courier_name as string,
      service_name: data.service_name as string,
      delivery_days: data.delivery_days as number,
    }));
    const result = await quoteShipitShippingOperation(
      {
        configuration,
        query: {
          graph: async () => ({
            data: [
              {
                id: "cart_1",
                currency_code: "clp",
                shipping_address: {
                  country_code: "cl",
                  city: "Ñuñoa",
                  province: "Metropolitana",
                  address_1: "Dirección de prueba 123",
                },
                items: [
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
                ],
              },
            ],
          }),
        },
        cache: {
          get: async (key) => cacheValues.get(key) as never,
          set: async (key, value) => {
            cacheValues.set(key, value);
          },
          invalidate: async (key) => {
            cacheValues.delete(key);
          },
        },
        locking: { execute: async (_key, job) => job() },
        api: {
          communes: async () =>
            [
              {
                id: 131,
                region_id: 13,
                name: "NUNOA",
                is_available: true,
                region: {
                  id: 13,
                  name: "Metropolitana",
                  number: 13,
                  roman_numeral: "RM",
                },
              },
            ] as never,
          rates: async () =>
            ({
              algorithm: "1",
              prices: [
                {
                  courier: { name: "expensive" },
                  original_courier: "expensive",
                  name: "normal",
                  price: 5000,
                  days: 1,
                  available_to_shipping: true,
                  destiny: {
                    id: 1,
                    type_of_destiny: "domicilio",
                    available: true,
                    commune_id: 131,
                  },
                },
                {
                  courier: { name: "economy" },
                  original_courier: "economy",
                  name: "normal",
                  price: 4000,
                  days: 2,
                  available_to_shipping: true,
                  destiny: {
                    id: 2,
                    type_of_destiny: "domicilio",
                    available: true,
                    commune_id: 131,
                  },
                },
              ],
            }) as never,
        },
        store: {
          findByCartAndHash: async () => [],
          create,
        },
      },
      { cartId: "cart_1" },
    );

    expect(result).toMatchObject({
      quote_id: "shq_1",
      calculated_amount: 4760,
      net_amount: 4000,
      tax_amount: 760,
      courier: "economy",
      service: "normal",
      is_calculated_price_tax_inclusive: true,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        net_price: 4000,
        tax_amount: 760,
        price: 4760,
        tax_inclusive: true,
      }),
    );

    const methodData = buildShipitShippingMethodData(result);
    expect(() =>
      assertShipitCheckoutQuote({
        methods: [
          {
            id: "sm_1",
            amount: 4760,
            data: methodData,
            shipping_option: {
              provider_id: methodData.provider_id,
              price_type: "calculated",
            },
          },
        ],
        current: result,
      }),
    ).not.toThrow();
  });
});
