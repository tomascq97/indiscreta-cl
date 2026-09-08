export type ShipitErrorCode =
  | "CONFIGURATION_ERROR"
  | "INVALID_RESPONSE"
  | "REQUEST_FAILED"
  | "RESPONSE_TOO_LARGE"
  | "TIMEOUT";

export class ShipitError extends Error {
  constructor(
    readonly code: ShipitErrorCode,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ShipitError";
  }
}
