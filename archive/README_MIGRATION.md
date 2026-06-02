# SQL SERVER MIGRATION PACKAGE
## Sudhan Textile ERP - Production Database Migration

**Version:** 1.0  
**Date:** December 23, 2025  
**Status:** ✅ READY FOR EXECUTION

---

## 📦 PACKAGE CONTENTS

This migration package contains everything needed to migrate the Sudhan Textile ERP system from SQLite (UAT) to SQL Server (Production).

### Documentation
- `SQLSERVER_MIGRATION_GUIDE.md` - Complete step-by-step migration instructions
- `SQLSERVER_MIGRATION_CERTIFICATION.md` - Comprehensive migration certification document
- `README_MIGRATION.md` - This file

### Automated Scripts
- `migrate-to-sqlserver.ps1` - **MASTER SCRIPT** - Complete automated migration
- `deploy-sqlserver.ps1` - Database deployment and schema creation
- `update-backend-connection.ps1` - Backend configuration updater
- `validate-sqlserver.ps1` - Database validation and integrity checks
- `test-functional-workflows.ps1` - Functional end-to-end testing

### Database Scripts
- `database/01_CreateSchema.sql` - Create all tables and structures
- `database/02_SeedData.sql` - Load master and seed data
- `database/03_StoredProcedures.sql` - Create stored procedures
- `database/04_AuditRemediation.sql` - Apply audit and compliance features
- `database/05_GoLiveVerification.sql` - Automated verification tests

---

## 🚀 QUICK START (RECOMMENDED)

For first-time migration, use the **MASTER SCRIPT**:

```powershell
# Run in PowerShell (Run as Administrator)
cd "d:\Sudhan_Textile\ERP\ERP"

# Execute complete migration
.\migrate-to-sqlserver.ps1
```

This will:
1. ✅ Check SQL Server availability
2. ✅ Verify all required scripts exist
3. ✅ Deploy database with all schemas
4. ✅ Validate database structure and constraints
5. ✅ Update backend configuration
6. ✅ Run functional workflow tests

**Estimated Time:** 30-60 minutes (including manual verification steps)

---

## 📋 PREREQUISITES

### Required Software
- [x] Windows 10/11 or Windows Server 2016+
- [x] SQL Server 2019+ (Express/Standard/Enterprise)
- [x] SQL Server Management Studio (SSMS) 19.0+
- [x] PowerShell 5.1+
- [x] .NET 8.0 Runtime

### Required Access
- [x] Administrator access to Windows
- [x] sysadmin rights on SQL Server (or ability to create databases)
- [x] Write access to application directories

### Pre-Migration Checklist
- [ ] SQL Server installed and running
- [ ] SQL Server Browser service enabled
- [ ] TCP/IP protocol enabled
- [ ] Minimum 10 GB free disk space
- [ ] Current SQLite database backed up
- [ ] Users notified of migration window

---

## 📖 STEP-BY-STEP EXECUTION

### Option 1: Automated (Recommended)

```powershell
# Complete automated migration
.\migrate-to-sqlserver.ps1
```

### Option 2: Manual Step-by-Step

If you prefer to run each phase separately:

#### Phase 1: Deploy Database
```powershell
.\deploy-sqlserver.ps1
```

#### Phase 2: Validate Database
```powershell
.\validate-sqlserver.ps1
```

#### Phase 3: Update Backend
```powershell
.\update-backend-connection.ps1
```

#### Phase 4: Test Application
```powershell
# Start backend in new terminal
cd backend\SudhanTextileERP.API
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet run --configuration Release

# Run tests in original terminal
.\test-functional-workflows.ps1
```

---

## 🔧 ADVANCED OPTIONS

### Custom Server/Database Names

```powershell
# Deploy to specific server and database
.\migrate-to-sqlserver.ps1 -ServerName "MYSERVER\INSTANCE" -DatabaseName "CustomDB"
```

### Skip Automatic Backups

```powershell
# Skip pre-migration backup (not recommended)
.\migrate-to-sqlserver.ps1 -SkipBackup
```

### SQL Server Authentication

