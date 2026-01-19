# FamousPeople.id Deployment Guide

## 1. Infrastructure Diagram

```
                                    CLOUDFLARE EDGE
    +------------------------------------------------------------------+
    |                                                                  |
    |   [User] --> [CF DNS] --> [CF Pages] --> [Next.js Edge Runtime]  |
    |                  |                              |                |
    |                  |         [KV Cache] <--------+                |
    |                  |                              |                |
    |                  +---> [CF Tunnel] -------------+                |
    |                              |                                   |
    +------------------------------|-----------------------------------+
                                   |
                                   | (Encrypted)
                                   v
    +------------------------------------------------------------------+
    |                        VPS 107.174.42.198                        |
    |                                                                  |
    |   [cloudflared] --> [Docker: famouspeople-api] --> [Supabase]   |
    |        :8100              :8006                    (external)    |
    |                              |                                   |
    |                              +---> [supabase_default network]    |
    |                                                                  |
    +------------------------------------------------------------------+
                                   |
                                   v
    +------------------------------------------------------------------+
    |                    SUPABASE (Managed)                            |
    |   [identities] [relationships] [relation_types]                  |
    |   PostgreSQL + pgvector + pg_trgm + Connection Pooler (:6543)   |
    +------------------------------------------------------------------+
```

## 2. Cloudflare Setup

### 2.1 Pages Project Configuration

```bash
# Connect GitHub repo to Cloudflare Pages
# Dashboard: Pages > Create project > Connect to Git

# Build settings:
Build command: pnpm build
Build output directory: .next
Root directory: /
Node.js version: 20
```

**wrangler.toml** (for local development):

```toml
name = "famouspeople-id"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Pages configuration
pages_build_output_dir = ".next"

# KV Namespace bindings
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyy"

# Environment variables (non-secret)
[vars]
NEXT_PUBLIC_API_URL = "https://api.famouspeople.id"
NEXT_PUBLIC_SITE_URL = "https://famouspeople.id"

# Production environment
[env.production]
vars = { NODE_ENV = "production" }

[env.production.kv_namespaces]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 2.2 Custom Domain & SSL

```bash
# Dashboard: Pages > famouspeople-id > Custom domains

# Add domains:
famouspeople.id
www.famouspeople.id

# SSL mode: Full (strict)
# Always Use HTTPS: ON
# Minimum TLS Version: 1.2
```

### 2.3 KV Namespace Creation

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# Bind to Pages project in dashboard:
# Pages > Settings > Functions > KV namespace bindings
```

### 2.4 Tunnel Setup (cloudflared)

**On VPS** (`/opt/docker-projects/cloudflare-tunnel/famouspeople/`):

**docker-compose.yml**:

```yaml
version: "3.8"

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: famouspeople-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - proxy-tier

networks:
  proxy-tier:
    external: true
    name: nginx-proxy_default
```

**Tunnel configuration** (Cloudflare Dashboard > Zero Trust > Tunnels):

```yaml
# Public hostname: api.famouspeople.id
# Service: http://famouspeople-api:8006
# Additional settings:
#   - No TLS Verify: false
#   - HTTP2 Origin: true
```

### 2.5 Cache Rules

**Page Rules** (Dashboard > Rules > Page Rules):

```
# Static assets - aggressive caching
famouspeople.id/static/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
  Browser Cache TTL: 1 year

# API responses - short cache
api.famouspeople.id/v1/identities/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 hour

# Search - no cache
api.famouspeople.id/v1/search*
  Cache Level: Bypass
```

**Cache API usage** (in Next.js Edge):

```typescript
// lib/cache.ts
export async function getCachedIdentity(slug: string, env: Env) {
  const cacheKey = `identity:${slug}`;

  // Try KV first
  const cached = await env.CACHE.get(cacheKey, "json");
  if (cached) return cached;

  // Fetch from API
  const data = await fetch(`${env.API_URL}/v1/identities/${slug}`);
  const identity = await data.json();

  // Cache for 1 hour
  await env.CACHE.put(cacheKey, JSON.stringify(identity), {
    expirationTtl: 3600,
  });

  return identity;
}
```

