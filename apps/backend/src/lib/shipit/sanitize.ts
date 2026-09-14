const sensitiveKeys = new Set([
  "authorization",
  "x-shipit-access-token",
  "x-shipit-email",
  "accessToken",
  "email",
  "phone",
  "full_name",
  "street",
  "number",
  "complement",
]);

export function sanitizeShipitValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeShipitValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key) || sensitiveKeys.has(key.toLowerCase())
        ? "[REDACTED]"
        : sanitizeShipitValue(entry),
    ]),
  );
}
