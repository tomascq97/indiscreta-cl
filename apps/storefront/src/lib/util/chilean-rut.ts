export function normalizeChileanRut(value: string) {
  return value
    .replace(/[^0-9kK]/g, "")
    .toUpperCase()
    .slice(0, 9)
}

export function formatChileanRut(value: string) {
  const normalized = normalizeChileanRut(value)
  if (normalized.length < 2) return normalized
  const body = normalized.slice(0, -1)
  const verifier = normalized.slice(-1)
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${grouped}-${verifier}`
}

export function isValidChileanRut(value: string) {
  const normalized = normalizeChileanRut(value)
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) return false

  const body = normalized.slice(0, -1)
  const suppliedVerifier = normalized.slice(-1)
  let sum = 0
  let multiplier = 2

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedVerifier =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder)
  return suppliedVerifier === expectedVerifier
}
