import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

import { validateBackendEnvironment } from "../../../../lib/env";
import { processWebpayReturnWorkflow } from "../../../../workflows/process-webpay-return";
import {
  GET,
  normalizeWebpayReturnParameters,
  POST,
} from "../route";

jest.mock("../../../../lib/env", () => ({
  validateBackendEnvironment: jest.fn(),
}));
jest.mock("../../../../workflows/process-webpay-return", () => ({
  processWebpayReturnWorkflow: jest.fn(),
}));

const validateEnvironment = validateBackendEnvironment as jest.Mock;
const returnWorkflow = processWebpayReturnWorkflow as unknown as jest.Mock;

function response() {
  return { status: jest.fn(), json: jest.fn(), redirect: jest.fn() };
}

function request(input: {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}) {
  return {
    ...input,
    originalUrl: "/webpay/return?token_ws=token-secret&extra=ignored",
    url: "/webpay/return?token_ws=token-secret&extra=ignored",
    scope: {},
  } as unknown as MedusaRequest;
}

beforeEach(() => {
  jest.clearAllMocks();
  validateEnvironment.mockReturnValue({
    WEBPAY: { resultUrl: "http://localhost:8000/cl/webpay/result" },
  });
  returnWorkflow.mockReturnValue({
    run: jest.fn().mockResolvedValue({ result: { id: "wpa_opaque" } }),
  });
});

describe("Webpay return parameter normalization", () => {
  it("allow-lists only the documented fields", () => {
    expect(
      normalizeWebpayReturnParameters({
        token_ws: "token-secret",
        TBK_TOKEN: "tbk-token",
        TBK_ORDEN_COMPRA: "buy-order",
        TBK_ID_SESION: "session-id",
        extra: "ignored",
      }),
    ).toEqual({
      token_ws: "token-secret",
      TBK_TOKEN: "tbk-token",
      TBK_ORDEN_COMPRA: "buy-order",
      TBK_ID_SESION: "session-id",
    });
  });

  it("ignores arrays and non-string query values", () => {
    expect(
      normalizeWebpayReturnParameters({ token_ws: ["token-secret"] }),
    ).toEqual({
      token_ws: undefined,
      TBK_TOKEN: undefined,
      TBK_ORDEN_COMPRA: undefined,
      TBK_ID_SESION: undefined,
    });
  });
});

describe("GET /webpay/return", () => {
  it("processes the API 1.1+ token return and redirects without the token", async () => {
    const req = request({ query: { token_ws: "token-secret" } });
    const res = response();

    await GET(req, res as unknown as MedusaResponse);

    const run = returnWorkflow.mock.results[0].value.run as jest.Mock;
    expect(run).toHaveBeenCalledWith({
      input: expect.objectContaining({ token_ws: "token-secret" }),
    });
    expect(res.redirect).toHaveBeenCalledWith(
      303,
      "http://localhost:8000/cl/webpay/result?webpay_result=wpa_opaque",
    );
    expect(JSON.stringify(res.redirect.mock.calls)).not.toContain(
      "token-secret",
    );
    expect(req.originalUrl).toBe("/webpay/return");
    expect(req.url).toBe("/webpay/return");
  });

  it("normalizes the documented abort fields", async () => {
    const req = request({
      query: {
        TBK_TOKEN: "tbk-token",
        TBK_ORDEN_COMPRA: "buy-order",
        TBK_ID_SESION: "session-id",
      },
    });
    const res = response();

    await GET(req, res as unknown as MedusaResponse);

    expect(returnWorkflow.mock.results[0].value.run).toHaveBeenCalledWith({
      input: {
        token_ws: undefined,
        TBK_TOKEN: "tbk-token",
        TBK_ORDEN_COMPRA: "buy-order",
        TBK_ID_SESION: "session-id",
      },
    });
  });

  it("handles the documented empty timeout as unavailable", async () => {
    returnWorkflow.mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error("invalid empty return")),
    });
    const res = response();

    await GET(request({ query: {} }), res as unknown as MedusaResponse);

    expect(res.redirect).toHaveBeenCalledWith(
      303,
      "http://localhost:8000/cl/webpay/result?webpay_result=unavailable",
    );
  });

  it.each([
    ["unknown token", { token_ws: "unknown" }],
    ["no valid documented parameters", { extra: "ignored" }],
  ])("sanitizes %s failures", async (_name, query) => {
    returnWorkflow.mockReturnValue({
      run: jest.fn().mockRejectedValue(new Error("not found")),
    });
    const res = response();

    await GET(request({ query }), res as unknown as MedusaResponse);

    expect(res.redirect).toHaveBeenCalledWith(
      303,
      "http://localhost:8000/cl/webpay/result?webpay_result=unavailable",
    );
  });

  it("delegates concurrent duplicate GETs to the idempotent processor", async () => {
    const run = jest.fn().mockResolvedValue({ result: { id: "wpa_opaque" } });
    returnWorkflow.mockReturnValue({ run });

    await Promise.all([
      GET(
        request({ query: { token_ws: "token-secret" } }),
        response() as unknown as MedusaResponse,
      ),
      GET(
        request({ query: { token_ws: "token-secret" } }),
        response() as unknown as MedusaResponse,
      ),
    ]);

    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("POST /webpay/return compatibility", () => {
  it("uses the same normalizer and processor as GET", async () => {
    const res = response();

    await POST(
      request({ body: { token_ws: "token-secret", extra: "ignored" } }),
      res as unknown as MedusaResponse,
    );

    expect(returnWorkflow.mock.results[0].value.run).toHaveBeenCalledWith({
      input: {
        token_ws: "token-secret",
        TBK_TOKEN: undefined,
        TBK_ORDEN_COMPRA: undefined,
        TBK_ID_SESION: undefined,
      },
    });
    expect(res.redirect).toHaveBeenCalledWith(
      303,
      "http://localhost:8000/cl/webpay/result?webpay_result=wpa_opaque",
    );
  });
});
