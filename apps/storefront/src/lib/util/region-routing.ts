import { storefrontRegionalConfig } from "../regional-config"

type ResolveCountryCodeParams = {
  availableCountryCodes: Iterable<string>
  urlCountryCode?: string
  cloudflareCountryCode?: string
  vercelCountryCode?: string
}

const normalizeCountryCode = (countryCode?: string) =>
  countryCode?.toLowerCase()

export const resolveCountryCode = ({
  availableCountryCodes,
  urlCountryCode,
  cloudflareCountryCode,
  vercelCountryCode,
}: ResolveCountryCodeParams) => {
  const availableCountries = new Set(
    Array.from(availableCountryCodes, (countryCode) =>
      countryCode.toLowerCase(),
    ),
  )
  const candidates = [
    urlCountryCode,
    cloudflareCountryCode,
    vercelCountryCode,
    storefrontRegionalConfig.defaultCountryCode,
  ].map(normalizeCountryCode)

  const countryCode = candidates.find(
    (candidate) => candidate && availableCountries.has(candidate),
  )

  if (!countryCode) {
    throw new Error(
      `No available Medusa region matches the requested territory or the configured default country (${storefrontRegionalConfig.defaultCountryCode}).`,
    )
  }

  return countryCode
}

export const buildCountryRedirectUrl = ({
  origin,
  pathname,
  search,
  countryCode,
}: {
  origin: string
  pathname: string
  search: string
  countryCode: string
}) => {
  const path = pathname === "/" ? "" : pathname

  return `${origin}/${countryCode}${path}${search}`
}
