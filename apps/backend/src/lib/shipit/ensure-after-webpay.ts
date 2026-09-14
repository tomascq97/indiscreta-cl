export type WebpayFulfillmentAttempt = {
  state?: string;
  order_id?: string | null;
};

export type WebpayFulfillmentLogger = {
  error(message: string): void;
};

export async function ensureShipitAfterCompletedWebpay(input: {
  attempt: WebpayFulfillmentAttempt;
  ensureFulfillment(orderId: string): Promise<unknown>;
  logger: WebpayFulfillmentLogger;
}): Promise<void> {
  const { attempt, ensureFulfillment, logger } = input;

  if (attempt.state !== "completed" || !attempt.order_id) {
    return;
  }

  try {
    await ensureFulfillment(attempt.order_id);
  } catch (error) {
    logger.error(
      JSON.stringify({
        event: "shipit.fulfillment.ensure_failed",
        order_id: attempt.order_id,
        error_name:
          error instanceof Error ? error.name : "UnknownError",
      }),
    );
  }
}