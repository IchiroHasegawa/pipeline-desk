#!/usr/bin/env bash
# Redeploy Production OS on the self-hosted server.
#
#   cd /home/ameya/docker/productionos && ./deploy.sh
#
# Do NOT pipe this through grep/tail — a pipeline's exit code is the LAST
# command's, which masks a failed git pull and happily rebuilds old code.
set -euo pipefail
cd "$(dirname "$0")"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo ">> branch: $BRANCH"

# git pull --ff-only aborts if any tracked file was modified locally.
if ! git diff --quiet; then
  echo "!! tracked files modified locally — refusing to pull. Resolve first:" >&2
  git diff --name-only >&2
  exit 1
fi

git pull --ff-only
echo ">> building"
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps

echo ">> origin health"
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8093/test-access || true)"
  if [ "$code" = "200" ]; then echo ">> /test-access 200 — up"; exit 0; fi
  sleep 2
done
echo "!! app did not answer 200 on /test-access; check: docker logs po_app --tail 50" >&2
exit 1
