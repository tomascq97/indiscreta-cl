import { getHttpTestConfiguration } from "./http-test-helpers";

type JsonObject = Record<string, unknown>;

type CommercialTestConfiguration = ReturnType<typeof getHttpTestConfiguration>;

const fail = (stage: string, endpoint: string, status?: number): never => {
  const statusDetail = status === undefined ? "" : ` status=${status}`;

  throw new Error(`stage=${stage} endpoint=${endpoint}${statusDetail}`);
};

const requireCondition: (
  condition: unknown,
  stage: string,
  endpoint: string,
) => asserts condition = (condition, stage, endpoint) => {
  if (!condition) {
    fail(stage, endpoint);
  }
};

const getCommercialTestConfiguration = (): CommercialTestConfiguration => {
  const requiredVariables = [
    "CI",
    "ALLOW_COMMERCIAL_FLOW_TEST",
    "TEST_BACKEND_URL",
    "DATABASE_URL",
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
  ] as const;
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length) {
    throw new Error(`stage=guard variables=${missingVariables.join(",")}`);
  }

  if (process.env.CI !== "true") {
    throw new Error("stage=guard variable=CI");
  }

  if (process.env.ALLOW_COMMERCIAL_FLOW_TEST !== "true") {
    throw new Error("stage=guard variable=ALLOW_COMMERCIAL_FLOW_TEST");
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(process.env.DATABASE_URL!);
  } catch {
    throw new Error("stage=guard variable=DATABASE_URL");
  }

  if (databaseUrl.pathname.replace(/^\//, "") !== "medusa_ci") {
    throw new Error("stage=guard variable=DATABASE_URL");
  }

  let configuration: CommercialTestConfiguration;

  try {
    configuration = getHttpTestConfiguration();
  } catch {
    throw new Error("stage=guard variable=TEST_BACKEND_URL");
  }

  const backendUrl = new URL(configuration.backendUrl);

  if (backendUrl.protocol !== "http:") {
    throw new Error("stage=guard variable=TEST_BACKEND_URL");
  }

  return configuration;
};

const requestJson = async <T extends JsonObject>({
  body,
  configuration,
  endpoint,
  method = "GET",
  stage,
}: {
  body?: JsonObject;
  configuration: CommercialTestConfiguration;
  endpoint: string;
  method?: "GET" | "POST";
  stage: string;
}): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${configuration.backendUrl}${endpoint}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": configuration.publishableKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return fail(stage, endpoint);
  }

  if (response.status !== 200) {
    fail(stage, endpoint, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    return fail(stage, endpoint, response.status);
  }
};

