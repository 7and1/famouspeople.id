# FamousPeople.id Deployment Status

**Date**: 2026-02-01
**Status**: ✅ DEPLOYED

---

## Backend API (VPS)

**Server**: 107.174.42.198
**Container**: `famouspeople-api`
**Port**: 8006
**Status**: Running ✓

### Health Check
```bash
ssh root@107.174.42.198 "curl http://localhost:8006/health"
# Response: {"status":"ok"}
```

### Configuration
- **Database**: Supabase PostgreSQL (public schema)
- **Networks**: `nginx-proxy_default`, `supabase_default`
- **Environment**: Production
- **Resource Limits**: 1GB RAM, 1 CPU

### Deployment Commands
```bash
# From local machine
./deploy.sh

# On VPS
ssh root@107.174.42.198
cd /opt/docker-projects/heavy-tasks/famouspeople.id/api
docker compose up -d --build
docker logs -f famouspeople-api
```

### Database Schema
- Tables: `identities`, `relationships`, `relation_types`
- Extensions: `vector`, `pg_trgm`
- Status: Applied ✓

---

## Frontend (Cloudflare Pages)

**Project**: famouspeople
**URL**: https://famouspeople-awi.pages.dev/
**Latest Deployment**: https://e13aad75.famouspeople-awi.pages.dev/
**Status**: Deployed ✓

### CI/CD Pipeline
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` branch
- **Steps**:
  1. Run tests (API + Web)
  2. Build Next.js app
  3. Deploy to Cloudflare Pages

### GitHub Secrets (Configured)
- `CLOUDFLARE_API_TOKEN` ✓
- `CLOUDFLARE_ACCOUNT_ID` ✓

### Build Configuration
- **Framework**: Next.js 16 (App Router)
- **Build Command**: `npm run build`
- **Output**: `.next` directory
- **Node Version**: 20

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                      │
│              (Next.js SSR + Edge Runtime)                │
│           https://famouspeople-awi.pages.dev/            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ API Calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Tunnel (Optional)                │
│                  api.famouspeople.id                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                VPS API (107.174.42.198)                  │
│              Docker: famouspeople-api:8006               │
│                   Hono + Node.js                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL (VPS)                   │
│            supabase-db:5432 (public schema)              │
│              + pgvector + pg_trgm                        │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

### 1. Configure Custom Domain
```bash
# In Cloudflare Pages dashboard
# Add custom domain: famouspeople.id
# DNS: CNAME famouspeople.id -> famouspeople-awi.pages.dev
```

### 2. Set Up Cloudflare Tunnel for API
```bash
# On VPS
cloudflared tunnel create famouspeople-api
cloudflared tunnel route dns famouspeople-api api.famouspeople.id
# Configure tunnel to point to localhost:8006
```

### 3. Import Data
```bash
# On local machine
cd scripts
python sync_db.py  # Sync markdown files to Supabase
```

### 4. Configure Environment Variables
Update `web/.env` on Cloudflare Pages:
```
NEXT_PUBLIC_API_URL=https://api.famouspeople.id/api/v1
NEXT_PUBLIC_SITE_URL=https://famouspeople.id
```

### 5. Enable Caching (Optional)
- Set up Cloudflare KV for edge caching
- Configure Upstash Redis for rate limiting

---

## Monitoring

### Backend Health
```bash
curl http://localhost:8006/health
curl https://api.famouspeople.id/health  # After tunnel setup
```

### Frontend Status
```bash
curl https://famouspeople-awi.pages.dev/
```

### Logs
```bash
# API logs
ssh root@107.174.42.198 "docker logs -f famouspeople-api"

# GitHub Actions logs
gh run list --workflow=deploy.yml
gh run view <run-id> --log
```

---

## Troubleshooting

### API Container Not Starting
```bash
ssh root@107.174.42.198
cd /opt/docker-projects/heavy-tasks/famouspeople.id/api
docker compose logs
docker compose down && docker compose up -d --build
```

### CI/CD Failing
```bash
# Check workflow status
gh run list --workflow=deploy.yml --limit 5

# View failed logs
gh run view <run-id> --log-failed

# Re-run failed workflow
gh run rerun <run-id>
```

### Database Connection Issues
```bash
# Test database connection
ssh root@107.174.42.198
docker exec famouspeople-api curl http://localhost:8006/api/v1/people/test
docker exec supabase-db psql -U postgres -c "SELECT COUNT(*) FROM public.identities"
```

---

## Security Notes

✅ **Secrets Management**
- All credentials stored in GitHub Secrets
- No secrets in code or git history
- `.env` files excluded from git

✅ **Network Security**
- API container isolated in Docker networks
- Database not exposed to public internet
- Cloudflare provides DDoS protection

✅ **Safe for Public Repository**
- No API keys in code
- No database credentials exposed
- Environment variables properly managed

---

## Deployment History

| Date | Version | Changes | Status |
|------|---------|---------|--------|
| 2026-02-01 | Initial | Backend + Frontend deployment, CI/CD setup | ✅ Success |

---

**Last Updated**: 2026-02-01 17:42 CST
