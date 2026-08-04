import { getLocaleHeader } from "@lib/util/get-locale-header"
import { getStorefrontEnvironment } from "@lib/env-config"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

const environment = getStorefrontEnvironment()

export const sdk = new Medusa({
  baseUrl: environment.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  debug: environment.NODE_ENV === "development",
  publishableKey: environment.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs,
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }
  init = {
    ...init,
    headers: newHeaders,
  }
  return originalFetch(input, init)
}