## 3. VPS Docker Setup

### 3.1 Dockerfile for API

**`/opt/docker-projects/heavy-tasks/famouspeople.id/api/Dockerfile`**:

```dockerfile
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/dist ./dist
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

EXPOSE 8006
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:8006/health || exit 1
CMD ["node", "dist/index.js"]
```

**api/package.json** (key dependencies):

```json
{
  "dependencies": {
    "hono": "^4.x",
    "@hono/node-server": "^1.x",
    "@supabase/supabase-js": "^2.x",
    "pg": "^8.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "tsx": "^4.x"
  }
}
```

### 3.2 docker-compose.yml

**`/opt/docker-projects/heavy-tasks/famouspeople.id/docker-compose.yml`**:

```yaml
version: "3.8"

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: famouspeople-api
    restart: unless-stopped
    ports:
      - "3027:8006"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - DATABASE_SCHEMA=${DATABASE_SCHEMA:-public}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://famouspeople.id}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - PORT=8006
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8006/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - proxy-tier
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Data sync worker (runs on schedule, not always-on)
  sync-worker:
    build:
      context: .
      dockerfile: Dockerfile.sync
    container_name: famouspeople-sync
    profiles:
      - sync
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./00-People:/app/00-People:ro
    networks:
      - proxy-tier

networks:
  proxy-tier:
    external: true
    name: nginx-proxy_default
```

### 3.3 Environment Variables

**api/.env.example**:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database Connection Pooling
# IMPORTANT: Use port 6543 for Supabase connection pooler (Transaction Mode)
# This is REQUIRED for serverless/edge environments to avoid connection limits
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres

# Alternative: Direct connection (port 5432) - NOT recommended for production
# DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

DATABASE_SCHEMA=public

# API Configuration
PORT=8006
ALLOWED_ORIGINS=https://famouspeople.id,https://www.famouspeople.id
LOG_LEVEL=info
SITE_URL=https://famouspeople.id

# Optional: Rate limiting with Upstash Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Optional: OpenAI embeddings for similarity search
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

### 3.5 Image Storage (Cloudflare R2)

**Why R2 over Cloudflare Images:**
- Cloudflare Images: $5/month per 100k images (gets expensive at scale)
- R2: $0.015/GB storage, $0 egress, practically free for our use case

**R2 Bucket Setup:**

```bash
# Create bucket
wrangler r2 bucket create famouspeople-images

# Bind to Pages in wrangler.toml:
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "famouspeople-images"
```

**Image Worker (resize on-the-fly):**

```typescript
// functions/images/[...path].ts
export async function onRequest({ params, env }) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const width = parseInt(url.searchParams.get('w') || '800');

  // Try cache first
  const cacheKey = `image:${path}:${width}`;
  const cached = await env.CACHE.get(cacheKey, 'arrayBuffer');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000' }
    });
  }

  // Fetch from R2
  const object = await env.IMAGES.get(path);
  if (!object) return new Response('Not found', { status: 404 });

  // Resize using Cloudflare Image Resizing (built-in)
  const resized = await fetch(`https://famouspeople.id/cdn-cgi/image/width=${width},format=webp/${path}`);

  // Cache for 1 year
  const buffer = await resized.arrayBuffer();
  await env.CACHE.put(cacheKey, buffer, { expirationTtl: 31536000 });

  return new Response(buffer, {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000' }
  });
}
```

**OG Image Caching Strategy:**

```typescript
// CRITICAL: Cache OG images to R2 after generation
// Don't regenerate on every request (expensive CPU)

async function getOrGenerateOGImage(slug: string, env: Env) {
  const key = `og/${slug}.png`;

  // Check R2 first
  const existing = await env.IMAGES.get(key);
  if (existing) return existing.body;

  // Generate (expensive)
  const ogImage = await generateOGImage(slug);

  // Store in R2 for future requests
  await env.IMAGES.put(key, ogImage);

  return ogImage;
}
```

### 3.4 Health Checks & Restart Policies

```yaml
# In docker-compose.yml (already included above)
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8006/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Timeout after 10 seconds
  retries: 3         # Retry 3 times before marking unhealthy
  start_period: 10s  # Wait 10s before first check

