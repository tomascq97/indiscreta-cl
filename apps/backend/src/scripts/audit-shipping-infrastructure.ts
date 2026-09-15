import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function auditShippingInfrastructure({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const [profiles, zones] = await Promise.all([
    query.graph({
      entity: "shipping_profile",
      fields: ["id", "name", "type"],
    }),
    query.graph({
      entity: "service_zone",
      fields: ["id", "name", "geo_zones.country_code"],
    }),
  ])

  const chileZones = zones.data.filter((zone) =>
    (zone.geo_zones ?? []).some(
      (geoZone) => geoZone?.country_code?.toLowerCase() === "cl",
    ),
  )

  console.log(
    JSON.stringify(
      {
        shippingProfiles: profiles.data,
        chileServiceZones: chileZones,
      },
      null,
      2,
    ),
  )
}