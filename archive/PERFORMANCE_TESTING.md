# Performance Testing Guide

## Setup

### Install k6 (Load Testing Tool)

**Windows (PowerShell):**
```powershell
choco install k6
```

Or download from: https://k6.io/docs/getting-started/installation/

**Alternative: Use Docker**
```bash
docker pull grafana/k6
```

## Running Tests

### 1. Basic Load Test (10-50 concurrent users)
```bash
k6 run performance-tests.js
```

### 2. Smoke Test (Quick validation)
```bash
k6 run --vus 1 --duration 30s performance-tests.js
```

### 3. Stress Test (Find breaking point)
```bash
k6 run --vus 100 --duration 5m performance-tests.js
```

### 4. Spike Test (Sudden traffic surge)
```bash
k6 run --stage 0s:0,10s:100,30s:100,10s:0 performance-tests.js
```

### 5. With Docker
```bash
docker run --rm -i grafana/k6 run - <performance-tests.js
```

## Test Scenarios Covered

1. **Authentication Load**
   - Login requests
   - Token validation
   - Session management

2. **Read Operations**
   - Master data retrieval
   - Party listings
   - Stock queries

3. **Write Operations**
   - Yarn Receipt creation
   - Document number generation
   - Stock updates

4. **Reports**
   - Stock summaries with joins
   - Aggregations
   - Complex queries

## Performance Thresholds

- **Response Time**: 95th percentile < 500ms
- **Error Rate**: < 10%
- **Throughput**: Target 100 req/sec

## Interpreting Results

```
http_req_duration: avg=245ms, p(95)=450ms ✓ GOOD
errors: rate=0.02 (2%) ✓ GOOD
http_reqs: 5000 req/s ✓ EXCELLENT
```

## Expected Performance (SQLite)

- **10 Users**: < 200ms response time
- **25 Users**: < 300ms response time  
- **50 Users**: < 500ms response time
- **Breaking Point**: ~75-100 users (SQLite limitation)

## Notes

- SQLite performs well for read operations
- Write operations may slow down with high concurrency
- For production with SQL Server, expect better write performance
- Monitor disk I/O during tests
- Check CPU/memory usage in Task Manager

## Custom Metrics Tracked

1. `login_duration` - Authentication performance
2. `yarn_receipt_creation_duration` - Transaction processing time
3. `errors` - Overall error rate
4. `http_req_duration` - General API response times
