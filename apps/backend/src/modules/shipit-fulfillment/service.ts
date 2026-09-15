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
import { SHIPIT_FULFILLMENT_PROVIDER_ID } from "../../lib/shipit/constants";
export { SHIPIT_FULFILLMENT_PROVIDER_ID } from "../../lib/shipit/constants";
import { ShipitApiClient, ShipitPricesClient } from "../../lib/shipit/clients";
import { createIdempotentShipitShipment } from "../../lib/shipit/shipment";
import {
  calculateShipitShippingQuote,
  type ShipitQuoteCart,
  type ShipitQuoteSelection,
} from "../../workflows/quote-shipit-shipping/operation";

export const shipitHomeEconomyOption = {
  id: "shipit-home-economy",
  destination_kind: "home_delivery",
  selection_policy: "cheapest-v1",
} as const;

export const shipitBranchOfficeOption = {
  id: "shipit-branch-office",
  destination_kind: "courier_branch_office",
  selection_policy: "selected-branch-v1",
} as const;

type ShipitFulfillmentOption =
  | typeof shipitHomeEconomyOption
  | typeof shipitBranchOfficeOption;

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

export function buildShipitQuoteSelection(
  optionData: Record<string, unknown>,
  data: Record<string, unknown> = {},
): ShipitQuoteSelection {
  if (
    optionData.id === shipitHomeEconomyOption.id &&
    optionData.destination_kind ===
      shipitHomeEconomyOption.destination_kind &&
    optionData.selection_policy ===
      shipitHomeEconomyOption.selection_policy
  ) {
    return {
      destinationKind: "home_delivery",
    };
  }

  if (
    optionData.id === shipitBranchOfficeOption.id &&
    optionData.destination_kind ===
      shipitBranchOfficeOption.destination_kind &&
    optionData.selection_policy ===
      shipitBranchOfficeOption.selection_policy
  ) {
    const courierId = data.courier_id;
    const branchOfficeId = data.branch_office_id;
    const destinationCommuneId = data.destination_commune_id;

    if (!isPositiveInteger(courierId)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Shipit branch-office courier_id",
      );
    }

    if (!isPositiveInteger(branchOfficeId)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Shipit branch-office branch_office_id",
      );
    }

    if (!isPositiveInteger(destinationCommuneId)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Shipit branch-office destination_commune_id",
      );
    }

    return {
      destinationKind: "courier_branch_office",
      courierId,
      branchOfficeId,
      destinationCommuneId,
    };
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "Invalid Shipit fulfillment option",
  );
}

export function buildShipitShippingMethodData(
  result: {
    quote_id?: string;
    quote_hash: string;
    courier: string;
    service: string;
    delivery_days: number;
    destination_commune_id?: number;
    destination_commune_name?: string;
    courier_id?: number | null;
    branch_office_id?: number | null;
    branch_office_name?: string | null;
    branch_office_address?: string | null;
    parcel?: {
      length_cm: number;
      width_cm: number;
      height_cm: number;
      weight_kg: number;
      items: number;
    };
  },
  selection: ShipitQuoteSelection = {
    destinationKind: "home_delivery",
  },
) {
  const option: ShipitFulfillmentOption =
    selection.destinationKind === "courier_branch_office"
      ? shipitBranchOfficeOption
      : shipitHomeEconomyOption;

  return {
    ...option,
    provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
    ...(result.quote_id
      ? { shipit_quote_id: result.quote_id }
      : {}),
    shipit_quote_hash: result.quote_hash,
    courier: result.courier,
    service: result.service,
    delivery_days: result.delivery_days,
    ...(result.destination_commune_id
      ? {
          destination_commune_id:
            result.destination_commune_id,
        }
      : {}),
    ...(result.destination_commune_name
      ? {
          destination_commune_name:
            result.destination_commune_name,
        }
      : {}),
    ...(selection.destinationKind ===
    "courier_branch_office"
      ? {
          courier_id: result.courier_id,
          branch_office_id: result.branch_office_id,
          branch_office_name: result.branch_office_name,
          branch_office_address:
            result.branch_office_address,
        }
      : {}),
    ...(result.parcel ? { parcel: result.parcel } : {}),
  };
}

