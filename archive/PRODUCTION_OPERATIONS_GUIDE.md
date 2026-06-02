# PRODUCTION OPERATIONS QUICK REFERENCE
## Sudhan Textile ERP - Daily Operations Guide

**For**: System Administrators, DevOps Engineers, Support Team  
**Last Updated**: December 22, 2025

---

## DAILY HEALTH CHECKS (5 minutes)

### 1. Check System Health
```bash
curl http://localhost:5000/health/detailed
```

**Expected**: All checks return "Healthy"  
**Action if Degraded**: Check specific component in response

### 2. Check Recent Alerts
```bash
curl http://localhost:5000/health/alerts?hours=24 \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected**: No critical alerts  
**Action if Critical**: Investigate immediately

### 3. Verify Last Backup
```bash
curl http://localhost:5000/api/backup/history?days=1 \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected**: Backup within last 24 hours  
**Action if Missing**: Check logs, trigger manual backup

---

## BACKUP OPERATIONS

### Create Manual Backup
```bash
POST http://localhost:5000/api/backup/create
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**When to Use**:
- Before major changes
- Before deployments
- End of financial year
- On demand

### Restore from Backup
```csharp
// Stop application first!
1. Stop SudhanTextileERP.API process
2. Navigate to Backups/ directory
3. Extract backup ZIP to temp folder
4. Copy database.db to application directory
5. Restart application
```

**⚠️ WARNING**: Restore will overwrite current database!

---

## MONITORING & ALERTS

### Alert Severity Levels
| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Immediate action required | Investigate NOW |
| **Error** | System malfunction | Investigate within 1 hour |
| **Warning** | Potential issue | Monitor, investigate within 4 hours |
| **Info** | Informational | Log only |

### Common Alerts

#### 1. HighMemoryUsage (Warning)
**Meaning**: Application using > 1GB RAM  
**Action**: 
- Check `/health/metrics` for current usage
- Restart application if > 1.5GB
- Investigate memory leaks if recurring

#### 2. NoRecentBackup (Warning)
**Meaning**: No backup in last 48 hours  
**Action**:
- Check backup scheduler logs
- Verify disk space available
- Trigger manual backup
- Check backup configuration

#### 3. LockedAccountAccess (Warning)
**Meaning**: Login attempt on locked account  
**Action**:
- Check audit logs for IP address
- Verify legitimate user (may need password reset)
- Monitor for brute force attacks

#### 4. AccountLocked (Error)
**Meaning**: Account locked after 5 failed attempts  
**Action**:
- Verify legitimate user
- Unlock after 30 minutes (automatic)
- Or manually reset in database if urgent

---

## AUDIT LOG QUERIES

### Get Today's Audit Logs
```bash
GET http://localhost:5000/api/auditlogs?fromDate=2025-12-22
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Get Audit Trail for Specific Record
```bash
GET http://localhost:5000/api/auditlogs/record/YarnReceipt/5
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Filter by User
```bash
GET http://localhost:5000/api/auditlogs?changedBy=admin
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## PERFORMANCE MONITORING

### Check Current Metrics
```bash
curl http://localhost:5000/health/metrics
```

**Key Metrics to Watch**:
- `memoryUsageMB`: Should be < 500MB normally
- `cpuTimeSeconds`: Increases over time (normal)
- `uptimeMinutes`: Should match application start time
- `threadCount`: Should be 30-60 normally

### Run Load Test
```bash
# Install k6 first: choco install k6
cd d:\Sudhan_Textile\ERP\ERP\backend
k6 run performance-tests.js
```

**When to Run**:
- After deployments
- Monthly performance checks
- Before scaling decisions

**Expected Results**:
- P95 response time < 500ms
- Error rate < 5%
- No timeouts

---

## TROUBLESHOOTING

### Application Won't Start

1. **Check logs**:
   ```bash
   tail -f logs/log-YYYYMMDD.txt
   ```

2. **Common Issues**:
   - Database file missing → Will be recreated with seed data
   - Port 5000 in use → `netstat -ano | findstr :5000`, kill process
   - Invalid configuration → Check appsettings.json syntax

### Backup Failures

1. **Check disk space**:
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

2. **Check backup directory permissions**:
   ```powershell
   Test-Path "D:\Backups\SudhanERP" -PathType Container
   ```

3. **Check backup logs**:
   ```bash
   grep "Backup" logs/log-YYYYMMDD.txt
   ```

