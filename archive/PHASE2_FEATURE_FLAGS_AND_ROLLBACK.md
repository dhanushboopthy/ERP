# FEATURE FLAG MATRIX & ROLLBACK PLAYBOOKS
**Sudhan Textile ERP - Safe Deployment Controls**

---

## 🚩 FEATURE FLAG SYSTEM

### Purpose

Feature flags (also called feature toggles) allow us to:
- Deploy code to production WITHOUT enabling features
- Test infrastructure before enabling user-facing functionality
- Enable features for specific users (pilot groups)
- Instantly disable features if problems detected
- Gradual rollout to reduce risk

### Golden Rules

1. **ALL high-risk features MUST be feature-flagged**
2. **Default state: OFF** (feature disabled in production)
3. **Enable only after testing confirms stability**
4. **Can be toggled ON/OFF without code deployment**
5. **Flagged features must have fallback behavior**

---

## 📋 FEATURE FLAG MATRIX

---

### FLAG-001: Scheduled Report Generation

**Feature Name**: Scheduled Report Engine  
**Sprint**: Sprint 4  
**Release**: Release 4 (Week 8)  
**Risk Level**: MEDIUM

**Description**:
Allows users to schedule reports to run automatically (daily, weekly, monthly) and receive via email.

**Why Flagged**:
- Async background processing (new infrastructure)
- Email delivery dependency
- Potential performance impact
- Resource consumption (CPU, memory)

**Default State**: OFF

**Rollout Plan**:
1. **Week 8**: Deploy infrastructure (flag OFF)
2. **Week 9**: Enable for admin users only (pilot)
3. **Week 10**: Enable for power users (20 users)
4. **Week 11**: Enable for all users (if stable)

**Configuration**:
```json
{
  "FeatureFlags": {
    "ScheduledReports": {
      "Enabled": false,
      "EnabledForUsers": [],
      "EnabledForRoles": []
    }
  }
}
```

**Monitoring**:
- Background job queue length
- Email delivery success rate
- CPU/memory usage
- Report generation time

**Disable Criteria**:
- Queue length >100
- Email delivery failure >10%
- CPU usage >80%
- User complaints >5

**Owner**: Technical Lead  
**Status**: Deployed (OFF)  
**Last Updated**: _________________

---

### FLAG-002: Stock Threshold Alerts

**Feature Name**: Automated Stock Alerts  
**Sprint**: Sprint 5  
**Release**: Release 5 (Week 10)  
**Risk Level**: MEDIUM

**Description**:
Automatically sends alerts when stock falls below configured thresholds.

**Why Flagged**:
- Notification flood risk
- Email spam potential
- Threshold calculation logic (new)
- User preference management

**Default State**: OFF

**Rollout Plan**:
1. **Week 10**: Deploy infrastructure (flag OFF)
2. **Week 11**: Enable for warehouse manager only
3. **Week 12**: Enable for all inventory users
4. **Phase-3**: Fine-tune thresholds based on feedback

**Configuration**:
```json
{
  "FeatureFlags": {
    "StockAlerts": {
      "Enabled": false,
      "EnabledForUsers": [],
      "EnabledForRoles": ["WarehouseManager"],
      "ThresholdConfig": {
        "MinStockKg": 100,
        "NotificationFrequency": "Daily"
      }
    }
  }
}
```

**Monitoring**:
- Alert frequency (per user)
- Email delivery rate
- False positive rate
- User feedback

**Disable Criteria**:
- >10 alerts per user per day
- User complaints about spam
- Incorrect threshold calculations

**Owner**: Product Owner  
**Status**: Not Deployed  
**Last Updated**: _________________

---

### FLAG-003: Low Stock Notifications

**Feature Name**: Low Stock In-App Notifications  
**Sprint**: Sprint 5  
**Release**: Release 5 (Week 10)  
**Risk Level**: LOW

**Description**:
In-app notification badge when stock is low (read-only, non-intrusive).

**Why Flagged**:
- Notification frequency tuning needed
- Performance impact (frequent checks)
- User preference alignment

**Default State**: OFF

**Rollout Plan**:
1. **Week 10**: Deploy (flag OFF)
2. **Week 11**: Enable for all users
3. **Week 12**: Tune frequency based on feedback

**Configuration**:
```json
{
  "FeatureFlags": {
    "LowStockNotifications": {
      "Enabled": false,
      "CheckFrequencyMinutes": 60,
      "ThresholdKg": 50
    }
  }
}
```

**Monitoring**:
- Check frequency impact on DB
- User interaction rate
- Notification accuracy

