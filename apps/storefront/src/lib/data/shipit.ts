"use server"

import { sdk } from "@lib/config"
import { mapWithConcurrency } from "@lib/shipit/pickup-orchestration"
import { getAuthHeaders, getCacheOptions } from "./cookies"

const BRANCH_DISCOVERY_CONCURRENCY = 4

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

function normalizeCommune(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export type ShipitBranchSelectionOption = {
  courier: ShipitCourierOption
  branch: ShipitBranchOfficeOption
}

export async function listShipitPickupBranches(city: string) {
  const normalizedCity = normalizeCommune(city)

  if (!normalizedCity) {
    throw new Error("Shipit commune is required")
  }

  const [communes, couriers] = await Promise.all([
    listShipitCommunes(),
    listShipitCouriers(),
  ])
  const commune = communes.find(
    (candidate) => normalizeCommune(candidate.name) === normalizedCity
  )

  if (!commune) {
    throw new Error("Shipit commune not found")
  }

  const groups = await mapWithConcurrency(
    couriers,
    BRANCH_DISCOVERY_CONCURRENCY,
    async (courier) => {
      try {
        return {
          courier,
          branches: await listShipitBranchOffices(courier.id, commune.id),
        }
      } catch {
        return {
          courier,
          branches: [] as ShipitBranchOfficeOption[],
        }
      }
    }
  )

  return groups.flatMap(({ courier, branches }) =>
    branches.map((branch) => ({ courier, branch }))
  )
}
