export type WebpayInitiationResponse = {
  token: string
  webpay_url: string
}

export function validateWebpayInitiationResponse(
  value: unknown,
): WebpayInitiationResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid Webpay initiation response")
  }

  const { token, webpay_url: webpayUrl } = value as Record<string, unknown>

  if (typeof token !== "string" || typeof webpayUrl !== "string") {
    throw new Error("Invalid Webpay initiation response")
  }

  const url = new URL(webpayUrl)
  if (
    url.protocol !== "https:" ||
    (url.hostname !== "transbank.cl" && !url.hostname.endsWith(".transbank.cl"))
  ) {
    throw new Error("Invalid Webpay initiation response")
  }

  return { token, webpay_url: url.toString() }
}

export function submitWebpayPost(
  response: WebpayInitiationResponse,
  documentObject: Document = document,
) {
  const validated = validateWebpayInitiationResponse(response)
  const form = documentObject.createElement("form")
  const tokenInput = documentObject.createElement("input")

  form.method = "POST"
  form.action = validated.webpay_url
  form.hidden = true
  tokenInput.type = "hidden"
  tokenInput.name = "token_ws"
  tokenInput.value = validated.token
  form.appendChild(tokenInput)
  documentObject.body.appendChild(form)
  form.submit()
  form.remove()
}

export function createSingleWebpayInitiation(
  initiate: () => Promise<unknown>,
  redirect: (response: WebpayInitiationResponse) => void,
) {
  let inFlight: Promise<void> | undefined

  return () => {
    if (!inFlight) {
      inFlight = initiate()
        .then(validateWebpayInitiationResponse)
        .then(redirect)
        .finally(() => {
          inFlight = undefined
        })
    }

    return inFlight
  }
}