**Disable Criteria**:
- Performance degradation
- User complaints (noise)

**Owner**: Product Owner  
**Status**: Not Deployed  
**Last Updated**: _________________

---

### FLAG-004: Dashboard Widget Customization

**Feature Name**: Drag-and-Drop Dashboard  
**Sprint**: Sprint 4  
**Release**: Release 4 (Week 8)  
**Risk Level**: LOW

**Description**:
Users can customize their dashboard by adding/removing/rearranging widgets.

**Why Flagged**:
- Browser compatibility risk
- Preferences persistence (new feature)
- Performance with many widgets

**Default State**: OFF

**Rollout Plan**:
1. **Week 8**: Deploy (flag OFF), test with dev team
2. **Week 9**: Enable for admin users (pilot)
3. **Week 9**: Enable for all users if stable

**Configuration**:
```json
{
  "FeatureFlags": {
    "DashboardCustomization": {
      "Enabled": false,
      "MaxWidgetsPerUser": 10
    }
  }
}
```

**Monitoring**:
- Dashboard load time
- Widget rendering errors
- Preference save/load success rate

**Disable Criteria**:
- Load time >3 seconds
- Rendering errors >5%

**Owner**: Technical Lead  
**Status**: Not Deployed  
**Last Updated**: _________________

---

### FLAG-005: Advanced Search Filters

**Feature Name**: Multi-Field Advanced Search  
**Sprint**: Sprint 3  
**Release**: Release 3 (Week 6)  
**Risk Level**: LOW

**Description**:
Advanced search with multiple field filters, date ranges, and saved templates.

**Why Flagged**:
- Search performance verification needed
- Large dataset testing
- Index optimization validation

**Default State**: OFF

**Rollout Plan**:
1. **Week 6**: Deploy (flag OFF), performance testing
2. **Week 6**: Enable for all users (if performance acceptable)

**Configuration**:
```json
{
  "FeatureFlags": {
    "AdvancedSearch": {
      "Enabled": false,
      "MaxFilters": 5,
      "TimeoutMs": 5000
    }
  }
}
```

**Monitoring**:
- Search response time
- Query timeout rate
- User adoption

**Disable Criteria**:
- Search time >5 seconds
- Timeout rate >5%

**Owner**: Technical Lead  
**Status**: Not Deployed  
**Last Updated**: _________________

---

### FLAG-006: Bulk Print Operations

**Feature Name**: Bulk Print (Max 50 Records)  
**Sprint**: Sprint 3  
**Release**: Release 3 (Week 6)  
**Risk Level**: MEDIUM

**Description**:
Print multiple records in a single operation (limit enforced at 50).

**Why Flagged**:
- Resource consumption risk
- Printer/browser compatibility
- Limit enforcement validation

**Default State**: OFF

**Rollout Plan**:
1. **Week 6**: Deploy (flag OFF), test with various printers
2. **Week 6**: Enable for admin users
3. **Week 7**: Enable for all users

**Configuration**:
```json
{
  "FeatureFlags": {
    "BulkPrint": {
      "Enabled": false,
      "MaxRecords": 50,
      "EnabledForRoles": ["Admin", "Manager"]
    }
  }
}
```

**Monitoring**:
- Bulk print requests
- Print success rate
- Limit violations

**Disable Criteria**:
- Print failures >10%
- Browser crashes reported

**Owner**: Product Owner  
**Status**: Not Deployed  
**Last Updated**: _________________

---

### FLAG-007: Email Notifications

**Feature Name**: Email Notification System  
**Sprint**: Sprint 5  
**Release**: Release 5 (Week 10)  
**Risk Level**: MEDIUM

**Description**:
Send email notifications for transaction confirmations, alerts, and reports.

**Why Flagged**:
- SMTP dependency
- Email spam risk
- Delivery rate validation
- User preference management

**Default State**: OFF

**Rollout Plan**:
1. **Week 10**: Deploy (flag OFF), test with test SMTP
2. **Week 11**: Enable for admin users only
3. **Week 11**: Enable for all users (opt-in)

**Configuration**:
```json
{
  "FeatureFlags": {
    "EmailNotifications": {
      "Enabled": false,
      "SmtpServer": "smtp.example.com",
      "OptInByDefault": false,
      "MaxEmailsPerUserPerDay": 20
    }
  }
}
```

**Monitoring**:
- Email delivery success rate
- Bounce rate
- User opt-in rate
- Complaint rate