class ShipitFulfillmentProviderService
  implements IFulfillmentProvider
{
  static identifier = "shipit";

  constructor(
    private readonly container: Record<string, unknown>,
  ) {}

  private async quote(
    context: unknown,
    selection: ShipitQuoteSelection = {
      destinationKind: "home_delivery",
    },
  ) {
    const configuration =
      validateBackendEnvironment(process.env).SHIPIT;

    if (!configuration) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Shipit is disabled",
      );
    }

    const api = new ShipitApiClient(configuration);
    const prices = new ShipitPricesClient(configuration);

    return calculateShipitShippingQuote(
      {
        api,
        configuration,
        loadCommunes: () => api.communes(),
        loadCouriers: () => prices.couriers(),
        loadBranchOffices: (courierId) =>
          prices.branchOffices(courierId),
      },
      {
        ...(context as ShipitQuoteCart),
        currency_code: "clp",
      },
      selection,
    );
  }

  getIdentifier() {
    return ShipitFulfillmentProviderService.identifier;
  }

  async getFulfillmentOptions() {
    return [
      shipitHomeEconomyOption,
      shipitBranchOfficeOption,
    ];
  }

  async validateOption(data: Record<string, unknown>) {
    const isHome =
      data.id === shipitHomeEconomyOption.id &&
      data.destination_kind ===
        shipitHomeEconomyOption.destination_kind &&
      data.selection_policy ===
        shipitHomeEconomyOption.selection_policy;

    const isBranch =
      data.id === shipitBranchOfficeOption.id &&
      data.destination_kind ===
        shipitBranchOfficeOption.destination_kind &&
      data.selection_policy ===
        shipitBranchOfficeOption.selection_policy;

    return isHome || isBranch;
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
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext,
  ) {
    if (!(await this.validateOption(optionData))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid Shipit fulfillment option",
      );
    }

    const selection = buildShipitQuoteSelection(
      optionData,
      data,
    );

    const result = await this.quote(
      context,
      selection,
    );

    return buildShipitShippingMethodData(
      {
        quote_hash: result.quoteHash,
        courier: result.rate.original_courier,
        service: result.rate.name,
        delivery_days: result.rate.days,
        destination_commune_id: result.destination.id,
        destination_commune_name:
          result.destination.name,
        courier_id: result.courierId,
        branch_office_id: result.branchOfficeId,
        branch_office_name: result.branchOfficeName,
        branch_office_address:
          result.branchOfficeAddress,
        parcel: {
          length_cm: result.parcel.lengthCm,
          width_cm: result.parcel.widthCm,
          height_cm: result.parcel.heightCm,
          weight_kg: result.parcel.weightKg,
          items: result.parcel.items,
        },
      },
      selection,
    );
  }

  async calculatePrice(
    optionData:
      CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceContext,
  ) {
    const quoteContext =
      context as unknown as ShipitQuoteCart;

    if (
      Array.isArray(quoteContext.items) &&
      quoteContext.items.length === 0
    ) {
      return {
        calculated_amount: 0,
        is_calculated_price_tax_inclusive:
          true as const,
      };
    }

    const selection = buildShipitQuoteSelection(
      optionData ?? {},
      data ?? {},
    );

    const result = await this.quote(
      context,
      selection,
    );

    return {
      calculated_amount: result.totals.grossPrice,
      is_calculated_price_tax_inclusive:
        true as const,
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
    _items: Partial<
      Omit<FulfillmentItemDTO, "fulfillment">
    >[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    _fulfillment: Partial<
      Omit<
        FulfillmentDTO,
        "provider_id" | "data" | "items"
      >
    >,
  ): Promise<CreateFulfillmentResult> {
    const configuration =
      validateBackendEnvironment(process.env).SHIPIT;

    if (
      !configuration?.shipmentCreationEnabled ||
      !order
    ) {
      return this.unavailable();
    }

    const api = new ShipitApiClient(configuration);

    const shipment =
      await createIdempotentShipitShipment({
        api,
        prices: new ShipitPricesClient(configuration),
        configuration,
        data,
        order,
      });

    const trackingNumber =
      shipment.tracking_number || "";

    return {
      data: {
        shipit_id: shipment.id,
        shipit_order_id: order.id,
        shipit_reference: shipment.reference,
        shipit_status: shipment.status,
        shipit_courier_status:
          shipment.courier_status ?? null,
        shipit_tracking_number:
          shipment.tracking_number ?? null,
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
