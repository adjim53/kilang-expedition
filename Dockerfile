# Kilang Expedition 2026 — production image.
# Runs on any Docker host with a persistent volume (Render, Railway, Fly.io, a VPS).
# The SQLite database lives in /data — mount a volume there or registrations are lost on redeploy.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Only used for page metadata baked at build time; everything else is read at runtime.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY . .
# node_modules keeps dev tools: the entrypoint uses the prisma CLI and tsx.
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data && chown node:node /data
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    DATABASE_URL=file:/data/kilang.db

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma/schema.prisma /app/prisma/seed.ts ./prisma/
COPY --from=build --chown=node:node /app/src/data ./src/data
COPY --from=build --chown=node:node /app/src/lib/prisma.ts ./src/lib/prisma.ts
COPY --chown=node:node docker-entrypoint.sh ./

USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
