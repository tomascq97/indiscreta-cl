import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

import {
  SHIPIT_FULFILLMENT_PROVIDER_ID,
  shipitBranchOfficeOption,
  shipitHomeEconomyOption,
} from "../modules/shipit-fulfillment/service"

export default async function repairMissingShipitBranchOption({
  container,
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const [profiles, zones, options] = await Promise.all([
    query.graph({
      entity: "shipping_profile",
      fields: ["id", "name", "type"],
    }),
    query.graph({
      entity: "service_zone",
      fields: ["id", "name", "geo_zones.country_code"],
    }),
    query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "provider_id", "price_type", "data"],
      filters: { provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID },
    }),
  ])

  const chileZones = zones.data.filter((zone) =>
    (zone.geo_zones ?? []).some(
      (geoZone) => geoZone?.country_code?.toLowerCase() === "cl",
    ),
  )

  if (profiles.data.length !== 1 || chileZones.length !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Safety check failed: expected exactly 1 shipping profile and 1 Chile service zone; found ${profiles.data.length} and ${chileZones.length}`,
    )
  }

  const profile = profiles.data[0]
  const zone = chileZones[0]

  if (
    profile.id !== "sp_01KZH7REEYF6AZGZWAB30W1B5A" ||
    zone.id !== "serzo_01KZH7RENJS5R0ATENQKZDDF8Z"
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Safety check failed: production shipping profile or Chile service zone does not match the audited infrastructure",
    )
  }

  const homeOptions = options.data.filter((option) => {
    const data = option.data as { id?: unknown; destination_kind?: unknown } | null
    return (
      data?.id === shipitHomeEconomyOption.id &&
      data?.destination_kind === shipitHomeEconomyOption.destination_kind
    )
  })

  if (homeOptions.length !== 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Safety check failed: expected exactly 1 canonical Shipit home option; found ${homeOptions.length}`,
    )
  }

  const branchByCanonicalId = options.data.filter((option) => {
    const data = option.data as { id?: unknown } | null
    return data?.id === shipitBranchOfficeOption.id
  })

  const branchByName = options.data.filter(
    (option) => option.name === "Shipit retiro en sucursal",
  )

  if (branchByCanonicalId.length === 1 && branchByName.length === 1) {
    const existing = branchByCanonicalId[0]
    const data = existing.data as {
      id?: unknown
      destination_kind?: unknown
      selection_policy?: unknown
    } | null

    if (
      existing.id === branchByName[0].id &&
      existing.provider_id === SHIPIT_FULFILLMENT_PROVIDER_ID &&
      existing.price_type === "calculated" &&
      data?.destination_kind === shipitBranchOfficeOption.destination_kind &&
      data?.selection_policy === shipitBranchOfficeOption.selection_policy
    ) {
      console.log(
        JSON.stringify(
          {
            action: "noop",
            reason: "Canonical Shipit branch option already exists",
            shippingOption: existing,
          },
          null,
          2,
        ),
      )
      return
    }
  }

  if (branchByCanonicalId.length !== 0 || branchByName.length !== 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Safety check failed: conflicting Shipit branch option already exists",
    )
  }

  const result = await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Shipit retiro en sucursal",
        price_type: "calculated" as const,
        provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
        service_zone_id: zone.id,
        shipping_profile_id: profile.id,
        data: shipitBranchOfficeOption,
        type: {
          label: "Shipit sucursal",
          description: "Retiro en sucursal de courier mediante Shipit.",
          code: "shipit-branch-office",
        },
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq" as const,
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq" as const,
          },
        ],
      },
    ],
  })

  const { data: configuredOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id", "price_type", "data"],
    filters: { provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID },
  })

  console.log(
    JSON.stringify(
      {
        action: "created",
        serviceZoneId: zone.id,
        shippingProfileId: profile.id,
        workflowResult: result.result,
        shippingOptions: configuredOptions,
      },
      null,
      2,
    ),
  )
}
