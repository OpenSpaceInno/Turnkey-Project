# ==============================================================================
# Kanak TurnKey — Production Full-Stack Container (Frontend SPA + Backend API)
# ==============================================================================

# ─── Stage 1: Build Application ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy repository files (filtered by .dockerignore)
COPY . .

# Install dependencies across all workspace packages
RUN pnpm install --frozen-lockfile

# Build Backend API Server and Frontend React SPA
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/kanak-turnkey run build

# ─── Stage 2: Lean Production Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for Coolify / Docker healthchecks
RUN apk add --no-cache curl

# Copy root workspace and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/deploy ./deploy

# Copy compiled backend API server
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=builder /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# Copy compiled frontend React SPA static files
COPY --from=builder /app/artifacts/kanak-turnkey/dist/public ./public
COPY --from=builder /app/artifacts/kanak-turnkey/dist/public ./artifacts/kanak-turnkey/dist/public

# Setup persistent uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 3000

# Coolify / Docker healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
