# ─── Stage 1: Build React frontend ───────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Root deps (express, mongodb — needed for the build step to resolve imports)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Frontend deps
COPY client/package*.json ./client/
RUN cd client && npm ci --no-audit --no-fund

# Build
COPY client/ ./client/
RUN cd client && npm run build
# Output lands in /app/client-dist (vite.config outDir is ../client-dist)


# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# App source
COPY server.js config.default.json ./

# React build from stage 1
COPY --from=builder /app/client-dist ./client-dist

ENV NODE_ENV=production \
    PORT=3000 \
    MONGO_URL="mongodb://mongo:27017/" \
    MONGO_DB="apileela"

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
