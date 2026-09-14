import type { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseURL()
  const countryCode = "cl"

  return [
    {
      url: `${baseUrl}/${countryCode}`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/${countryCode}/ayuda`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/${countryCode}/informacion`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]
}