**Disable Criteria**:
- Delivery failure >10%
- Bounce rate >5%
- User complaints about spam

**Owner**: Technical Lead  
**Status**: Not Deployed  
**Last Updated**: _________________

---

## 🔧 FEATURE FLAG MANAGEMENT

### Enabling a Feature

**Process**:
1. **Review readiness**: All testing complete, monitoring in place
2. **Update configuration**: Set `Enabled: true` in appsettings
3. **Deploy configuration**: Update production config (NO code deployment)
4. **Monitor closely**: Watch metrics for first 24 hours
5. **Communicate**: Notify users of new feature availability

**Approval Required**: Product Owner + Technical Lead

---

### Disabling a Feature

**Process**:
1. **Assess impact**: Determine reason for disabling
2. **Communicate**: Notify users BEFORE disabling (if planned)
3. **Update configuration**: Set `Enabled: false`
4. **Deploy configuration**: Update production config
5. **Verify**: Confirm feature disabled and fallback works
6. **Root cause analysis**: If disabled due to issue

**Approval Required**: Technical Lead (immediate if critical issue)

---

### Feature Flag Lifecycle

```
[Deployed (OFF)] → [Pilot (Limited Users)] → [Enabled (All Users)] → [Always On] → [Flag Removed]
     Week N              Week N+1                  Week N+2           Phase-3       Phase-4
```

**Flag Removal**: After feature stable for 90+ days, remove flag and make permanent.

---

## 📘 ROLLBACK PLAYBOOKS

---

## PLAYBOOK 1: Full Deployment Rollback

**Scenario**: Critical issue detected shortly after deployment (within 2 hours)

**Trigger**:
- [ ] Production down
- [ ] Data corruption
- [ ] Critical feature broken
- [ ] Performance degraded >20%

**Decision Authority**: Technical Lead (or on-call engineer if unavailable)

### Execution Steps

**Step 1: Immediate Actions** (0-2 minutes)
```powershell
# 1. Announce rollback
Write-Host "ROLLBACK INITIATED - $(Get-Date)" -ForegroundColor Red

# 2. Stop API services
Stop-Service SudhanTextileERP.API -Force

# 3. Notify team
Send-Notification -Type "Critical" -Message "Rollback in progress"
```

**Step 2: Database Restore** (2-7 minutes)
```powershell
# 1. Verify backup integrity
$backupFile = "SudhanERP_Backup_PreDeployment_$(Get-Date -Format 'yyyyMMdd_HHmmss').bak"
Test-Path $backupFile  # Must be TRUE

# 2. Restore database
Invoke-Sqlcmd -Query "
    ALTER DATABASE SudhanTextileERP SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE SudhanTextileERP FROM DISK = '$backupFile' WITH REPLACE;
    ALTER DATABASE SudhanTextileERP SET MULTI_USER;
"

# 3. Verify database integrity
Invoke-Sqlcmd -Query "DBCC CHECKDB(SudhanTextileERP) WITH NO_INFOMSGS;"
```

**Step 3: Code Rollback** (7-12 minutes)
```powershell
# 1. Revert backend to previous version
cd backend\SudhanTextileERP.API
git checkout HEAD~1  # Previous commit
dotnet publish -c Release

# 2. Revert frontend to previous version
cd ..\..\frontend
git checkout HEAD~1
npm run build

# 3. Deploy reverted code
# (Use deployment automation script)
```

**Step 4: Restart Services** (12-14 minutes)
```powershell
# 1. Start API services
Start-Service SudhanTextileERP.API

# 2. Verify services started
Get-Service SudhanTextileERP.API | Where-Object {$_.Status -eq "Running"}

# 3. Check health endpoint
Invoke-WebRequest -Uri "https://localhost:7001/health" -UseBasicParsing
```

**Step 5: Verification** (14-17 minutes)
```powershell
# Run smoke tests
.\run-smoke-tests.ps1

# Check critical workflows
# - Login/logout
# - Create transaction
# - View reports

# Verify data integrity
.\verify-data-integrity.ps1
```

**Step 6: Communication** (17-20 minutes)
```powershell
# 1. Notify stakeholders
Send-Email -To "stakeholders@company.com" -Subject "Deployment Rollback Complete"

# 2. Update status page
Update-StatusPage -Message "System restored to previous version"

# 3. Schedule post-mortem
# Within 24 hours
```

**Total Time**: 20 minutes (target: <15 minutes)

### Verification Checklist

