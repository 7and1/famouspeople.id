#!/bin/bash
# FamousPeople.id Deployment Script
# Usage:
#   ./deploy.sh [--no-cache] [--skip-pull]
#
# Config via env:
#   VPS_HOST=root@107.174.42.198
#   REMOTE_DIR=/opt/docker-projects/heavy-tasks/famouspeople.id
#   API_DIR=api
#   SERVICE_NAME=famouspeople-api
#   HEALTH_URL=http://localhost:8006/health
#   PUBLIC_API_HEALTH_URL=https://api.famouspeople.id/health

set -Eeuo pipefail
IFS=$'\n\t'

# Configuration
VPS_HOST="${VPS_HOST:-root@107.174.42.198}"
REMOTE_DIR="${REMOTE_DIR:-/opt/docker-projects/heavy-tasks/famouspeople.id}"
API_DIR="${API_DIR:-api}"
SERVICE_NAME="${SERVICE_NAME:-famouspeople-api}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8006/health}"
PUBLIC_API_HEALTH_URL="${PUBLIC_API_HEALTH_URL:-https://api.famouspeople.id/health}"

NO_CACHE=false
SKIP_PULL=false
SKIP_PUBLIC_CHECK=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
  cat <<EOF
Usage: ./deploy.sh [--no-cache] [--skip-pull]

Flags:
  --no-cache     Build API image without Docker cache
  --skip-pull    Skip 'git pull' on the remote server
  --skip-public-check  Skip checking ${PUBLIC_API_HEALTH_URL} from the local machine

Env overrides:
  VPS_HOST, REMOTE_DIR, API_DIR, SERVICE_NAME, HEALTH_URL, PUBLIC_API_HEALTH_URL
EOF
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cache) NO_CACHE=true; shift ;;
    --skip-pull) SKIP_PULL=true; shift ;;
    --skip-public-check) SKIP_PUBLIC_CHECK=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) log_error "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

REMOTE_COMPOSE_DETECT='if docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo ""; fi'
COMPOSE_CMD="$(ssh "${VPS_HOST}" "${REMOTE_COMPOSE_DETECT}")"

if [[ -z "${COMPOSE_CMD}" ]]; then
  log_error "Neither 'docker compose' nor 'docker-compose' is available on ${VPS_HOST}"
  exit 1
fi

log_info "Remote compose command: ${COMPOSE_CMD}"

remote() {
  ssh "${VPS_HOST}" "$@"
}

on_error() {
  log_error "Deployment failed. Fetching recent logs..."
  remote "cd '${REMOTE_DIR}/${API_DIR}' && ${COMPOSE_CMD} logs --tail=80" || true
  remote "docker ps | grep '${SERVICE_NAME}' || true" || true
}

trap on_error ERR

# Step 1: Pull latest code (remote)
if [[ "${SKIP_PULL}" == "false" ]]; then
  log_info "Pulling latest code on remote server..."
  remote "cd '${REMOTE_DIR}' && git pull --ff-only"
else
  log_warn "Skipping remote git pull (--skip-pull)"
fi

log_info "Remote git status:"
remote "cd '${REMOTE_DIR}' && git rev-parse --short HEAD && git status -sb"

# Step 2: Rebuild containers
log_info "Building API container..."
BUILD_FLAGS=""
if [[ "${NO_CACHE}" == "true" ]]; then
  BUILD_FLAGS="--no-cache"
fi
remote "cd '${REMOTE_DIR}/${API_DIR}' && ${COMPOSE_CMD} build ${BUILD_FLAGS}"

# Step 3: Restart services
log_info "Restarting services..."
remote "cd '${REMOTE_DIR}/${API_DIR}' && ${COMPOSE_CMD} up -d --remove-orphans"

# Step 4: Health check (with retries)
log_info "Waiting for health check (${HEALTH_URL})..."
for i in $(seq 1 30); do
  if remote "curl -fsS '${HEALTH_URL}' > /dev/null"; then
    log_info "Health check passed!"
    break
  fi
  sleep 1
  if [[ "$i" -eq 30 ]]; then
    log_error "Health check failed after 30s"
    exit 1
  fi
done

# Step 4.5: Public hostname check (from local machine)
if [[ "${SKIP_PUBLIC_CHECK}" == "false" ]]; then
  log_info "Checking public API hostname (${PUBLIC_API_HEALTH_URL})..."
  CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${PUBLIC_API_HEALTH_URL}" || echo '000')"
  if [[ "${CODE}" != "200" && "${CODE}" != "503" ]]; then
    log_error "Public API health check failed (HTTP ${CODE}). Check Cloudflare DNS/Tunnel/SSL."
    exit 1
  fi
  log_info "Public API check OK (HTTP ${CODE})"
else
  log_warn "Skipping public API check (--skip-public-check)"
fi

# Step 5: Show container status
log_info "Container status:"
remote "docker ps | grep '${SERVICE_NAME}' || true"

log_info "Deployment completed successfully!"
