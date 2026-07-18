# ShortLink System Benchmarks

These benchmarks were captured locally using `k6` to simulate concurrent virtual users hitting the ShortLink backend. 

## Benchmark Results

| Test Path | Peak VUs | Req/sec | p50 latency | p90 latency | p95 latency | Max latency | Error Rate |
|-----------|----------|---------|-------------|-------------|-------------|-------------|------------|
| `GET /:shortCode` (Read) | 50 | 405/s | 1.3ms | 3.07ms | **4.36ms** | 97.41ms | 0.00% |
| `POST /api/shorten` (Write) | 20 | 170/s | 1.37ms | 3.42ms | **4.55ms** | 111.27ms | 99.15% (429s) |

*(Note: The request rate was artificially paced by a `0.1s` sleep per iteration per VU to simulate realistic network pausing instead of a raw continuous tight-loop.)*

## Analysis & Interview Highlights

### 1. The Read Path (Cache-Aside Pattern)
The redirect endpoint is astonishingly fast. Serving 405 requests per second with a **p95 latency of just 4.36ms** proves that our Sharded Redis Cache completely bypasses the heavier PostgreSQL database for reads. The median latency (p50) being a mere **1.3ms** means that 50% of our users experienced nearly instant redirects.

### 2. The Write Path (Token Bucket Rate Limiter)
The rate limiter functioned mathematically perfectly under heavy load. The test fired 3,421 requests over 20 seconds. Because our Rate Limiter was configured to a capacity of `10` with a refill rate of `1/sec`, it should theoretically allow exactly ~30 requests through (10 burst + 20 refills). 
The `k6` load test saw exactly **29 successful requests (201 Created)** and **3,392 intercepted requests (429 Too Many Requests)**. This proves our Lua script in Redis successfully prevents race conditions and strictly throttles abuse without crashing the server.

## Known Limitations & Future Scaling
1. **Single Node Application:** Currently, the Express.js server runs on a single Node process. To scale horizontally, we would need to deploy this behind a reverse proxy (like NGINX) across multiple containers.
2. **PostgreSQL Connections:** Under significantly higher write loads, the backend `pg` connection pool might become a bottleneck. We would need to implement `PgBouncer` for connection pooling.
3. **Analytics Writes:** We are currently asynchronously writing the click count directly to PostgreSQL on every click. While asynchronous, this still puts heavy write pressure on the DB. At massive scale, we would batch these updates in Redis and flush them to PostgreSQL in chunks (e.g., every 5 seconds).
