import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

import {
  SHIPIT_FULFILLMENT_PROVIDER_ID,
  shipitHomeEconomyOption,
} from "../modules/shipit-fulfillment/service"

function assertSafeEnvironment() {
  const database = new URL(process.env.DATABASE_URL ?? "")
  if (
    !["localhost", "127.0.0.1", "[::1]", "::1"].includes(
      database.hostname,
    ) ||
    process.env.SHIPIT_ENABLED !== "true" ||
    process.env.SHIPIT_SHIPMENT_CREATION_ENABLED !== "false"
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shipit local setup requires a local database, enabled quotes, and disabled shipment creation",
    )
  }
}

export default async function setupShipitLocal({ container }: ExecArgs) {
  assertSafeEnvironment()

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const [locations, profiles, zones, options] = await Promise.all([
    query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_providers.id"],
    }),
    query.graph({ entity: "shipping_profile", fields: ["id"] }),
    query.graph({
      entity: "service_zone",
      fields: ["id", "name", "geo_zones.country_code"],
    }),
    query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "provider_id", "data"],
      filters: { provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID },
    }),
  ])

  const location = locations.data[0]
  const profile = profiles.data[0]
  const zone = zones.data.find((candidate) =>
    (candidate.geo_zones ?? []).some(
      (geoZone) => geoZone?.country_code?.toLowerCase() === "cl",
    ),
  )
  if (!location || !profile || !zone) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Stock location, shipping profile, or Chile service zone is missing",
    )
  }

  if (
    !(location.fulfillment_providers ?? []).some(
      (provider) => provider?.id === SHIPIT_FULFILLMENT_PROVIDER_ID,
    )
  ) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
      },
    })
  }

  if (!options.data.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Shipit domicilio económico",
          price_type: "calculated",
          provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID,
          service_zone_id: zone.id,
          shipping_profile_id: profile.id,
          data: shipitHomeEconomyOption,
          type: {
            label: "Shipit domicilio",
            description: "Despacho a domicilio mediante Shipit.",
            code: "shipit-home-economy",
          },
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
      ],
    })
  }

  const { data: configuredOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id", "price_type", "data"],
    filters: { provider_id: SHIPIT_FULFILLMENT_PROVIDER_ID },
  })
  console.log(
    JSON.stringify(
      {
        locationId: location.id,
        serviceZoneId: zone.id,
        shippingOptions: configuredOptions,
      },
      null,
      2,
    ),
  )
}
