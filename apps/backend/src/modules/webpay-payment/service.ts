import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";

export const WEBPAY_PROVIDER_ID = "pp_webpay-plus_webpay";

const copyData = (data?: Record<string, unknown>) => ({ ...(data ?? {}) });

const statusFromData = (
  data?: Record<string, unknown>,
): PaymentSessionStatus => {
  const state = data?.webpay_state;

  if (
    state === "approved_validated" ||
    state === "medusa_authorized" ||
    state === "completed"
  ) {
    return PaymentSessionStatus.AUTHORIZED;
  }

  if (state === "cancelled") {
    return PaymentSessionStatus.CANCELED;
  }

  return PaymentSessionStatus.PENDING;
};

class WebpayPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "webpay-plus";

  constructor(container: Record<string, unknown>) {
    super(container);
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentOutput> {
    const sessionId =
      (input.data?.session_id as string | undefined) ??
      input.context?.idempotency_key;

    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Medusa did not provide a payment session identifier",
      );
    }

    return {
      id: sessionId,
      status: PaymentSessionStatus.PENDING,
      data: copyData(input.data),
    };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: copyData(input.data), status: statusFromData(input.data) };
  }

  async retrievePayment(
    input: RetrievePaymentInput,
  ): Promise<RetrievePaymentOutput> {
    return { data: copyData(input.data) };
  }

  async authorizePayment(
    input: AuthorizePaymentInput,
  ): Promise<AuthorizePaymentOutput> {
    return { data: copyData(input.data), status: statusFromData(input.data) };
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput,
  ): Promise<GetPaymentStatusOutput> {
    return { data: copyData(input.data), status: statusFromData(input.data) };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: { ...copyData(input.data), webpay_state: "cancelled" },
    };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: copyData(input.data) };
  }

  async capturePayment(
    input: CapturePaymentInput,
  ): Promise<CapturePaymentOutput> {
    return { data: copyData(input.data) };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    void input;
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Webpay refunds are not implemented",
    );
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" };
  }
}

export default WebpayPaymentProviderService;
