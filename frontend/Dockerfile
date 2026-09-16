# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for a Next.js 16 app using "output: standalone".
# Stages keep the final image small: we build with all dev deps, then copy
# only the standalone server + static assets into a slim runtime image.
# ---------------------------------------------------------------------------

# 1) deps: install dependencies (cached unless package files change)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) builder: build the production app
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Skip Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) runner: minimal image that only runs the compiled app
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for better security.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the standalone server output and the static/public assets.
# (standalone does NOT include public/ or .next/static by default.)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js is emitted by the standalone build.
CMD ["node", "server.js"]
