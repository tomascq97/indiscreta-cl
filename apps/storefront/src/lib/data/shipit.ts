"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export type ShipitCommuneOption = {
  id: number
  name: string
  region: string
}

export async function listShipitCommunes() {
  const response = await sdk.client.fetch<{
    communes: ShipitCommuneOption[]
  }>("/store/shipit/communes", {
    method: "GET",
    headers: await getAuthHeaders(),
    next: await getCacheOptions("shipit-communes"),
  })
  return response.communes
}