```powershell
# Use SQL Server authentication instead of Windows
.\deploy-sqlserver.ps1 -UseWindowsAuth:$false -SqlUsername "sa" -SqlPassword "YourPassword"
```

### Test Connection Only

```powershell
# Test SQL Server connection without making changes
.\update-backend-connection.ps1 -TestOnly
```

---

## ✅ VERIFICATION STEPS

### 1. Database Verification

After migration, verify database structure:

```sql
-- In SQL Server Management Studio
USE SudhanTextileERP;

-- Check table count (should be 30+)
SELECT COUNT(*) AS TableCount FROM sys.tables;

-- Check constraints (should be 10+)
SELECT COUNT(*) AS ConstraintCount FROM sys.check_constraints;

-- Check triggers (should be 4+)
SELECT COUNT(*) AS TriggerCount FROM sys.triggers WHERE is_ms_shipped = 0;

-- Check seed data
SELECT COUNT(*) FROM Companies;
SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Roles;
```

### 2. Backend Verification

```powershell
# Check backend configuration
cd backend\SudhanTextileERP.API

# Verify connection string
Get-Content appsettings.Production.json | Select-String "ConnectionStrings"

# Build and run
dotnet build --configuration Release
dotnet run --configuration Release
```

### 3. Health Check

```powershell
# Test API health endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# Expected response:
# {
#   "status": "Healthy",
#   "database": "Connected",
#   "timestamp": "2025-12-23T10:30:00Z"
# }
```

---

## 📊 VALIDATION REPORTS

All scripts generate detailed reports:

### Database Validation Report
- **File:** `validation-report-YYYYMMDD_HHMMSS.csv`
- **Location:** Root directory
- **Contents:** 50+ validation checks with pass/fail status

### Functional Test Report
- **File:** `functional-test-report-YYYYMMDD_HHMMSS.csv`
- **Location:** Root directory
- **Contents:** Workflow test results with timings

### Migration Logs
- **Directory:** `migration-logs/`
- **Files:** Detailed logs from each script execution

---

## 🛡️ BACKUP & ROLLBACK

### Automatic Backups

The migration scripts automatically create:
- SQLite database backup: `backups/sqlite_premigration.db`
- Configuration backup: `backups/appsettings.json.bak`
- SQL Server backup: `C:\Backups\SudhanTextileERP_Initial_YYYYMMDD.bak`

### Manual Rollback

If migration fails or issues are found:

```powershell
# 1. Stop the application
# 2. Restore SQLite database
Copy-Item "backups/sqlite_premigration.db" -Destination "SudhanTextileERP.db"

# 3. Restore configuration
Copy-Item "backups/appsettings.json.bak" -Destination "backend/SudhanTextileERP.API/appsettings.json"

# 4. Revert Program.cs (if needed)
cd backend\SudhanTextileERP.API
git checkout HEAD -- Program.cs

# 5. Restart application with SQLite
dotnet run
```

---

## 🐛 TROUBLESHOOTING

### Common Issues

#### "Cannot connect to SQL Server"

**Solution:**
1. Verify SQL Server service is running:
   ```powershell
   Get-Service MSSQLSERVER
   ```
2. Check TCP/IP protocol is enabled in SQL Server Configuration Manager
3. Verify firewall allows SQL Server connections

#### "Script execution failed"

**Solution:**
1. Check `migration-logs/` for detailed error messages
2. Verify SQL Server version is 2019 or later
3. Ensure you have sysadmin rights

#### "Backend won't start"

**Solution:**
1. Check connection string in `appsettings.Production.json`
2. Verify SQL Server database exists and is accessible
3. Check backend logs: `backend/SudhanTextileERP.API/logs/`
4. Ensure `ASPNETCORE_ENVIRONMENT=Production`

#### "Validation tests fail"

**Solution:**
1. Review `validation-report-*.csv` for specific failures
2. Check constraint errors - may indicate data issues
3. Verify all scripts executed successfully
4. Re-run individual scripts if needed

#### "Functional tests fail"

