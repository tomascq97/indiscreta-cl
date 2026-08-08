# syntax=docker/dockerfile:1

# ============================================================
# ETAPA 1: compilación
# ============================================================
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Valores no sensibles utilizados solamente durante la compilación.
ENV NODE_ENV="development"
ENV DATABASE_URL="postgres://build:build@127.0.0.1:5432/build"
ENV STORE_CORS="http://localhost:8000"
ENV ADMIN_CORS="http://localhost:9000"
ENV AUTH_CORS="http://localhost:8000,http://localhost:9000"
ENV JWT_SECRET="docker-build-placeholder"
ENV COOKIE_SECRET="docker-build-placeholder"
ENV STOREFRONT_URL="https://indiscreta.cl"

WORKDIR /app

RUN npm install --global pnpm@10.11.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @dtc/backend build

RUN mkdir -p /production/server \
    && cp -a /app/apps/backend/.medusa/server/. /production/server/

WORKDIR /production/server

RUN pnpm install \
    --prod \
    --offline \
    --no-frozen-lockfile \
    --config.recursive-install=false

RUN test -x node_modules/.bin/medusa

# ============================================================
# ETAPA 2: ejecución en producción
# ============================================================
FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV PORT="9000"

WORKDIR /app

RUN npm install --global pnpm@10.11.1

COPY --from=builder --chown=node:node /production/server /app

USER node

EXPOSE 9000

CMD ["pnpm", "start"]
