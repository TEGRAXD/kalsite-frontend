# ============================================================
# Stage 1: Build
# ============================================================
FROM oven/bun:1.4 AS builder

WORKDIR /usr/src/kalsite-frontend

# Copy package manifests
COPY package.json bun.lock ./

# Install dependencies
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Copy application source
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ARG NEXT_PUBLIC_SYSTEM_NAME=ZOOT
ENV NEXT_PUBLIC_SYSTEM_NAME=$NEXT_PUBLIC_SYSTEM_NAME

ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js production bundle
RUN bun run build

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM oven/bun:1.4

WORKDIR /usr/src/kalsite-frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy built app, public assets, and dependencies
COPY --from=builder /usr/src/kalsite-frontend/.next ./.next
COPY --from=builder /usr/src/kalsite-frontend/public ./public
COPY --from=builder /usr/src/kalsite-frontend/package.json ./package.json
COPY --from=builder /usr/src/kalsite-frontend/next.config.ts ./next.config.ts
COPY --from=builder /usr/src/kalsite-frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "start"]
