import { model } from "@medusajs/framework/utils";

export const webpayAttemptStates = [
  "creating",
  "initialized",
  "create_failed",
  "recovery_required",
  "cancelled",
  "approved_validated",
  "medusa_authorized",
  "completed",
];

const WebpayAttempt = model
  .define("webpay_attempt", {
    id: model.id({ prefix: "wpa" }).primaryKey(),
    state: model.enum(webpayAttemptStates),
    cart_id: model.text(),
    payment_collection_id: model.text(),
    payment_session_id: model.text(),
    provider_id: model.text(),
    initiation_key: model.text(),
    buy_order: model.text(),
    session_id: model.text(),
    amount: model.bigNumber(),
    currency_code: model.text(),
    token: model.text().nullable(),
    webpay_url: model.text().nullable(),
    payment_id: model.text().nullable(),
    order_id: model.text().nullable(),
    transbank_status: model.text().nullable(),
    failure_code: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_webpay_attempt_initiation_key",
      on: ["initiation_key"],
      unique: true,
    },
    { name: "IDX_webpay_attempt_buy_order", on: ["buy_order"], unique: true },
    { name: "IDX_webpay_attempt_session_id", on: ["session_id"], unique: true },
    {
      name: "IDX_webpay_attempt_token",
      on: ["token"],
      unique: true,
      where: "deleted_at IS NULL AND token IS NOT NULL",
    },
    {
      name: "IDX_webpay_attempt_payment_id",
      on: ["payment_id"],
      unique: true,
      where: "deleted_at IS NULL AND payment_id IS NOT NULL",
    },
    {
      name: "IDX_webpay_attempt_order_id",
      on: ["order_id"],
      unique: true,
      where: "deleted_at IS NULL AND order_id IS NOT NULL",
    },
    {
      name: "IDX_webpay_attempt_payment_session_id",
      on: ["payment_session_id"],
    },
    { name: "IDX_webpay_attempt_cart_id", on: ["cart_id"] },
    {
      name: "IDX_webpay_attempt_state_updated_at",
      on: ["state", "updated_at"],
    },
  ]);

export default WebpayAttempt;
