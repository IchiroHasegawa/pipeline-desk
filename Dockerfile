# Production image for Production OS (pipeline-desk), self-hosted.
# Build via docker-compose.prod.yml, which supplies the build args below.
#
# NEXT_PUBLIC_* values are inlined by Next at BUILD time, so they must arrive
# as build args, not just runtime env. The two PRODUCTION_OS_TEST_ACCESS_*
# values are passed at build time as well because they are read from the
# proxy (proxy.ts), and an undefined PRODUCTION_OS_TEST_ACCESS_ENABLED makes
# the staging gate fail OPEN. Baking them guarantees it fails closed.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG SUPABASE_INTERNAL_URL
ARG APP_URL
ARG PRODUCTION_OS_DEPLOYMENT_MODE
ARG PRODUCTION_OS_TEST_ACCESS_ENABLED
ARG PRODUCTION_OS_TEST_ACCESS_CODE

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    SUPABASE_INTERNAL_URL=$SUPABASE_INTERNAL_URL \
    APP_URL=$APP_URL \
    PRODUCTION_OS_DEPLOYMENT_MODE=$PRODUCTION_OS_DEPLOYMENT_MODE \
    PRODUCTION_OS_TEST_ACCESS_ENABLED=$PRODUCTION_OS_TEST_ACCESS_ENABLED \
    PRODUCTION_OS_TEST_ACCESS_CODE=$PRODUCTION_OS_TEST_ACCESS_CODE \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# server.js does not serve public/ or .next/static on its own — they are
# copied in alongside it, per the Next standalone docs.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
