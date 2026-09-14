import { timingSafeEqual } from "node:crypto";

export function isValidShipitWebhookAuthorization(
  authorization: string | undefined,
  token: string | undefined,
) {
  if (!authorization || !token) return false;
  const expected = Buffer.from(`Bearer ${token}`);
  const received = Buffer.from(authorization);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}
