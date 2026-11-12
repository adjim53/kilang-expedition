#!/bin/sh
# Container start: bring the database schema up to date, (re)apply the ticket
# tiers from src/data/tiers.ts, then start the site. Never seeds demo data.
set -e

echo "[start] applying database schema"
npx prisma db push --skip-generate

echo "[start] seeding ticket tiers"
npx tsx prisma/seed.ts

echo "[start] starting Next.js on port ${PORT:-3000}"
exec npx next start -p "${PORT:-3000}"
