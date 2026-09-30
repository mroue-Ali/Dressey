#!/usr/bin/env bash
# Pull the latest main and rebuild the web container. Run on the VPS from anywhere:
#   /home/ali/apps/Dressey/deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."
git pull --ff-only
docker compose -f deploy/docker-compose.yml up -d --build
docker image prune -f >/dev/null
echo "Deployed $(git rev-parse --short HEAD)"
