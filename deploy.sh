#!/bin/bash
set -e

REPO="https://github.com/nitgNITG/khatema.git"
APP_DIR="/var/www/khatema"
BRANCH="${1:-main}"

echo "==> Deploying branch: $BRANCH"

# Pull latest code
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Backend ──────────────────────────────────────────────────
echo "==> Building backend..."
cd "$APP_DIR/backend"
npm ci --omit=dev
./node_modules/.bin/prisma db push
npm run build

# ── Frontend ─────────────────────────────────────────────────
echo "==> Building frontend..."
cd "$APP_DIR/frontend"
npm ci --omit=dev
npm run build

# ── Restart with PM2 ─────────────────────────────────────────
echo "==> Restarting PM2 apps..."
cd "$APP_DIR"
pm2 startOrReload ecosystem.config.js --env production
pm2 save

echo "==> Done. App running at https://khatema.nitg-eg.com"
