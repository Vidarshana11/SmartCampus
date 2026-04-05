#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_TEMPLATE="$ROOT_DIR/backend/src/main/resources/application.properties.example"
BACKEND_LOCAL="$ROOT_DIR/backend/src/main/resources/application.properties"
FRONTEND_TEMPLATE="$ROOT_DIR/frontend/.env.example"
FRONTEND_LOCAL="$ROOT_DIR/frontend/.env"

if [[ ! -f "$BACKEND_LOCAL" ]]; then
  cp "$BACKEND_TEMPLATE" "$BACKEND_LOCAL"
  echo "Created backend/src/main/resources/application.properties from example."
else
  echo "Skipped backend config (already exists)."
fi

if [[ ! -f "$FRONTEND_LOCAL" ]]; then
  cp "$FRONTEND_TEMPLATE" "$FRONTEND_LOCAL"
  echo "Created frontend/.env from example."
else
  echo "Skipped frontend .env (already exists)."
fi

echo "Local config bootstrap complete."
echo "Review backend/src/main/resources/application.properties and set local DB + OAuth values."
