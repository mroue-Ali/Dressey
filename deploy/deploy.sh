#!/usr/bin/env bash
# Pull the latest main and rebuild the web container. Run on the VPS as `ali`:
#   ~/apps/Dressey/deploy/deploy.sh
#
# This is also what GitHub Actions runs on every push to main: the forced
# command in authorized_keys points here. So nothing below asks a question,
# needs a TTY, or calls sudo. If the build fails, the old container keeps
# serving; if the new one does not answer, this exits non-zero.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Pulling"
git pull --ff-only

echo "==> Building and starting"
docker compose -f deploy/docker-compose.yml up -d --build
docker image prune -f >/dev/null

echo "==> Health"
for _ in $(seq 1 15); do
    if curl -fsS --max-time 3 -o /dev/null http://127.0.0.1:8001/; then
        echo "==> Deployed $(git rev-parse --short HEAD)"
        exit 0
    fi
    sleep 2
done

echo "!! The site did not answer on 127.0.0.1:8001. Recent logs:" >&2
docker compose -f deploy/docker-compose.yml logs --tail 40 web >&2
exit 1
