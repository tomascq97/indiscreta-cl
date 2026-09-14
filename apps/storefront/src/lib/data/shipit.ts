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
export type ShipitBranchOfficeOption = {
  id: number
  courier_id: number
  courier_bo_id: string
  name: string
  address: string
  commune_id: number
}

export async function listShipitBranchOffices(
  courierId: number,
  communeId: number
) {
  const response = await sdk.client.fetch<{
    branch_offices: ShipitBranchOfficeOption[]
  }>("/store/shipit/branch-offices", {
    method: "GET",
    query: {
      courier_id: courierId,
      commune_id: communeId,
    },
    headers: await getAuthHeaders(),
    next: await getCacheOptions(
      `shipit-branch-offices-${courierId}-${communeId}`
    ),
  })

  return response.branch_offices
}

export type ShipitCourierOption = {
  id: number
  name: string
}

export async function listShipitCouriers() {
  const response = await sdk.client.fetch<{
    couriers: ShipitCourierOption[]
  }>("/store/shipit/couriers", {
    method: "GET",
    headers: await getAuthHeaders(),
    next: await getCacheOptions("shipit-couriers"),
  })

  return response.couriers
}