describe("commercial Store API flow", () => {
  const configuration = getCommercialTestConfiguration();

  jest.setTimeout(60_000);

  it("creates a cart and completes it as an order", async () => {
    const regionsEndpoint = "/store/regions?limit=20&fields=id%2C*countries";
    const regionsPayload = await requestJson<{
      regions?: { id?: unknown; countries?: { iso_2?: unknown }[] }[];
    }>({
      configuration,
      endpoint: regionsEndpoint,
      stage: "region",
    });
    const region = regionsPayload.regions?.find(
      (candidate) =>
        typeof candidate.id === "string" &&
        candidate.countries?.some(
          (country) => typeof country.iso_2 === "string",
        ),
    );
    const countryCode = region?.countries?.find(
      (country) => typeof country.iso_2 === "string",
    )?.iso_2;
    const regionId = region?.id;

    requireCondition(
      typeof regionId === "string" && typeof countryCode === "string",
      "region",
      regionsEndpoint,
    );

    const productsEndpoint = `/store/products?limit=100&country_code=${encodeURIComponent(
      countryCode,
    )}&fields=id%2C*variants%2C%2Bvariants.inventory_quantity`;
    const productsPayload = await requestJson<{
      products?: {
        variants?: { id?: unknown; inventory_quantity?: unknown }[];
      }[];
    }>({
      configuration,
      endpoint: productsEndpoint,
      stage: "product",
    });
    const variant = productsPayload.products
      ?.flatMap((product) => product.variants ?? [])
      .find(
        (candidate) =>
          typeof candidate.id === "string" &&
          typeof candidate.inventory_quantity === "number" &&
          candidate.inventory_quantity > 0,
      );

    requireCondition(
      variant && typeof variant.id === "string",
      "product",
      productsEndpoint,
    );
    const variantId = variant.id;

    const cartsEndpoint = "/store/carts";
    const cartPayload = await requestJson<{ cart?: { id?: unknown } }>({
      body: { region_id: regionId },
      configuration,
      endpoint: cartsEndpoint,
      method: "POST",
      stage: "cart",
    });
    const cartId = cartPayload.cart?.id;

    requireCondition(typeof cartId === "string", "cart", cartsEndpoint);

    const lineItemsEndpoint = `/store/carts/${cartId}/line-items`;
    const lineItemsPayload = await requestJson<{
      cart?: {
        items?: { id?: unknown; quantity?: unknown; variant_id?: unknown }[];
      };
    }>({
      body: { variant_id: variantId, quantity: 1 },
      configuration,
      endpoint: lineItemsEndpoint,
      method: "POST",
      stage: "line-item",
    });
    const addedLine = lineItemsPayload.cart?.items?.find(
      (item) => item.variant_id === variantId,
    );

    requireCondition(
      typeof addedLine?.id === "string" && addedLine.quantity === 1,
      "line-item",
      lineItemsEndpoint,
    );

    const email = `p1.4-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@example.invalid`;
    const address = {
      first_name: "CI",
      last_name: "Checkout",
      address_1: "1 Test Street",
      city: "Copenhagen",
      postal_code: "1000",
      country_code: countryCode,
      phone: "+4500000000",
    };
    const updateCartEndpoint = `/store/carts/${cartId}`;
    const updatedCartPayload = await requestJson<{
      cart?: {
        billing_address?: { country_code?: unknown };
        email?: unknown;
        shipping_address?: { country_code?: unknown };
      };
    }>({
      body: {
        billing_address: address,
        email,
        shipping_address: address,
      },
      configuration,
      endpoint: updateCartEndpoint,
      method: "POST",
      stage: "addresses",
    });

    requireCondition(
      updatedCartPayload.cart?.email === email &&
        updatedCartPayload.cart.shipping_address?.country_code ===
          countryCode &&
        updatedCartPayload.cart.billing_address?.country_code === countryCode,
      "addresses",
      updateCartEndpoint,
    );

    const shippingOptionsEndpoint = `/store/shipping-options?cart_id=${encodeURIComponent(
      cartId,
    )}`;
    const shippingOptionsPayload = await requestJson<{
      shipping_options?: { id?: unknown }[];
    }>({
      configuration,
      endpoint: shippingOptionsEndpoint,
      stage: "shipping-options",
    });
    const shippingOption = shippingOptionsPayload.shipping_options?.find(
      (option) => typeof option.id === "string",
    );

    requireCondition(
      shippingOption && typeof shippingOption.id === "string",
      "shipping-options",
      shippingOptionsEndpoint,
    );
    const shippingOptionId = shippingOption.id;

    const shippingMethodEndpoint = `/store/carts/${cartId}/shipping-methods`;
    const shippingMethodPayload = await requestJson<{
      cart?: { shipping_methods?: { shipping_option_id?: unknown }[] };
    }>({
      body: { option_id: shippingOptionId },
      configuration,
      endpoint: shippingMethodEndpoint,
      method: "POST",
      stage: "shipping-method",
    });

    requireCondition(
      shippingMethodPayload.cart?.shipping_methods?.some(
        (method) => method.shipping_option_id === shippingOptionId,
      ),
      "shipping-method",
      shippingMethodEndpoint,
    );

    const paymentProvidersEndpoint = `/store/payment-providers?region_id=${encodeURIComponent(
      regionId,
    )}`;
    const paymentProvidersPayload = await requestJson<{
      payment_providers?: { id?: unknown }[];
    }>({
      configuration,
      endpoint: paymentProvidersEndpoint,
      stage: "payment-provider",
    });
    const paymentProvider = paymentProvidersPayload.payment_providers?.find(
      (provider) => provider.id === "pp_system_default",
    );

    requireCondition(
      paymentProvider && typeof paymentProvider.id === "string",
      "payment-provider",
      paymentProvidersEndpoint,
    );
    const paymentProviderId = paymentProvider.id;

    const paymentCollectionsEndpoint = "/store/payment-collections";
    const paymentCollectionPayload = await requestJson<{
      payment_collection?: { id?: unknown };
    }>({
      body: { cart_id: cartId },
      configuration,
      endpoint: paymentCollectionsEndpoint,
      method: "POST",
      stage: "payment-collection",
    });
    const paymentCollectionId = paymentCollectionPayload.payment_collection?.id;

    requireCondition(
      typeof paymentCollectionId === "string",
      "payment-collection",
      paymentCollectionsEndpoint,
    );

    const paymentSessionEndpoint = `/store/payment-collections/${paymentCollectionId}/payment-sessions`;
    const paymentSessionPayload = await requestJson<{
      payment_collection?: {
        payment_sessions?: { provider_id?: unknown; status?: unknown }[];
      };
    }>({
      body: { provider_id: paymentProviderId },
      configuration,
      endpoint: paymentSessionEndpoint,
      method: "POST",
      stage: "payment-session",
    });

    requireCondition(
      paymentSessionPayload.payment_collection?.payment_sessions?.some(
        (session) =>
          session.provider_id === paymentProviderId &&
          session.status === "pending",
      ),
      "payment-session",
      paymentSessionEndpoint,
    );

    const completeCartEndpoint = `/store/carts/${cartId}/complete?fields=id%2Cemail%2Ctotal%2C*items`;
    const completeCartPayload = await requestJson<{
      order?: {
        email?: unknown;
        id?: unknown;
        items?: { quantity?: unknown; variant_id?: unknown }[];
        total?: unknown;
      };
      type?: unknown;
    }>({
      configuration,
      endpoint: completeCartEndpoint,
      method: "POST",
      stage: "complete-cart",
    });

    requireCondition(
      completeCartPayload.type === "order" &&
        typeof completeCartPayload.order?.id === "string" &&
        completeCartPayload.order.email === email &&
        typeof completeCartPayload.order.total === "number" &&
        completeCartPayload.order.items?.some(
          (item) => item.variant_id === variantId && item.quantity === 1,
        ),
      "complete-cart",
      completeCartEndpoint,
    );
  });
});