**Solution:**
1. Ensure backend is running on http://localhost:5000
2. Check default admin credentials (admin/Admin@123)
3. Verify API endpoints are accessible
4. Check application logs for errors

---

## 📞 SUPPORT

### Log Files

Check these locations for diagnostic information:

- **Migration Logs:** `migration-logs/*.log`
- **Validation Reports:** `validation-report-*.csv`
- **Functional Test Reports:** `functional-test-report-*.csv`
- **Backend Logs:** `backend/SudhanTextileERP.API/logs/`
- **SQL Server Logs:** `C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Log\ERRORLOG`

### Diagnostic Commands

```powershell
# Check SQL Server status
Get-Service MSSQLSERVER | Format-List

# Test database connection
sqlcmd -S localhost -E -Q "SELECT @@VERSION"

# Check backend compilation
cd backend\SudhanTextileERP.API
dotnet build --configuration Release

# View recent backend logs
Get-Content backend\SudhanTextileERP.API\logs\log-$(Get-Date -Format 'yyyyMMdd').txt -Tail 50
```

---

## 📈 POST-MIGRATION MONITORING

### First 24 Hours

Monitor these metrics:

| Metric | Target | Check Method |
|--------|--------|--------------|
| API Response Time | < 500ms | Health endpoint |
| Error Rate | 0% | Application logs |
| Database CPU | < 50% | SQL Server Performance Monitor |
| Failed Transactions | 0 | Audit logs |
| User Complaints | 0 | Support tickets |

### Health Check Commands

```powershell
# API Health
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# Database Size
sqlcmd -S localhost -E -Q "EXEC sp_spaceused" -d SudhanTextileERP

# Recent Errors
sqlcmd -S localhost -E -Q "SELECT TOP 10 * FROM AuditLogs WHERE Action LIKE '%ERROR%' ORDER BY ChangedAt DESC" -d SudhanTextileERP
```

---

## 📚 ADDITIONAL DOCUMENTATION

- **Migration Guide:** `SQLSERVER_MIGRATION_GUIDE.md`
  - Detailed step-by-step instructions
  - SQL Server installation guide
  - Manual migration procedures

- **Migration Certification:** `SQLSERVER_MIGRATION_CERTIFICATION.md`
  - Complete migration certification
  - Risk assessment
  - Sign-off procedures

- **Operations Guide:** `PRODUCTION_OPERATIONS_GUIDE.md`
  - Daily operations procedures
  - Backup and restore procedures
  - Monitoring and maintenance

---

## ✔️ SUCCESS CRITERIA

Your migration is successful when:

- [x] ✅ SQL Server database created and operational
- [x] ✅ All 30+ tables created with correct schema
- [x] ✅ All constraints, triggers, indexes active
- [x] ✅ 100% validation tests pass
- [x] ✅ Backend connects to SQL Server successfully
- [x] ✅ All functional workflow tests pass
- [x] ✅ Users can log in and perform work
- [x] ✅ Reports generate accurate data
- [x] ✅ No errors in application logs
- [x] ✅ Backup successfully created

---

## 🎯 FINAL CHECKLIST

Before declaring migration complete:

- [ ] All automated scripts executed successfully
- [ ] Validation report shows 100% pass rate
- [ ] Functional tests completed successfully
- [ ] Backend starts without errors
- [ ] Users can log in
- [ ] Sample transactions created and verified
- [ ] Reports generate correctly
- [ ] Backups created and verified
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Sign-off obtained (see SQLSERVER_MIGRATION_CERTIFICATION.md)

---

## 🎉 CONGRATULATIONS!

You have successfully migrated Sudhan Textile ERP to SQL Server!

**Next Steps:**
1. Monitor system for 24-48 hours
2. Complete final sign-off in certification document
3. Train users on any differences (should be none)
4. Schedule regular backups
5. Review production operations guide

**For any questions or issues, refer to:**
- Migration logs in `migration-logs/` directory
- `SQLSERVER_MIGRATION_GUIDE.md` for detailed instructions
- `SQLSERVER_MIGRATION_CERTIFICATION.md` for certification details

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Prepared By:** Database Architect / Migration Lead
