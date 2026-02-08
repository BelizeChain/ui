# ── Stage 1: Install dependencies ────────────────────────
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json* turbo.json ./

# Copy workspace package.json files
COPY shared/package.json ./shared/
COPY blue-hole-portal/package.json ./blue-hole-portal/
COPY maya-wallet/package.json ./maya-wallet/

RUN npm ci

# ── Stage 2: Build targeted workspace only ───────────────
FROM node:18-alpine AS builder
WORKDIR /app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build only the target app and its dependencies (shared)
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILDING=true
RUN npx turbo run build --filter=${APP_NAME}...

# ── Stage 3a: blue-hole-portal runner ────────────────────
FROM node:18-alpine AS portal
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built portal app (standalone output includes server.js)
COPY --from=builder /app/blue-hole-portal/.next/standalone ./
COPY --from=builder /app/blue-hole-portal/.next/static ./blue-hole-portal/.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "blue-hole-portal/server.js"]

# ── Stage 3b: maya-wallet runner ─────────────────────────
FROM node:18-alpine AS wallet
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built wallet app
COPY --from=builder /app/maya-wallet/.next/standalone ./
COPY --from=builder /app/maya-wallet/.next/static ./maya-wallet/.next/static
COPY --from=builder /app/maya-wallet/public ./maya-wallet/public

USER nextjs
EXPOSE 3001
CMD ["node", "maya-wallet/server.js"]

# ── Default target: portal ───────────────────────────────
FROM portal
