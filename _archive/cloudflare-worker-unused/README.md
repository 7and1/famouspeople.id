# Archived: Cloudflare Worker (Unused)

**Status**: Archived on 2026-02-01

## Why Archived

This `worker.ts` file was an experimental attempt to deploy the API as a Cloudflare Worker. However, the project architecture has been finalized as:

```
Cloudflare Pages (Static Next.js) → Cloudflare Tunnel → VPS API (Hono on Docker)
```

## What This Was

- A duplicate of the VPS API (`api/src/index.ts`) adapted for Cloudflare Workers runtime
- Included edge-specific features like KV cache, R2 storage, and Analytics Engine
- Referenced in `api/wrangler.toml` (main = "src/worker.ts") but never actually deployed

## Current Architecture

- **Frontend**: Next.js static export deployed to Cloudflare Pages
- **Backend**: Hono API running on VPS (107.174.42.198:8006) via Docker
- **Tunnel**: Cloudflare Tunnel exposes VPS API at https://api.famouspeople.id
- **Database**: Supabase PostgreSQL

## If You Need This

If you want to deploy the API to Cloudflare Workers in the future:
1. Copy `worker.ts` back to `api/src/`
2. Update `api/wrangler.toml` to point to it
3. Configure KV namespaces and R2 buckets in Cloudflare dashboard
4. Use `.github/workflows/cloudflare-deploy.yml` to deploy

For now, this is not needed and was causing confusion in the codebase.