restart: unless-stopped  # Restart unless explicitly stopped
```

### 3.5 Frontend SEO Features

The frontend includes comprehensive SEO optimizations:

**Structured Data (Schema.org)**:
- `Person` schema for profile pages with full biographical data
- `FAQPage` schema with dynamically generated questions and answers
- `BreadcrumbList` schema for navigation hierarchy
- `ItemList` schema for category pages (zodiac, MBTI, occupation)
- `WebSite` schema with search action

**Meta Optimization**:
- Dynamic meta descriptions tailored to page content
- Optimized titles including name, net worth, height, age
- Open Graph tags for social sharing
- Canonical URLs with pagination support (prev/next links)
- Robots meta tags based on fame tier release status

**robots.txt Configuration**:
```typescript
// web/app/robots.ts
{
  rules: [
    { userAgent: '*', allow: '/', disallow: ['/api/', '/api/v1/'] },
    { userAgent: '*', disallow: ['/*?sort=', '/*?filter=', '/*?page=10'] },
    { userAgent: '*', allow: ['/*?page='] },
    { userAgent: 'AhrefsBot', crawlDelay: 10 },
    { userAgent: 'SemrushBot', crawlDelay: 10 },
  ],
  sitemap: 'https://famouspeople.id/sitemap.xml',
}
```

**Key Components**:
- `RelatedPeople` - Shows similar profiles based on vector embeddings
- `SimilarByAttribute` - Displays people with shared zodiac, MBTI, or occupation
- `FactWithCitation` - Displays facts with source links and last updated dates

### 3.6 API Testing

The API includes comprehensive test coverage:

```bash
# Run all tests
cd api
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

**Test Coverage** (218 tests):
- Integration tests: People routes, Search routes, Compare routes
- Unit tests: Identities service, Search service, Relationships service, Embeddings service
- Format utilities, Compare utilities

**Test Structure**:
```
api/tests/
├── integration/
│   └── routes/
│       ├── people.test.ts    (25 tests)
│       ├── search.test.ts    (41 tests)
│       └── compare.test.ts   (22 tests)
└── unit/
    ├── services/
    │   ├── identities.test.ts   (24 tests)
    │   ├── search.test.ts       (25 tests)
    │   ├── relationships.test.ts (16 tests)
    │   └── embeddings.test.ts   (27 tests)
    ├── compare.test.ts  (16 tests)
    └── format.test.ts   (22 tests)
```

### 3.7 Connection Pooling Configuration

Supabase connection pooling is critical for serverless environments:

**Transaction Mode (Port 6543)** - Recommended for production:
```bash
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres
```
- Best for serverless/edge functions
- Connection is returned to pool immediately after transaction
- Lower connection count, better for scaling

**Session Mode (Port 5432)** - For long-running scripts only:
```bash
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```
- Use for migrations and bulk data operations
- NOT recommended for API usage

**Pool Configuration** (in `api/src/lib/db.ts`):
```typescript
const config: PoolConfig = {
  connectionString: poolUrl,
  max: isPooled ? 10 : 5,        // Lower max for pooler
  idleTimeoutMillis: isPooled ? 5000 : 10000,
  connectionTimeoutMillis: 10000,
};
```

## 4. CI/CD Pipeline

### 4.1 GitHub Actions - Frontend

