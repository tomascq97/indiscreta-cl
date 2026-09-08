import { MedusaError } from "@medusajs/framework/utils";

import { SHIPIT_FULFILLMENT_PROVIDER_ID } from "../../modules/shipit-fulfillment/service";

export type ShipitCheckoutMethod = {
  id: string;
  amount: unknown;
  data?: Record<string, unknown> | null;
  shipping_option?: {
    provider_id?: string | null;
    price_type?: string | null;
  } | null;
};

export function assertShipitCheckoutQuote(input: {
  methods: ShipitCheckoutMethod[];
  current: {
    quote_id: string;
    quote_hash: string;
    calculated_amount: number;
  };
}) {
  if (input.methods.length !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Expected exactly one shipping method before Webpay",
    );
  }
  const method = input.methods[0];
  const data = method.data ?? {};
  if (
    method.shipping_option?.provider_id !== SHIPIT_FULFILLMENT_PROVIDER_ID ||
    method.shipping_option.price_type !== "calculated" ||
    data.shipit_quote_hash !== input.current.quote_hash ||
    !Number.isSafeInteger(Number(method.amount)) ||
    Number(method.amount) !== input.current.calculated_amount
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "El despacho cambió. Vuelve a seleccionar el método antes de pagar.",
    );
  }
}