- [ ] Database restored successfully
- [ ] Code reverted to previous version
- [ ] Services running
- [ ] Health endpoint responding
- [ ] Smoke tests passed
- [ ] Critical workflows functional
- [ ] Data integrity verified
- [ ] Stakeholders notified

---

## PLAYBOOK 2: Partial Rollback (Feature Disable)

**Scenario**: Specific feature causing issues, but rest of deployment is stable

**Trigger**:
- [ ] Single feature broken
- [ ] Feature performance issue
- [ ] User complaints about specific feature

**Decision Authority**: Technical Lead or Product Owner

### Execution Steps

**Step 1: Assess Impact** (0-5 minutes)
- Identify problematic feature
- Confirm feature is feature-flagged
- Determine impact of disabling
- Get approval from Product Owner

**Step 2: Disable Feature Flag** (5-8 minutes)
```json
// Update appsettings.Production.json
{
  "FeatureFlags": {
    "ProblematicFeature": {
      "Enabled": false  // Set to false
    }
  }
}
```

```powershell
# Deploy configuration update (NO code deployment)
.\deploy-config-only.ps1 -Environment Production
```

**Step 3: Verify Feature Disabled** (8-10 minutes)
```powershell
# 1. Check feature flag status
Invoke-WebRequest -Uri "https://localhost:7001/api/feature-flags" -UseBasicParsing

# 2. Test feature is disabled in UI
# (Manual verification)

# 3. Verify fallback behavior works
.\test-feature-fallback.ps1
```

**Step 4: Communication** (10-15 minutes)
```powershell
# Notify users
Send-Email -To "users@company.com" -Subject "Feature Temporarily Disabled" -Body @"
We have temporarily disabled [Feature Name] due to technical issues.
Workaround: [Alternative workflow]
Expected restoration: [Timeframe]
"@
```

**Total Time**: 15 minutes

### Verification Checklist

- [ ] Feature flag set to OFF
- [ ] Configuration deployed
- [ ] Feature disabled in production
- [ ] Fallback behavior functional
- [ ] Users notified
- [ ] Incident logged
- [ ] Fix planned

---

## PLAYBOOK 3: Database-Only Rollback

**Scenario**: Data corruption detected, but code is stable

**Trigger**:
- [ ] Negative stock detected
- [ ] Data integrity violations
- [ ] Incorrect calculations
- [ ] Orphaned records

**Decision Authority**: Technical Lead + Database Administrator

### Execution Steps

**Step 1: Stop Write Operations** (0-2 minutes)
```powershell
# Put system in read-only mode
Update-AppSettings -Key "ReadOnlyMode" -Value "true"

# Notify users
Send-Notification -Type "Warning" -Message "System in read-only mode for maintenance"
```

**Step 2: Analyze Corruption** (2-10 minutes)
```sql
-- Identify affected tables
SELECT * FROM YarnStocks WHERE BalanceKg < 0;
SELECT * FROM BabyCones WHERE BeamId NOT IN (SELECT BeamId FROM Beams);

-- Document corruption extent
-- Determine restoration strategy
```

**Step 3: Restore Database** (10-20 minutes)
```powershell
# Option A: Full restore
# (Same as Playbook 1, Step 2)

# Option B: Partial restore (specific tables)
# (Advanced - requires DBA expertise)
```

**Step 4: Data Reconciliation** (20-40 minutes)
```sql
-- Verify data integrity post-restore
EXEC VerifyDataIntegrity;

-- Reconcile with audit logs
SELECT * FROM AuditLogs WHERE CreatedAt > @RestorePointTime;

-- Apply missing transactions (if any)
-- (Manual, careful process)
```

**Step 5: Resume Operations** (40-45 minutes)
```powershell
# Disable read-only mode
Update-AppSettings -Key "ReadOnlyMode" -Value "false"

# Verify system functional
.\run-functional-tests.ps1

# Notify users
Send-Notification -Type "Success" -Message "System restored and operational"
```

**Total Time**: 45 minutes - 2 hours (depending on corruption extent)

### Verification Checklist

- [ ] Database restored
- [ ] Data integrity verified (no negative stock, no orphans)
- [ ] Audit logs analyzed
- [ ] Missing transactions identified
- [ ] System functional
- [ ] Users notified
- [ ] Root cause analysis initiated

---

## PLAYBOOK 4: Configuration-Only Rollback

**Scenario**: Configuration change causing issues

**Trigger**:
- [ ] Performance degradation after config change
- [ ] Feature behavior incorrect
- [ ] Connection issues
- [ ] Security misconfiguration

**Decision Authority**: DevOps Lead

### Execution Steps

