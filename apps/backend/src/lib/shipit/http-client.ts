import { z } from "@medusajs/framework/zod";

import type { ShipitConfiguration } from "../env";
import { ShipitError } from "./errors";

const acceptedOrigins = new Set([
  "https://api.shipit.cl",
  "https://prices.shipit.cl",
  "https://courierstatus.shipit.cl",
]);

type Fetch = typeof fetch;

export class ShipitHttpClient {
  constructor(
    private readonly configuration: ShipitConfiguration,
    private readonly fetcher: Fetch = fetch,
    private readonly maxResponseBytes = 1_000_000,
  ) {}

  async request<T>(input: {
    baseUrl: string;
    path: string;
    method?: "GET" | "POST" | "PATCH" | "PUT";
    body?: unknown;
    schema: z.ZodType<T>;
  }): Promise<T> {
    const url = new URL(input.path, `${input.baseUrl}/`);
    if (!acceptedOrigins.has(url.origin) || !url.pathname.startsWith("/v/")) {
      throw new ShipitError("CONFIGURATION_ERROR", "Invalid Shipit URL");
    }
    const method = input.method ?? "GET";
    const maxAttempts =
      method === "GET" ? this.configuration.readMaxRetries + 1 : 1;
    let lastError: ShipitError | undefined;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.execute({ ...input, method, url });
      } catch (error) {
        const shipitError = error as ShipitError;
        lastError = shipitError;
        const retryable =
          method === "GET" &&
          (shipitError.code === "TIMEOUT" ||
            (shipitError.code === "REQUEST_FAILED" &&
              (!shipitError.status ||
                shipitError.status === 429 ||
                shipitError.status >= 500)));
        if (!retryable || attempt === maxAttempts - 1) throw shipitError;
      }
    }
    throw lastError!;
  }

  private async execute<T>(input: {
    url: URL;
    method: "GET" | "POST" | "PATCH" | "PUT";
    body?: unknown;
    schema: z.ZodType<T>;
  }): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.configuration.timeoutMs,
    );
    try {
      const response = await this.fetcher(input.url, {
        method: input.method,
        headers: {
          Accept: "application/vnd.shipit.v4",
          "Content-Type": "application/json",
          "X-Shipit-Email": this.configuration.email,
          "X-Shipit-Access-Token": this.configuration.accessToken,
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ShipitError(
          "REQUEST_FAILED",
          `Shipit request failed with status ${response.status}`,
          response.status,
        );
      }
      const length = Number(response.headers.get("content-length"));
      if (Number.isFinite(length) && length > this.maxResponseBytes) {
        throw new ShipitError(
          "RESPONSE_TOO_LARGE",
          "Shipit response too large",
        );
      }
      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > this.maxResponseBytes) {
        throw new ShipitError(
          "RESPONSE_TOO_LARGE",
          "Shipit response too large",
        );
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new ShipitError(
          "INVALID_RESPONSE",
          "Invalid Shipit JSON response",
        );
      }
      const parsed = input.schema.safeParse(json);
      if (!parsed.success) {
        throw new ShipitError("INVALID_RESPONSE", "Invalid Shipit response");
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof ShipitError) throw error;
      if ((error as Error)?.name === "AbortError") {
        throw new ShipitError("TIMEOUT", "Shipit request timed out");
      }
      throw new ShipitError("REQUEST_FAILED", "Shipit request failed");
    } finally {
      clearTimeout(timeout);
    }
  }
}
