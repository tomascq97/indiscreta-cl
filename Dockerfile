# syntax=docker/dockerfile:1

# ============================================================
# Etapa 1: dependencias y compilación del monorepo
# ============================================================
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"

WORKDIR /app

# Versión utilizada por el monorepo.
RUN npm install --global pnpm@10.11.1

# Copiamos primero los manifiestos para aprovechar la caché Docker.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

# Instalamos todas las dependencias necesarias para compilar.
RUN pnpm install --frozen-lockfile

# Copiamos el código fuente.
COPY . .

# Compilamos exclusivamente el backend Medusa.
RUN pnpm --filter @dtc/backend build

# Sacamos el servidor generado fuera del workspace.
# Esto evita que pnpm lo interprete como otro paquete del monorepo.
RUN mkdir -p /production/server \
    && cp -a /app/apps/backend/.medusa/server/. /production/server/

WORKDIR /production/server

# Instalamos las dependencias del servidor generado.
# --offline reutiliza el store de pnpm que ya fue poblado arriba.
# Al estar fuera de /app, no participa del workspace.
RUN pnpm install \
    --prod \
    --offline \
    --no-frozen-lockfile \
    --config.recursive-install=false

# Verificación explícita: el build debe contener el ejecutable Medusa.
RUN test -x node_modules/.bin/medusa


# ============================================================
# Etapa 2: imagen final de producción
# ============================================================
FROM node:22-bookworm-slim AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV PORT="9000"

WORKDIR /app

RUN npm install --global pnpm@10.11.1

# Copiamos el servidor compilado y sus dependencias reales.
COPY --from=builder --chown=node:node /production/server /app

USER node

EXPOSE 9000

CMD ["pnpm", "start"]
