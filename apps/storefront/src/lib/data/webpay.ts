"use server"

import { sdk } from "@lib/config"
import type { WebpayInitiationResponse } from "@lib/util/webpay-redirect"

import { getAuthHeaders, getCartId } from "./cookies"

export async function initiateWebpayPayment(): Promise<WebpayInitiationResponse> {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No active cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<WebpayInitiationResponse>("/store/webpay/initiate", {
    method: "POST",
    body: { cart_id: cartId },
    headers,
    cache: "no-store",
  })
}
