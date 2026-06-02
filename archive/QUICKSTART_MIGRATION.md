# QUICK START CARD
## SQL Server Migration - One-Page Guide

**Status:** ✅ READY | **Estimated Time:** 30-60 minutes | **Date:** Dec 23, 2025

---

## 🚀 FASTEST PATH TO MIGRATION

### ONE COMMAND TO MIGRATE EVERYTHING

```powershell
# Run in PowerShell as Administrator
cd "d:\Sudhan_Textile\ERP\ERP"
.\migrate-to-sqlserver.ps1
```

**This single command:**
- ✅ Checks SQL Server availability
- ✅ Deploys complete database
- ✅ Validates all constraints
- ✅ Updates backend configuration
- ✅ Runs functional tests

---

## ⚡ PREREQUISITES (5 MINUTES)

### 1. Install SQL Server Express (Free)
```
Download: https://www.microsoft.com/sql-server/sql-server-downloads
Click: "Express" → "Download now" → Run installer
Choose: "Custom" installation → Accept defaults → Wait 10 min
```

### 2. Install SSMS (Optional but Recommended)
```
Download: https://aka.ms/ssmsfullsetup
Run installer → Accept defaults → Wait 5 min
```

### 3. Verify Installation
```powershell
Get-Service MSSQLSERVER
# Should show: Status = Running
```

✅ Ready to migrate!

---

## 📋 MIGRATION STEPS

### Step 1: Run Master Script
```powershell
.\migrate-to-sqlserver.ps1
```

### Step 2: When Prompted, Start Backend
```powershell
# Open NEW terminal window
cd backend\SudhanTextileERP.API
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet run --configuration Release
```

### Step 3: Press Enter to Continue Tests
```
(Script will wait for you to start backend, then continue)
```

### Step 4: Done! ✅
```
Migration complete. System running on SQL Server.
```

---

## 🔍 VERIFY SUCCESS

### Database Check (In SSMS)
```sql
USE SudhanTextileERP;
SELECT COUNT(*) FROM sys.tables;  -- Should be 30+
```

### Backend Check
```powershell
Invoke-RestMethod http://localhost:5000/api/health
# Should return: { "status": "Healthy" }
```

### Login Check
```
Open browser: http://localhost:3000
Login: admin / Admin@123
✅ Should work!
```

---

## 🛠️ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **"Cannot connect to SQL Server"** | `Get-Service MSSQLSERVER` then `Start-Service MSSQLSERVER` |
| **"Script not found"** | Make sure you're in `d:\Sudhan_Textile\ERP\ERP` directory |
| **"Backend won't start"** | Check: `backend\SudhanTextileERP.API\logs\` for errors |
| **"Tests fail"** | Check: `validation-report-*.csv` for details |

---

## 📞 QUICK HELP

### View Logs
```powershell
# Migration logs
Get-Content migration-logs\*.log -Tail 20

# Backend logs
Get-Content backend\SudhanTextileERP.API\logs\log-*.txt -Tail 20
```

### Rollback (If Needed)
```powershell
Copy-Item backups\sqlite_premigration.db -Destination SudhanTextileERP.db
Copy-Item backups\appsettings.json.bak -Destination backend\SudhanTextileERP.API\appsettings.json
```

---

## 📚 FULL DOCUMENTATION

| Document | Purpose |
|----------|---------|
| `MIGRATION_EXECUTIVE_SUMMARY.md` | For management (5 min read) |
| `README_MIGRATION.md` | Complete guide (15 min read) |
| `SQLSERVER_MIGRATION_GUIDE.md` | Detailed steps (technical) |
| `SQLSERVER_MIGRATION_CERTIFICATION.md` | Full certification (reference) |

---

## ✅ CHECKLIST

**Before Migration:**
- [ ] SQL Server installed and running
- [ ] At least 10 GB free disk space
- [ ] Users notified of maintenance window
- [ ] Current SQLite database backed up

**After Migration:**
- [ ] Validation report shows 100% pass
- [ ] Backend starts successfully
- [ ] Can log in and create test record
- [ ] Reports work correctly
- [ ] Backup created at `C:\Backups\`

---

## 🎯 CONNECTION STRING

**Production (SQL Server):**
```
Server=localhost;Database=SudhanTextileERP;Trusted_Connection=True;TrustServerCertificate=True;
```

**Development (SQLite - backup):**
```
Data Source=SudhanTextileERP.db
```

---

## 💡 PRO TIPS

✅ Run migration during weekend/off-hours  
✅ Keep SQLite backup for 30 days  
✅ Monitor logs for first 24 hours  
✅ Schedule SQL Server backups (daily)  
✅ Review `PRODUCTION_OPERATIONS_GUIDE.md` for daily ops  

---

## 🎉 SUCCESS!

**Your system is now on SQL Server!**

Next: Configure automated backups (see PRODUCTION_OPERATIONS_GUIDE.md)

---

**Questions?** Check `migration-logs/` or review full documentation above.

**Version:** 1.0 | **Updated:** 2025-12-23 | **By:** Database Architect
