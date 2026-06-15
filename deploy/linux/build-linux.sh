#!/usr/bin/env bash
set -euo pipefail

ARCH="${1:-}"
if [[ -z "$ARCH" ]]; then
  case "$(uname -m)" in
    arm64|aarch64) ARCH="arm64" ;;
    x86_64|amd64) ARCH="amd64" ;;
    *) ARCH="amd64" ;;
  esac
fi

if [[ "$ARCH" != "arm64" && "$ARCH" != "amd64" ]]; then
  echo "Unsupported arch: $ARCH"
  echo "Usage: ./deploy/linux/build-linux.sh [arm64|amd64]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_OUT="$ROOT_DIR/release/linux/backend"
FRONTEND_OUT="$ROOT_DIR/release/linux/frontend"

echo "Building WMS release for linux/$ARCH"

mkdir -p "$BACKEND_OUT" "$FRONTEND_OUT"

echo "Building backend..."
(
  cd "$ROOT_DIR/backend"
  GOOS=linux GOARCH="$ARCH" CGO_ENABLED=0 go build -o "$BACKEND_OUT/wms-backend-linux" ./cmd
)

echo "Building frontend..."
(
  cd "$ROOT_DIR/frontend"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  VITE_API_BASE_URL=/api npm run build
)

rm -rf "$FRONTEND_OUT/dist"
mkdir -p "$FRONTEND_OUT"
cp -R "$ROOT_DIR/frontend/dist" "$FRONTEND_OUT/dist"

echo "Release created:"
echo "  Backend:  $BACKEND_OUT/wms-backend-linux"
echo "  Frontend: $FRONTEND_OUT/dist"
