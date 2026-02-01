FROM node:20-slim AS base

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-slim AS production
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/dist ./dist
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Set resource-aware defaults
ENV NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 8006
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD curl -f http://localhost:8006/health || exit 1
USER appuser
CMD ["node", "dist/index.js"]
