#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This installer must run on Linux Ubuntu."
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemd not found. This script targets Ubuntu 24.04 with systemd."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SUDO=""
if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  SUDO="sudo"
fi

BACKEND_SRC="$ROOT_DIR/release/linux/backend/wms-backend-linux"
FRONTEND_SRC="$ROOT_DIR/release/linux/frontend/dist"

echo "Creating /opt/wms directories..."
$SUDO mkdir -p /opt/wms/backend /opt/wms/frontend /opt/wms/database

if [[ -f "$BACKEND_SRC" ]]; then
  echo "Installing backend binary..."
  $SUDO install -m 0755 "$BACKEND_SRC" /opt/wms/backend/wms-backend-linux
else
  echo "Backend binary not found at $BACKEND_SRC"
  echo "Run ./deploy/linux/build-linux.sh [arm64|amd64] before install."
fi

if [[ -d "$FRONTEND_SRC" ]]; then
  echo "Installing frontend dist..."
  $SUDO mkdir -p /opt/wms/frontend/dist
  $SUDO cp -R "$FRONTEND_SRC"/. /opt/wms/frontend/dist/
else
  echo "Frontend dist not found at $FRONTEND_SRC"
  echo "Run ./deploy/linux/build-linux.sh [arm64|amd64] before install."
fi

if [[ ! -f /opt/wms/backend/.env ]]; then
  echo "Creating /opt/wms/backend/.env from example..."
  $SUDO cp "$SCRIPT_DIR/.env.example" /opt/wms/backend/.env
  $SUDO chmod 0600 /opt/wms/backend/.env
  echo "Edit /opt/wms/backend/.env before starting the backend service."
fi

echo "Installing systemd service..."
$SUDO cp "$SCRIPT_DIR/wms-backend.service" /etc/systemd/system/wms-backend.service
$SUDO systemctl daemon-reload
$SUDO systemctl enable wms-backend

if command -v nginx >/dev/null 2>&1; then
  echo "Installing Nginx site..."
  $SUDO cp "$SCRIPT_DIR/nginx-wms.conf" /etc/nginx/sites-available/wms
  $SUDO ln -sfn /etc/nginx/sites-available/wms /etc/nginx/sites-enabled/wms
  $SUDO nginx -t
  $SUDO systemctl restart nginx
else
  echo "Nginx not installed. Install it with: sudo apt install nginx -y"
fi

echo "Install files copied."
echo "Next steps:"
echo "  1) Edit /opt/wms/backend/.env"
echo "  2) Import PostgreSQL database"
echo "  3) Start backend: sudo systemctl start wms-backend"
echo "  4) Check logs: journalctl -u wms-backend -f"
