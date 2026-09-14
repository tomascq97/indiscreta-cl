import { describe, expect, it, vi } from "vitest"

import {
  createSingleWebpayInitiation,
  submitWebpayPost,
  validateWebpayInitiationResponse,
} from "../webpay-redirect"

const response = {
  token: "token-01",
  webpay_url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
}

describe("Webpay redirect", () => {
  it("accepts a valid backend response", () => {
    expect(validateWebpayInitiationResponse(response)).toEqual(response)
  })

  it.each([
    [null],
    [{}],
    [{ token: "token-01" }],
    [{ token: "token-01", webpay_url: "https://example.com/pay" }],
  ])("rejects an invalid backend response", (value) => {
    expect(() => validateWebpayInitiationResponse(value)).toThrow()
  })

  it("submits exactly one initiation for simultaneous interactions", async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    const initiate = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )
    const redirect = vi.fn()
    const run = createSingleWebpayInitiation(initiate, redirect)

    const first = run()
    const second = run()
    resolveRequest?.(response)
    await Promise.all([first, second])

    expect(initiate).toHaveBeenCalledTimes(1)
    expect(redirect).toHaveBeenCalledOnce()
  })

  it("surfaces initiation errors and allows a later retry", async () => {
    const initiate = vi
      .fn()
      .mockRejectedValueOnce(new Error("backend unavailable"))
      .mockResolvedValueOnce(response)
    const redirect = vi.fn()
    const run = createSingleWebpayInitiation(initiate, redirect)

    await expect(run()).rejects.toThrow("backend unavailable")
    await expect(run()).resolves.toBeUndefined()

    expect(initiate).toHaveBeenCalledTimes(2)
    expect(redirect).toHaveBeenCalledOnce()
  })

  it("constructs and submits a hidden POST form with token_ws", () => {
    const input = {} as HTMLInputElement
    const form = {
      appendChild: vi.fn(),
      submit: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLFormElement
    const documentObject = {
      createElement: vi
        .fn()
        .mockReturnValueOnce(form)
        .mockReturnValueOnce(input),
      body: { appendChild: vi.fn() },
    } as unknown as Document

    submitWebpayPost(response, documentObject)

    expect(form.method).toBe("POST")
    expect(form.action).toBe(response.webpay_url)
    expect(input).toMatchObject({
      type: "hidden",
      name: "token_ws",
      value: "token-01",
    })
    expect(form.submit).toHaveBeenCalledOnce()
    expect(form.remove).toHaveBeenCalledOnce()
  })
})
