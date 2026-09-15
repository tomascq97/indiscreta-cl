import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

const EXPECTED = [
  {
    id: "so_01KZH7REQA40ZST952J6ZWG470",
    name: "Express Shipping",
  },
  {
    id: "so_01KZH7REQAJ1FMBTQ591D5FCMB",
    name: "Standard Shipping",
  },
] as const

export default async function removeLegacyShippingOptions({
  container,
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const result = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id"],
    filters: {
      id: EXPECTED.map((option) => option.id),
    },
  })

  if (result.data.length !== EXPECTED.length) {
    throw new Error(
      `Safety check failed: expected ${EXPECTED.length} options, found ${result.data.length}`,
    )
  }

  for (const expected of EXPECTED) {
    const actual = result.data.find((option) => option.id === expected.id)

    if (
      !actual ||
      actual.name !== expected.name ||
      actual.provider_id !== "manual_manual"
    ) {
      throw new Error(
        `Safety check failed for shipping option ${expected.id}`,
      )
    }
  }

  console.log(
    "Safety checks passed:",
    EXPECTED.map((option) => `${option.name} (${option.id})`).join(", "),
  )

  await deleteShippingOptionsWorkflow(container).run({
    input: {
      ids: EXPECTED.map((option) => option.id),
    },
  })

  console.log("Legacy manual shipping options deleted.")
}