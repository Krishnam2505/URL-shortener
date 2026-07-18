# 🔗 ShortLink — URL Shortener with Rate Limiting & Consistent Hashing

> Paste any long URL, get a short link back — backed by a cache-aside Redis layer sharded via a hand-built consistent hash ring, and protected by a token-bucket rate limiter.

## How It Works
1. POST a long URL → backend generates a base62 short code from an auto-incrementing Postgres id
2. Redirect requests check a Redis cache first (cache-aside pattern); on a miss, fall back to Postgres and populate the cache
3. Cache keys are routed across simulated Redis shards using a consistent hash ring with virtual nodes — adding/removing a shard remaps only a fraction of keys, not all of them
4. Link creation is protected by a Redis-backed token bucket rate limiter (atomic via Lua script) to prevent abuse
5. Load tested with k6 — see `loadtest/RESULTS.md` for real throughput/latency numbers

## Tech Stack
| Layer | Tech |
|-------|------|
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Cache / Rate Limiter | Redis (ioredis) |
| Frontend | React (Vite), Axios |
| Load Testing | k6 |

## Local Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your local Postgres/Redis URLs
psql shortlink < db/schema.sql
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Benchmark Highlights
Sustained **~405 req/sec** on the redirect path with a **p95 latency of 4.36ms** under 50 concurrent virtual users. 

See `loadtest/RESULTS.md` for full numbers.
