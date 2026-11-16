#!/usr/bin/env bash
set -e
echo "🍷 Starting Velvet Cafe & Grill..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
fi
echo "Generating 15 Table QR Codes..."
node scripts/generate-qr.js http://localhost:3000
echo "Launching Velvet Cafe & Grill Live Server on http://localhost:3000"
npm run dev
