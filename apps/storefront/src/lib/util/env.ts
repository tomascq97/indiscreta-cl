import { getStorefrontEnvironment } from "@lib/env-config"

export const getBaseURL = () => {
  const environment = getStorefrontEnvironment()

  return environment.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"
}