**Step 1: Identify Configuration Issue** (0-5 minutes)
```powershell
# Review recent config changes
git log --oneline -- appsettings.Production.json

# Compare current vs previous
git diff HEAD~1 appsettings.Production.json
```

**Step 2: Revert Configuration** (5-8 minutes)
```powershell
# Revert to previous config
git checkout HEAD~1 -- appsettings.Production.json

# Deploy configuration
.\deploy-config-only.ps1 -Environment Production
```

**Step 3: Restart Services** (8-10 minutes)
```powershell
# Restart API to pick up config
Restart-Service SudhanTextileERP.API

# Verify services started
Get-Service SudhanTextileERP.API | Where-Object {$_.Status -eq "Running"}
```

**Step 4: Verification** (10-12 minutes)
```powershell
# Check health endpoint
Invoke-WebRequest -Uri "https://localhost:7001/health" -UseBasicParsing

# Verify correct configuration loaded
# (Check logs or admin panel)
```

**Total Time**: 12 minutes

### Verification Checklist

- [ ] Configuration reverted
- [ ] Services restarted
- [ ] Correct configuration loaded
- [ ] System functional
- [ ] Issue resolved

---

## PLAYBOOK 5: Frontend-Only Rollback

**Scenario**: Frontend issue, backend is stable

**Trigger**:
- [ ] UI rendering issues
- [ ] JavaScript errors
- [ ] Cross-browser compatibility issues
- [ ] Mobile responsiveness issues

**Decision Authority**: Technical Lead

### Execution Steps

**Step 1: Revert Frontend Code** (0-3 minutes)
```powershell
cd frontend
git checkout HEAD~1  # Previous commit
```

**Step 2: Rebuild Frontend** (3-8 minutes)
```powershell
npm run build
```

**Step 3: Deploy Frontend** (8-10 minutes)
```powershell
# Deploy to web server
.\deploy-frontend-only.ps1 -Environment Production

# Clear CDN cache
Clear-CDNCache -Path "/assets/*"
```

**Step 4: Verification** (10-13 minutes)
```powershell
# Test in browsers
# - Chrome
# - Edge
# - Firefox

# Verify no JavaScript errors (browser console)

# Test critical workflows in UI
```

**Total Time**: 13 minutes

### Verification Checklist

- [ ] Frontend code reverted
- [ ] Build successful
- [ ] Deployment successful
- [ ] CDN cache cleared
- [ ] UI rendering correctly (all browsers)
- [ ] No JavaScript errors
- [ ] Critical workflows functional

---

## 📊 ROLLBACK METRICS

### Track for Each Rollback

| Metric | Target | Purpose |
|--------|--------|---------|
| Rollback Time | <15 min | Speed of recovery |
| Data Loss | 0 | Data safety |
| Downtime | <10 min | Service availability |
| Root Cause Identified | 100% | Prevention |
| Preventative Action Taken | 100% | Improvement |

### Post-Rollback Actions

1. **Immediate** (within 1 hour):
   - [ ] Incident log created
   - [ ] Team debriefed
   - [ ] Communication sent

2. **24 Hours**:
   - [ ] Root cause analysis complete
   - [ ] Fix identified and planned
   - [ ] Incident report published

3. **1 Week**:
   - [ ] Fix implemented and tested
   - [ ] Retrospective held
   - [ ] Process improvements identified

---

## 🎯 ROLLBACK DECISION MATRIX

| Issue Severity | Deployment Time | Action |
|----------------|-----------------|--------|
| **Critical** (P1) | Any time | Immediate rollback |
| **High** (P2) | <1 hour | Rollback |
| **High** (P2) | >1 hour | Evaluate (rollback vs hotfix) |
| **Medium** (P3) | <2 hours | Rollback preferred |
| **Medium** (P3) | >2 hours | Hotfix preferred |
| **Low** (P4) | Any time | Hotfix |

---

## 📞 EMERGENCY CONTACTS

### On-Call Rotation

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| Technical Lead | | | | |
| DevOps Lead | | | | |
| Database Admin | | | | |
| Product Owner | | | | |

### Escalation Path

1. **On-Call Engineer** (first responder)
2. **Technical Lead** (decision authority)
3. **Executive Sponsor** (if >1 hour downtime)

---

**Document Version**: 1.0  
**Last Updated**: _________________  
**Next Review**: After each rollback event  
**Approved By**: _________________

---

**FEATURE FLAGS ENABLE SAFETY. ROLLBACK PLANS ENSURE RECOVERY.**
