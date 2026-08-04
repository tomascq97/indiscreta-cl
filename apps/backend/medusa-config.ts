import { loadEnv, defineConfig } from "@medusajs/framework/utils";

import { validateBackendEnvironment } from "./src/lib/env";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const environment = validateBackendEnvironment(process.env);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: environment.DATABASE_URL,
    http: {
      storeCors: environment.STORE_CORS,
      adminCors: environment.ADMIN_CORS,
      authCors: environment.AUTH_CORS,
      jwtSecret: environment.JWT_SECRET,
      cookieSecret: environment.COOKIE_SECRET,
    },
  },
});
