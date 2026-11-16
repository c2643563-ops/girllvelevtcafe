@echo off
title Velvet Cafe & Grill - Live Launcher
echo ============================================
echo   VELVET CAFE & GRILL - LIVE LAUNCHER
echo ============================================
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
if not exist .env.local (
  copy .env.example .env.local
)
echo Generating 15 Table QR Codes...
node scripts/generate-qr.js http://localhost:3000
echo Starting Velvet Cafe & Grill on http://localhost:3000 ...
call npm run dev
pause
