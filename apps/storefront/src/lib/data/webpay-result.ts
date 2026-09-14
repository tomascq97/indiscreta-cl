"use server"

import { sdk } from "@lib/config"
import {
  unavailableWebpayResult,
  type WebpayResult,
} from "@lib/util/webpay-result"

export async function retrieveWebpayResult(
  attemptId: string | undefined,
): Promise<WebpayResult> {
  if (!attemptId) return unavailableWebpayResult()

  return sdk.client
    .fetch<{ result: WebpayResult }>(
      `/store/webpay/results/${encodeURIComponent(attemptId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    )
    .then(({ result }) => result)
    .catch(() => unavailableWebpayResult())
}
