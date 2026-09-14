import { createHash, randomBytes } from "node:crypto";

const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function toCrockfordBase32(bytes: Uint8Array): string {
  let buffer = 0;
  let bits = 0;
  let result = "";

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      result += crockfordAlphabet[(buffer >>> bits) & 31];
    }

    buffer &= (1 << bits) - 1;
  }

  if (bits > 0) {
    result += crockfordAlphabet[(buffer << (5 - bits)) & 31];
  }

  return result;
}

export function generateBuyOrder(): string {
  return `I${toCrockfordBase32(randomBytes(15))}`;
}

export function generateWebpaySessionId(): string {
  return `S${toCrockfordBase32(randomBytes(20))}`;
}

export function createInitiationKey(input: {
  providerId: string;
  paymentSessionId: string;
  amount: number;
  currencyCode: string;
  revision?: number;
}): string {
  const canonical = [
    input.providerId,
    input.paymentSessionId,
    input.amount.toString(),
    input.currencyCode.toLowerCase(),
    (input.revision ?? 0).toString(),
  ].join(":");

  return `wpi_${createHash("sha256").update(canonical).digest("base64url")}`;
}