**.github/workflows/deploy-pages.yml**:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - '.github/workflows/deploy-pages.yml'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        working-directory: web
        run: npm ci

      - name: Build
        working-directory: web
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_SITE_URL: ${{ vars.NEXT_PUBLIC_SITE_URL }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy web/.next --project-name=famouspeople-id
```

### 4.2 GitHub Actions - API Deployment

**.github/workflows/deploy-api.yml**:

```yaml
name: Deploy API to VPS

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - 'docker-compose.yml'
      - '.github/workflows/deploy-api.yml'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        working-directory: api
        run: npm ci
      - name: Run tests
        working-directory: api
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 107.174.42.198
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/docker-projects/heavy-tasks/famouspeople.id
            git pull origin main
            docker-compose up -d --build api
            docker image prune -f

            # Verify deployment
            sleep 10
            curl -f http://localhost:8006/health || exit 1

      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST "${{ secrets.DISCORD_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d '{"content": "FamousPeople API deployment failed!"}'
```

### 4.3 Database Migrations

**.github/workflows/migrate.yml**:

```yaml
name: Run Database Migrations

on:
  workflow_dispatch:
    inputs:
      migration_file:
        description: 'Migration file to run (e.g., 001_add_column.sql)'
        required: true

jobs:
  migrate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Migration
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          psql "$SUPABASE_DB_URL" -f "supabase/migrations/${{ inputs.migration_file }}"
```

**Migration file structure**:

```
supabase/
  migrations/
    001_initial_schema.sql
    002_add_embedding_index.sql
    003_add_views.sql
```

## 5. Monitoring & Alerting

### 5.1 Cloudflare Analytics

- **Dashboard**: cloudflare.com > famouspeople.id > Analytics
- **Metrics**: Requests, bandwidth, cache hit ratio, Web Vitals
- **Alerts**: Set up in Notifications > Create

### 5.2 Container Logs (Dozzle)

```bash
# Access: https://dozzle.yourdomain.com
# Filter: famouspeople-api

# CLI access:
ssh root@107.174.42.198 "docker logs --tail 100 -f famouspeople-api"
```

### 5.3 Uptime Monitoring (uptime-kuma)

```bash
# Access: https://uptime.yourdomain.com

# Add monitors:
# 1. API Health
#    Type: HTTP(s)
#    URL: https://api.famouspeople.id/health
#    Interval: 60s
#    Retry: 3

# 2. Frontend
#    Type: HTTP(s)
#    URL: https://famouspeople.id
#    Interval: 60s

# 3. Supabase
#    Type: HTTP(s)
#    URL: https://your-project.supabase.co/rest/v1/
#    Interval: 300s
```

### 5.4 Alert Channels

```yaml
# uptime-kuma notification setup:
- Discord webhook for critical alerts
- Email for daily summaries
```

## 6. Rollback Procedures

### 6.1 Frontend Rollback

```bash
# Via Cloudflare Dashboard:
# Pages > famouspeople-id > Deployments > Select previous > Rollback

# Via CLI:
wrangler pages deployment list --project-name=famouspeople-id
wrangler pages deployment rollback --project-name=famouspeople-id --deployment-id=<id>
```

### 6.2 API Rollback

```bash
# SSH to VPS
ssh root@107.174.42.198

# Option 1: Git rollback
cd /opt/docker-projects/heavy-tasks/famouspeople.id
git log --oneline -5  # Find previous commit
git checkout <commit-hash>
docker-compose up -d --build api

# Option 2: Use previous image
docker images | grep famouspeople
docker-compose down
docker tag famouspeople-api:latest famouspeople-api:broken
docker tag famouspeople-api:previous famouspeople-api:latest
docker-compose up -d
```

### 6.3 Database Rollback

```sql
-- Always create backups before migrations
-- Restore from Supabase dashboard or:

-- Point-in-time recovery (if enabled):
-- Dashboard > Settings > Database > Backups

-- Manual rollback script:
-- supabase/rollbacks/002_rollback_embedding_index.sql
DROP INDEX IF EXISTS idx_identities_embedding;
```

## 7. Secrets Management

### 7.1 Storage Locations

| Secret | Location | Access |
|--------|----------|--------|
| SUPABASE_SERVICE_ROLE_KEY | GitHub Secrets, VPS .env | CI/CD, API container |
| CLOUDFLARE_API_TOKEN | GitHub Secrets | CI/CD only |
| VPS_SSH_KEY | GitHub Secrets | CI/CD only |
| TUNNEL_TOKEN | VPS .env | Tunnel container |

### 7.2 Rotation Procedure

```bash
# 1. Generate new key in Supabase/Cloudflare dashboard

# 2. Update GitHub Secrets:
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "new-key"

# 3. Update VPS:
ssh root@107.174.42.198
cd /opt/docker-projects/heavy-tasks/famouspeople.id
nano .env  # Update key
docker-compose restart api

# 4. Verify:
curl https://api.famouspeople.id/health
```

### 7.3 Never Commit

```gitignore
# .gitignore must include:
.env
.env.*
!.env.example
*.pem
*.key
secrets/
```

## 8. DNS Configuration

### 8.1 Cloudflare DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | famouspeople.id | 192.0.2.1 (CF IP) | Proxied |
| CNAME | www | famouspeople.id | Proxied |
| CNAME | api | <tunnel-id>.cfargotunnel.com | Proxied |

### 8.2 DNS Propagation Check

```bash
# Verify DNS
dig famouspeople.id +short
dig api.famouspeople.id +short

# Check propagation worldwide
# https://www.whatsmydns.net/#A/famouspeople.id
```

## 9. Security Checklist

### 9.1 Pre-Deployment

- [ ] All secrets in .env, not in code
- [ ] .gitignore includes all sensitive files
- [ ] CORS configured for specific origins only
- [ ] Rate limiting enabled on API
- [ ] Input validation on all endpoints

### 9.2 Cloudflare Security

- [ ] SSL/TLS: Full (strict)
- [ ] Always Use HTTPS: ON
- [ ] WAF rules enabled
- [ ] Bot management configured
- [ ] DDoS protection: ON (default)

### 9.3 VPS Security

- [ ] SSH key-only authentication
- [ ] Firewall allows only 22, 80, 443
- [ ] Docker images from trusted sources
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Non-root user in containers

### 9.4 Database Security

- [ ] RLS policies enabled
- [ ] Service role key not exposed to frontend
- [ ] Anon key has limited permissions
- [ ] Regular backups configured

## 10. Cost Breakdown

### 10.1 Monthly Costs (Estimated)

| Service | Tier | Cost/Month |
|---------|------|------------|
| Cloudflare Pages | Free | $0 |
| Cloudflare KV | Free (100k reads) | $0 |
| Cloudflare Tunnel | Free | $0 |
| VPS (107.174.42.198) | Shared | ~$10-20 |
| Supabase | Free tier | $0 |
| Domain (famouspeople.id) | Annual/12 | ~$2 |
| **Total** | | **~$12-22/month** |

### 10.2 Scaling Costs

| Threshold | Action | Added Cost |
|-----------|--------|------------|
| 100k+ API requests/day | Upgrade Supabase | +$25/month |
| 1M+ page views/month | Cloudflare Pro | +$20/month |
| High compute needs | Dedicated VPS | +$30-50/month |

### 10.3 Free Tier Limits

| Service | Limit |
|---------|-------|
| Cloudflare Pages | 500 builds/month, unlimited requests |
| Cloudflare KV | 100k reads/day, 1k writes/day |
| Supabase Free | 500MB DB, 1GB storage, 2GB bandwidth |

---

## Quick Commands Reference

```bash
# Deploy frontend
git push origin main  # Auto-deploys via GitHub Actions

# Deploy API
ssh root@107.174.42.198 "cd /opt/docker-projects/heavy-tasks/famouspeople.id && make deploy"

# Check logs
ssh root@107.174.42.198 "docker logs -f famouspeople-api"

# Restart API
ssh root@107.174.42.198 "docker restart famouspeople-api"

# Sync data manually
ssh root@107.174.42.198 "cd /opt/docker-projects/heavy-tasks/famouspeople.id && docker-compose run --rm sync-worker"

# Check tunnel status
ssh root@107.174.42.198 "docker logs famouspeople-tunnel"
```
