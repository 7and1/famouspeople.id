#!/bin/bash
# FamousPeople.id Deployment Script
# Usage: ./deploy.sh [environment]

set -e

# Configuration
VPS_HOST="root@107.174.42.198"
REMOTE_DIR="/opt/docker-projects/heavy-tasks/famouspeople.id"
SERVICE_NAME="famouspeople-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Pull latest code
log_info "Pulling latest code on remote server..."
ssh "${VPS_HOST}" "cd ${REMOTE_DIR} && git pull"

# Step 2: Rebuild containers
log_info "Rebuilding Docker containers..."
ssh "${VPS_HOST}" "cd ${REMOTE_DIR}/api && docker-compose build --no-cache"

# Step 3: Restart services
log_info "Restarting services..."
ssh "${VPS_HOST}" "cd ${REMOTE_DIR}/api && docker-compose down && docker-compose up -d"

# Step 4: Wait for service to be healthy
log_info "Waiting for service to start..."
sleep 10

# Step 5: Health check
log_info "Running health checks..."
if ssh "${VPS_HOST}" "curl -f http://localhost:8006/health" > /dev/null 2>&1; then
    log_info "Health check passed!"
else
    log_error "Health check failed!"
    log_info "Checking logs..."
    ssh "${VPS_HOST}" "cd ${REMOTE_DIR}/api && docker-compose logs --tail=50"
    exit 1
fi

# Step 6: Show container status
log_info "Container status:"
ssh "${VPS_HOST}" "docker ps | grep ${SERVICE_NAME}"

log_info "Deployment completed successfully!"
