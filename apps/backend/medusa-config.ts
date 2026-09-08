import { loadEnv, defineConfig } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "./src/lib/env";
import { buildFileModule } from "./src/lib/file-module";
import { buildRedisModules } from "./src/lib/redis-modules";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const environment = validateBackendEnvironment(process.env);
const fileModule = buildFileModule(environment.S3);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: environment.DATABASE_URL,
    workerMode: environment.MEDUSA_WORKER_MODE,
    http: {
      storeCors: environment.STORE_CORS,
      adminCors: environment.ADMIN_CORS,
      authCors: environment.AUTH_CORS,
      jwtSecret: environment.JWT_SECRET,
      cookieSecret: environment.COOKIE_SECRET,
      authVerificationsPerActor: {
        customer: [
          {
            entity_type: "email",
            auth_provider: "emailpass",
          },
        ],
      },
    },
  },
  admin: {
    storefrontUrl: process.env.STOREFRONT_URL || "http://localhost:8000/cl",
  },
  modules: [
    ...buildRedisModules(environment.REDIS_URL),
    ...(fileModule ? [fileModule] : []),
    {
      resolve: "./src/modules/webpay",
    },
    {
      resolve: "./src/modules/shipit",
    },
    ...(environment.SHIPIT
      ? [
          {
            resolve: "@medusajs/medusa/fulfillment",
            options: {
              providers: [
                {
                  resolve: "./src/modules/shipit-fulfillment",
                  id: "shipit",
                },
              ],
            },
          },
        ]
      : []),
    ...(environment.WEBPAY
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "./src/modules/webpay-payment",
                  id: "webpay",
                },
              ],
            },
          },
        ]
      : []),
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/resend",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
            },
          },
        ],
      },
    },
  ],
});
