# ── Stage 1: Install dependencies ────────────────────────
FROM node:24-alpine AS deps
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
FROM node:24-alpine AS builder
WORKDIR /app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ARG NEXT_PUBLIC_BLOCKCHAIN_WS
ARG NEXT_PUBLIC_BLOCKCHAIN_RPC
ARG NEXT_PUBLIC_IPFS_GATEWAY
ARG NEXT_PUBLIC_KINICH_API
ARG NEXT_PUBLIC_PAKIT_API
ARG NEXT_PUBLIC_NAWAL_API
ARG NEXT_PUBLIC_NETWORK_NAME
ARG NEXT_PUBLIC_DALLA_CONTRACT
ARG NEXT_PUBLIC_BELI_NFT_CONTRACT
ARG NEXT_PUBLIC_DAO_CONTRACT
ARG NEXT_PUBLIC_FAUCET_CONTRACT
ENV NEXT_PUBLIC_BLOCKCHAIN_WS=${NEXT_PUBLIC_BLOCKCHAIN_WS}
ENV NEXT_PUBLIC_BLOCKCHAIN_RPC=${NEXT_PUBLIC_BLOCKCHAIN_RPC}
ENV NEXT_PUBLIC_IPFS_GATEWAY=${NEXT_PUBLIC_IPFS_GATEWAY}
ENV NEXT_PUBLIC_KINICH_API=${NEXT_PUBLIC_KINICH_API}
ENV NEXT_PUBLIC_PAKIT_API=${NEXT_PUBLIC_PAKIT_API}
ENV NEXT_PUBLIC_NAWAL_API=${NEXT_PUBLIC_NAWAL_API}
ENV NEXT_PUBLIC_NETWORK_NAME=${NEXT_PUBLIC_NETWORK_NAME}
ENV NEXT_PUBLIC_DALLA_CONTRACT=${NEXT_PUBLIC_DALLA_CONTRACT}
ENV NEXT_PUBLIC_BELI_NFT_CONTRACT=${NEXT_PUBLIC_BELI_NFT_CONTRACT}
ENV NEXT_PUBLIC_DAO_CONTRACT=${NEXT_PUBLIC_DAO_CONTRACT}
ENV NEXT_PUBLIC_FAUCET_CONTRACT=${NEXT_PUBLIC_FAUCET_CONTRACT}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build only the target app and its dependencies (shared)
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILDING=true
RUN npx turbo run build --filter=${APP_NAME}...

# ── Stage 3a: blue-hole-portal runner ────────────────────
FROM node:24-alpine AS portal
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
FROM node:24-alpine AS wallet
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
