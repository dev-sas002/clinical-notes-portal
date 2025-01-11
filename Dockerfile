# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 - dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

COPY Test-frontend/care-notes-app/package.json Test-frontend/care-notes-app/package-lock.json ./
# --ignore-scripts keeps Playwright from downloading browsers into the image.
RUN npm ci --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2 - build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# Only needed so the build can construct the config; the running container
# supplies its own secret.
ENV SESSION_SECRET=build-time-placeholder-secret

COPY --from=deps /app/node_modules ./node_modules
COPY Test-frontend/care-notes-app/ ./

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 - runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Seeded, synthetic data so the app is populated on first boot. Point this at
# "http" and set CARE_NOTES_API_URL to use the real FastAPI backend.
ENV CARE_NOTES_DATA_SOURCE=demo

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# `output: "standalone"` produces a self-contained server: no build tooling
# and no full node_modules tree ship in this image.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