### High Error Rate

1. **Check recent errors**:
   ```bash
   grep "ERROR" logs/log-YYYYMMDD.txt | tail -20
   ```

2. **Common Causes**:
   - Database connection issues
   - Invalid authentication tokens
   - Rate limiting triggering
   - Disk full

### Rate Limiting Triggering

1. **Check rate limit rejections**:
   ```bash
   grep "429" logs/log-YYYYMMDD.txt
   ```

2. **Whitelist internal IPs** (if needed):
   - Edit appsettings.Production.json
   - Add IP to `RateLimiting:WhitelistedIPs` array
   - Restart application

---

## SECURITY INCIDENTS

### Failed Login Spike
```bash
# Check failed login attempts
grep "FailedLogin" logs/log-YYYYMMDD.txt | tail -50
```

**Action**:
- Identify IP addresses
- Check if legitimate users (password issues)
- Consider firewall block if attack

### Suspicious Audit Activity
```bash
# Check unusual deletions
grep "DELETE" logs/log-YYYYMMDD.txt
```

**Action**:
- Review audit logs via API
- Verify user authorization
- Contact user if suspicious
- Restore from backup if needed

---

## SCHEDULED TASKS

### Daily (Automatic)
- ✅ Database backup (default 12:00 AM)
- ✅ Old backup cleanup (30-day retention)
- ✅ Health monitoring checks (every 5 minutes)

### Weekly (Manual)
- [ ] Review audit logs for anomalies
- [ ] Check backup restore process
- [ ] Review system metrics trends
- [ ] Check for application updates

### Monthly (Manual)
- [ ] Run full load test
- [ ] Review and rotate logs
- [ ] Update NuGet packages
- [ ] Performance analysis

---

## CONTACTS & ESCALATION

### Level 1: System Administrator
- Health check failures
- Backup issues
- Log monitoring
- User account lockouts

### Level 2: DevOps Engineer
- Performance degradation
- Security incidents
- Configuration changes
- Deployment issues

### Level 3: Backend Architect
- Database schema issues
- Critical bugs
- Architecture decisions
- Major incidents

---

## USEFUL COMMANDS

### Check Application Status
```powershell
Get-Process -Name "SudhanTextileERP.API" -ErrorAction SilentlyContinue
```

### Stop Application
```powershell
Stop-Process -Name "SudhanTextileERP.API" -Force
```

### Start Application
```powershell
cd "d:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API"
dotnet run --environment Production
```

### View Live Logs
```powershell
Get-Content "logs\log-$(Get-Date -Format 'yyyyMMdd').txt" -Wait -Tail 50
```

### Check Disk Space
```powershell
Get-PSDrive | Where-Object {$_.Provider -like "*FileSystem*"} | Select-Object Name,Used,Free
```

### Database Size
```powershell
(Get-Item "SudhanTextileERP.db").Length / 1MB
# Returns size in MB
```

---

## CONFIGURATION FILES

### appsettings.Production.json
**Location**: `backend/SudhanTextileERP.API/appsettings.Production.json`

**Critical Settings**:
- `ConnectionStrings:DefaultConnection` - Database connection
- `JwtSettings:SecretKey` - Must be from environment variable
- `Backup:BackupPath` - Backup storage location
- `Security:*` - Password policies and lockout settings

**⚠️ NEVER COMMIT** production settings to Git!

---

## PERFORMANCE BASELINES

### Normal Operation
- **Memory**: 200-400 MB
- **CPU**: 5-15% (idle), 30-50% (active)
- **Response Time**: < 150ms (P95)
- **Error Rate**: < 1%
- **Uptime**: 99.5%+

### Under Load (50 users)
- **Memory**: 400-600 MB
- **CPU**: 40-70%
- **Response Time**: < 500ms (P95)
- **Error Rate**: < 5%

### Red Flags 🚩
- Memory > 1 GB
- CPU sustained > 80%
- Response time > 1 second
- Error rate > 10%
- No backup in 72 hours

---

## QUICK LINKS

- **Health Dashboard**: http://localhost:5000/health/detailed
- **Swagger API Docs**: http://localhost:5000/swagger
- **Application Logs**: `logs/log-YYYYMMDD.txt`
- **Backup Directory**: `D:\Backups\SudhanERP\`
- **Full Documentation**: `PRODUCTION_INFRASTRUCTURE_REPORT.md`

---

*Keep this guide handy for daily operations*
