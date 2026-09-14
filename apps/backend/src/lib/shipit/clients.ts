import type { ShipitConfiguration } from "../env";
import {
  shipitBranchOfficesResponseSchema,
  shipitCommunesResponseSchema,
  shipitCourierSchema,
  shipitCouriersResponseSchema,
  shipitRateRequestSchema,
  shipitRatesResponseSchema,
  shipitShipmentRequestSchema,
  shipitShipmentResponseSchema,
  shipitTrackingResponseSchema,
  type ShipitRateRequest,
  type ShipitShipmentRequest,
  shipitShipmentLookupResponseSchema,
} from "./contracts";
import { ShipitError } from "./errors";
import { ShipitHttpClient } from "./http-client";

export class ShipitApiClient {
  constructor(
    private readonly configuration: ShipitConfiguration,
    private readonly http = new ShipitHttpClient(configuration),
  ) {}

  communes() {
    return this.http.request({
      baseUrl: this.configuration.apiBaseUrl,
      path: "/v/communes",
      schema: shipitCommunesResponseSchema,
    });
  }

  rates(request: ShipitRateRequest) {
    return this.http.request({
      baseUrl: this.configuration.apiBaseUrl,
      path: "/v/rates",
      method: "POST",
      body: shipitRateRequestSchema.parse(request),
      schema: shipitRatesResponseSchema,
    });
  }

  async shipmentByReference(reference: string) {
    const response = await (async () => {
      try {
        // Shipit's vendor representation is authoritative for existing shipments.
        return await this.http.request({
          baseUrl: this.configuration.apiBaseUrl,
          path: `/v/shipments/reference/${encodeURIComponent(reference)}`,
          schema: shipitShipmentLookupResponseSchema,
        });
      } catch (error) {
        const shouldProbeJsonNotFound =
          error instanceof ShipitError &&
          error.code === "REQUEST_FAILED" &&
          error.status === 400;

        if (!shouldProbeJsonNotFound) {
          throw error;
        }

        // Shipit returns 400 with the vendor representation for a missing
        // reference, but an unequivocal 404 with application/json.
        return this.http.request({
          baseUrl: this.configuration.apiBaseUrl,
          path: `/v/shipments/reference/${encodeURIComponent(reference)}`,
          accept: "application/json",
          schema: shipitShipmentLookupResponseSchema,
        });
      }
    })();

    const shipment = response.shipments.find(
      (candidate) => candidate.reference === reference,
    );

    if (!shipment) {
      throw new ShipitError(
        "INVALID_RESPONSE",
        "Shipit shipment lookup returned no matching shipment",
      );
    }

    return shipment;
  }

  createShipment(request: ShipitShipmentRequest) {
    if (!this.configuration.shipmentCreationEnabled) {
      throw new ShipitError(
        "CONFIGURATION_ERROR",
        "Shipit shipment creation is disabled",
      );
    }
    return this.http.request({
      baseUrl: this.configuration.apiBaseUrl,
      path: "/v/shipments",
      method: "POST",
      body: shipitShipmentRequestSchema.parse(request),
      schema: shipitShipmentResponseSchema,
    });
  }
}

export class ShipitPricesClient {
  constructor(
    private readonly configuration: ShipitConfiguration,
    private readonly http = new ShipitHttpClient(configuration),
  ) {}

  couriers() {
    return this.http.request({
      baseUrl: this.configuration.pricesBaseUrl,
      path: "/v/couriers",
      schema: shipitCouriersResponseSchema,
    });
  }

  courier(id: number) {
    return this.http.request({
      baseUrl: this.configuration.pricesBaseUrl,
      path: `/v/couriers/${id}`,
      schema: shipitCourierSchema,
    });
  }

  branchOffices(courierId: number) {
    return this.http.request({
      baseUrl: this.configuration.pricesBaseUrl,
      path: `/v/couriers/${courierId}/couriers_branch_offices`,
      schema: shipitBranchOfficesResponseSchema,
    });
  }
}

export class ShipitTrackingClient {
  constructor(
    private readonly configuration: ShipitConfiguration,
    private readonly http = new ShipitHttpClient(configuration),
  ) {}

  byNumber(number: string) {
    return this.http.request({
      baseUrl: this.configuration.trackingBaseUrl,
      path: `/v/trackings/number/${encodeURIComponent(number)}`,
      schema: shipitTrackingResponseSchema,
    });
  }
}
