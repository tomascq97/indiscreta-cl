"use server"

import { sdk } from "@lib/config"
import { mapWithConcurrency } from "@lib/shipit/pickup-orchestration"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((_e) => {
      return null
    })
}

const BRANCH_QUOTE_CONCURRENCY = 3

export type ShipitBranchQuoteInput = {
  courierId: number
  data: Record<string, unknown>
}

export type ShipitBranchQuoteResult =
  | {
      courierId: number
      status: "done"
      amount: number
    }
  | {
      courierId: number
      status: "error"
    }

export const calculatePricesForShipitCouriers = async (
  optionId: string,
  cartId: string,
  quotes: ShipitBranchQuoteInput[]
): Promise<ShipitBranchQuoteResult[]> => {
  return mapWithConcurrency(
    quotes,
    BRANCH_QUOTE_CONCURRENCY,
    async ({ courierId, data }) => {
      const result = await calculatePriceForShippingOption(
        optionId,
        cartId,
        data
      )

      if (
        !result ||
        typeof result.amount !== "number" ||
        !Number.isFinite(result.amount) ||
        result.amount < 0
      ) {
        return { courierId, status: "error" as const }
      }

      return {
        courierId,
        status: "done" as const,
        amount: result.amount,
      }
    }
  )
}
