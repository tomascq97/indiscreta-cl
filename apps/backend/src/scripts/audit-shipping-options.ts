import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function auditShippingOptions({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const result = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id", "price_type", "data"],
  })

  const options = result.data
    .filter((option) =>
      ["Standard Shipping", "Express Shipping"].includes(option.name),
    )
    .map((option) => ({
      id: option.id,
      name: option.name,
      provider_id: option.provider_id,
      price_type: option.price_type,
      data: option.data,
    }))

  console.log(JSON.stringify(options, null, 2))
}