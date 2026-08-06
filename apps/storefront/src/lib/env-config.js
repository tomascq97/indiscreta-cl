// @ts-check

const requiredEnvironmentVariables = Object.freeze([
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
])

const optionalEnvironmentVariables = Object.freeze([
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_STRIPE_KEY",
  "NEXT_PUBLIC_VERCEL_URL",
  "NODE_ENV",
])

const conditionalEnvironmentVariables = Object.freeze({
  production: Object.freeze(["NEXT_PUBLIC_BASE_URL"]),
  medusaPayments: Object.freeze([
    "NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID",
  ]),
  medusaCloudS3: Object.freeze([
    "MEDUSA_CLOUD_S3_HOSTNAME",
    "MEDUSA_CLOUD_S3_PATHNAME",
  ]),
})

/**
 * @typedef {Object} StorefrontEnvironment
 * @property {string} NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
 * @property {string} NEXT_PUBLIC_MEDUSA_BACKEND_URL
 * @property {string | undefined} NEXT_PUBLIC_BASE_URL
 * @property {string | undefined} NEXT_PUBLIC_STRIPE_KEY
 * @property {string | undefined} NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY
 * @property {string | undefined} NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
 * @property {string | undefined} NEXT_PUBLIC_VERCEL_URL
 * @property {string | undefined} MEDUSA_CLOUD_S3_HOSTNAME
 * @property {string | undefined} MEDUSA_CLOUD_S3_PATHNAME
 * @property {string | undefined} NODE_ENV
 */

class EnvironmentValidationError extends Error {
  /** @param {string[]} issues */
  constructor(issues) {
    super(`Invalid environment configuration: ${issues.join("; ")}`)
    this.name = "EnvironmentValidationError"
    this.issues = issues
  }
}

/** @param {string | undefined} value */
function normalize(value) {
  const normalizedValue = value?.trim()
  return normalizedValue || undefined
}

/** @param {string} hostname */
function isLocalHostname(hostname) {
  let normalizedHostname = hostname.toLowerCase()

  if (normalizedHostname.startsWith("[") && normalizedHostname.endsWith("]")) {
    normalizedHostname = normalizedHostname.slice(1, -1)
  }

  normalizedHostname = normalizedHostname.replace(/\.$/, "")

  return (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname === "::1" ||
    /^127(?:\.\d{1,3}){3}$/.test(normalizedHostname)
  )
}

/**
 * @param {string} name
 * @param {string | undefined} value
 * @param {boolean} isProduction
 * @param {string[]} issues
 */
function validateUrl(name, value, isProduction, issues) {
  if (!value) {
    return
  }

  try {
    const url = new URL(value)

    if (!["http:", "https:"].includes(url.protocol)) {
      issues.push(`${name} must use http: or https:`)
      return
    }

    if (isProduction && isLocalHostname(url.hostname)) {
      issues.push(`${name} must not use localhost in production`)
    }
  } catch {
    issues.push(`${name} must be a valid URL`)
  }
}

/**
 * @param {Record<string, string | undefined>} environment
 * @param {readonly string[]} names
 * @param {string[]} issues
 */
function validateAllOrNone(environment, names, issues) {
  const configuredNames = names.filter((name) => normalize(environment[name]))

  if (configuredNames.length > 0 && configuredNames.length < names.length) {
    const missingNames = names.filter((name) => !normalize(environment[name]))
    issues.push(
      `Conditional environment variables required: ${missingNames.join(", ")}`,
    )
  }
}

/**
 * @param {Record<string, string | undefined>} environment
 * @returns {StorefrontEnvironment}
 */
function validateStorefrontEnvironment(environment) {
  const issues = []
  const nodeEnvironment = normalize(environment.NODE_ENV)
  const isProduction = nodeEnvironment === "production"

  for (const name of requiredEnvironmentVariables) {
    if (!normalize(environment[name])) {
      issues.push(`Missing required environment variable: ${name}`)
    }
  }

  if (isProduction && !normalize(environment.NEXT_PUBLIC_BASE_URL)) {
    issues.push("Missing production environment variable: NEXT_PUBLIC_BASE_URL")
  }

  validateAllOrNone(
    environment,
    conditionalEnvironmentVariables.medusaPayments,
    issues,
  )
  validateAllOrNone(
    environment,
    conditionalEnvironmentVariables.medusaCloudS3,
    issues,
  )
  validateUrl(
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
    normalize(environment.NEXT_PUBLIC_MEDUSA_BACKEND_URL),
    isProduction,
    issues,
  )
  validateUrl(
    "NEXT_PUBLIC_BASE_URL",
    normalize(environment.NEXT_PUBLIC_BASE_URL),
    isProduction,
    issues,
  )

  if (issues.length) {
    throw new EnvironmentValidationError(issues)
  }

  return /** @type {StorefrontEnvironment} */ ({
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: normalize(
      environment.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: normalize(
      environment.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    ),
    NEXT_PUBLIC_BASE_URL: normalize(environment.NEXT_PUBLIC_BASE_URL),
    NEXT_PUBLIC_STRIPE_KEY: normalize(environment.NEXT_PUBLIC_STRIPE_KEY),
    NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY: normalize(
      environment.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY,
    ),
    NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID: normalize(
      environment.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID,
    ),
    NEXT_PUBLIC_VERCEL_URL: normalize(environment.NEXT_PUBLIC_VERCEL_URL),
    MEDUSA_CLOUD_S3_HOSTNAME: normalize(environment.MEDUSA_CLOUD_S3_HOSTNAME),
    MEDUSA_CLOUD_S3_PATHNAME: normalize(environment.MEDUSA_CLOUD_S3_PATHNAME),
    NODE_ENV: nodeEnvironment,
  })
}

function readStorefrontEnvironment() {
  return {
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID:
      process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    MEDUSA_CLOUD_S3_HOSTNAME: process.env.MEDUSA_CLOUD_S3_HOSTNAME,
    MEDUSA_CLOUD_S3_PATHNAME: process.env.MEDUSA_CLOUD_S3_PATHNAME,
    NODE_ENV: process.env.NODE_ENV,
  }
}

function getStorefrontEnvironment() {
  return validateStorefrontEnvironment(readStorefrontEnvironment())
}

module.exports = {
  EnvironmentValidationError,
  conditionalEnvironmentVariables,
  getStorefrontEnvironment,
  optionalEnvironmentVariables,
  readStorefrontEnvironment,
  requiredEnvironmentVariables,
  validateStorefrontEnvironment,
}
