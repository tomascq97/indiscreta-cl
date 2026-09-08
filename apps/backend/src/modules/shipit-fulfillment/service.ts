import type {
  CalculateShippingOptionPriceContext,
  CalculateShippingOptionPriceDTO,
  CreateShippingOptionDTO,
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  IFulfillmentProvider,
  ValidateFulfillmentDataContext,
} from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "../../lib/env";
import { ShipitApiClient, ShipitPricesClient } from "../../lib/shipit/clients";
import { createIdempotentShipitShipment } from "../../lib/shipit/shipment";
import {
  calculateShipitShippingQuote,
  type ShipitQuoteCart,
} from "../../workflows/quote-shipit-shipping/operation";

export const SHIPIT_FULFILLMENT_PROVIDER_ID = "shipit_shipit";

export const shipitHomeEconomyOption = {
  id: "shipit-home-economy",
  destination_kind: "home_delivery",
  selection_policy: "cheapest-v1",
} as const;

export function buildShipitShippingMethodData(result: {
  quote_id?: string;
  quote_hash: string;
  courier: string;
  service: string;
  delivery_days: number;
  destination_commune_id?: number;
  destination_commune_name?: string;
  parcel?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_kg: number;
    items: number;
  };
}) {
  return {
    ...shipitHomeEconomyOption,
    provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
    ...(result.quote_id ? { shipit_quote_id: result.quote_id } : {}),
    shipit_quote_hash: result.quote_hash,
    courier: result.courier,
    service: result.service,
    delivery_days: result.delivery_days,
    ...(result.destination_commune_id
      ? { destination_commune_id: result.destination_commune_id }
      : {}),
    ...(result.destination_commune_name
      ? { destination_commune_name: result.destination_commune_name }
      : {}),
    ...(result.parcel ? { parcel: result.parcel } : {}),
  };
}

class ShipitFulfillmentProviderService implements IFulfillmentProvider {
  static identifier = "shipit";

  constructor(private readonly container: Record<string, unknown>) {}

  private async quote(context: unknown) {
    const configuration = validateBackendEnvironment(process.env).SHIPIT;
    if (!configuration) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Shipit is disabled",
      );
    }
    const api = new ShipitApiClient(configuration);
    return calculateShipitShippingQuote(
      {
        api,
        configuration,
        loadCommunes: () => api.communes(),
      },
      {
        ...(context as ShipitQuoteCart),
        currency_code: "clp",
      },
    );
  }

  getIdentifier() {
    return ShipitFulfillmentProviderService.identifier;
  }

  async getFulfillmentOptions() {
    return [shipitHomeEconomyOption];
  }

  async validateOption(data: Record<string, unknown>) {
    return (
      data.id === shipitHomeEconomyOption.id &&
      data.destination_kind === shipitHomeEconomyOption.destination_kind &&
      data.selection_policy === shipitHomeEconomyOption.selection_policy
    );
  }

  async canCalculate(data: CreateShippingOptionDTO) {
    return (
      data.price_type === "calculated" &&
      !!data.data &&
      (await this.validateOption(data.data))
    );
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    _data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext,
  ) {
    if (!(await this.validateOption(optionData))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Shipit fulfillment option",
      );
    }
    const result = await this.quote(context);
    return buildShipitShippingMethodData({
      quote_hash: result.quoteHash,
      courier: result.rate.original_courier,
      service: result.rate.name,
      delivery_days: result.rate.days,
      destination_commune_id: result.destination.id,
      destination_commune_name: result.destination.name,
      parcel: {
        length_cm: result.parcel.lengthCm,
        width_cm: result.parcel.widthCm,
        height_cm: result.parcel.heightCm,
        weight_kg: result.parcel.weightKg,
        items: result.parcel.items,
      },
    });
  }

  async calculatePrice(
    _optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceContext,
  ) {
    const result = await this.quote(context);
    return {
      calculated_amount: result.totals.grossPrice,
      is_calculated_price_tax_inclusive: true as const,
    };
  }

  private unavailable(): never {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shipit fulfillment side effects are not enabled",
    );
  }

  async createFulfillment(
    data: Record<string, unknown>,
    _items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    _fulfillment: Partial<
      Omit<FulfillmentDTO, "provider_id" | "data" | "items">
    >,
  ): Promise<CreateFulfillmentResult> {
    const configuration = validateBackendEnvironment(process.env).SHIPIT;
    if (!configuration?.shipmentCreationEnabled || !order) {
      return this.unavailable();
    }
    const api = new ShipitApiClient(configuration);
    const shipment = await createIdempotentShipitShipment({
      api,
      prices: new ShipitPricesClient(configuration),
      configuration,
      data,
      order,
    });
    const trackingNumber = shipment.tracking_number || "";
    return {
      data: {
        shipit_id: shipment.id,
        shipit_order_id: order.id,
        shipit_reference: shipment.reference,
        shipit_status: shipment.status,
        shipit_courier_status: shipment.courier_status ?? null,
        shipit_tracking_number: shipment.tracking_number ?? null,
        shipit_updated_at: shipment.updated_at,
        shipit_sandbox: configuration.sandbox,
      },
      labels: trackingNumber
        ? [
            {
              tracking_number: trackingNumber,
              tracking_url: "",
              label_url: "",
            },
          ]
        : [],
    };
  }

  async cancelFulfillment(): Promise<never> {
    return this.unavailable();
  }
  async getFulfillmentDocuments(): Promise<never> {
    return this.unavailable();
  }
  async createReturnFulfillment(): Promise<never> {
    return this.unavailable();
  }
  async retrieveDocuments(): Promise<never> {
    return this.unavailable();
  }
  async getReturnDocuments(): Promise<never> {
    return this.unavailable();
  }
  async getShipmentDocuments(): Promise<never> {
    return this.unavailable();
  }
}

export default ShipitFulfillmentProviderService;
