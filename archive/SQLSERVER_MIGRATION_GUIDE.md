# SQL SERVER MIGRATION GUIDE
## Sudhan Textile ERP - UAT to Production Database Migration

**Migration Date:** December 23, 2025  
**Source Database:** SQLite (UAT)  
**Target Database:** SQL Server (Production)  
**Migration Lead:** Database Architect  
**Status:** READY FOR EXECUTION

---

## 🎯 MIGRATION OBJECTIVE

Migrate the UAT-certified Textile ERP system from SQLite to SQL Server for production deployment with:
- Full data integrity and schema enforcement
- Production-grade constraints and triggers
- Zero functional regression
- Seamless cutover with minimal downtime

---

## ⚠️ CRITICAL SCOPE RULES

### INCLUDED IN SCOPE
✅ SQL Server installation & configuration  
✅ Schema creation & verification  
✅ Constraints, triggers, indexes  
✅ Stored procedures & views  
✅ Application connection migration  
✅ Post-migration validation  

### EXCLUDED FROM SCOPE
❌ Feature development  
❌ UI changes  
❌ Business logic refactoring  
❌ Permission redesign  

---

## 📋 PRE-MIGRATION CHECKLIST

### System Requirements
- [ ] Windows Server 2016+ or Windows 10+
- [ ] Minimum 4 GB RAM (8 GB recommended)
- [ ] 10 GB free disk space
- [ ] Administrator access
- [ ] .NET 8.0 Runtime installed

### Software Requirements
- [ ] SQL Server 2019+ (Express/Standard/Enterprise)
- [ ] SQL Server Management Studio (SSMS) 19.0+
- [ ] PowerShell 5.1+
- [ ] Network connectivity to application server

---

## 🔧 STEP 1: SQL SERVER INSTALLATION

### Download SQL Server 2019 Express (Free)

1. **Download SQL Server 2019 Express Edition:**
   - URL: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Select: "Express" edition
   - Size: ~260 MB download

2. **Run Installer:**
   ```
   - Select: "Custom" installation
   - Choose installation path: C:\Program Files\Microsoft SQL Server
   - Click "Install"
   ```

### Configure SQL Server Installation

3. **SQL Server Installation Center:**
   - Select: "Installation" → "New SQL Server stand-alone installation"
   - Product Key: Not required for Express
   - License Terms: Accept
   - Feature Selection:
     * ✅ Database Engine Services
     * ✅ Full-Text and Semantic Extractions for Search
     * ⬜ Machine Learning Services (optional)

4. **Instance Configuration:**
   ```
   Instance Type: Default instance
   Instance ID: MSSQLSERVER
   Instance root directory: C:\Program Files\Microsoft SQL Server\
   ```

5. **Server Configuration:**
   ```
   Service Accounts:
   - SQL Server Database Engine: NT AUTHORITY\NETWORK SERVICE
   - SQL Server Browser: NT AUTHORITY\LOCAL SERVICE
   
   Startup Type:
   - SQL Server Database Engine: Automatic
   - SQL Server Browser: Automatic
   ```

6. **Database Engine Configuration:**
   ```
   Authentication Mode: Mixed Mode (SQL Server and Windows)
   sa password: [Create a strong password - minimum 8 characters]
   
   Add Current User as Administrator: YES
   
   Data Directories:
   - Data root directory: C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA
   - User database directory: Same as above
   - Backup directory: C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Backup
   ```

7. **Complete Installation:**
   - Review summary
   - Click "Install"
   - Wait for completion (5-10 minutes)

### Post-Installation Configuration

8. **Enable TCP/IP Protocol:**
   - Open "SQL Server Configuration Manager"
   - Navigate to: SQL Server Network Configuration → Protocols for MSSQLSERVER
   - Right-click "TCP/IP" → Enable
   - Restart SQL Server service

9. **Configure SQL Server Browser:**
   - Open "Services" (services.msc)
   - Find "SQL Server Browser"
   - Set Startup Type: Automatic
   - Start the service

10. **Verify Installation:**
    ```powershell
    # Check SQL Server service status
    Get-Service MSSQLSERVER
    
    # Expected output:
    Status   Name               DisplayName
    ------   ----               -----------
    Running  MSSQLSERVER        SQL Server (MSSQLSERVER)
    ```

---

## 🗄️ STEP 2: SQL SERVER MANAGEMENT STUDIO (SSMS)

### Install SSMS

1. **Download SSMS:**
   - URL: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
   - Version: 19.0 or later
   - Size: ~600 MB

2. **Install SSMS:**
   - Run installer: SSMS-Setup-ENU.exe
   - Accept license terms
   - Choose installation location
   - Click "Install"
   - Wait for completion (5-10 minutes)
   - Restart computer if prompted

### Connect to SQL Server

3. **Launch SSMS:**
   ```
   Server type: Database Engine
   Server name: localhost  (or  .\MSSQLSERVER  or  127.0.0.1)
   Authentication: Windows Authentication (or SQL Server Authentication with 'sa')
   ```

4. **Verify Connection:**
   - Expand "Databases" folder
   - Should see system databases: master, model, msdb, tempdb

---

## 🏗️ STEP 3: CREATE PRODUCTION DATABASE

### Execute in SSMS (New Query Window)

```sql
-- Create database with production settings
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'SudhanTextileERP')
BEGIN
    ALTER DATABASE SudhanTextileERP SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SudhanTextileERP;
END
GO

CREATE DATABASE SudhanTextileERP
ON PRIMARY 
(
    NAME = N'SudhanTextileERP_Data',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\SudhanTextileERP.mdf',
    SIZE = 100MB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 50MB
)
LOG ON 
(
    NAME = N'SudhanTextileERP_Log',
    FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\SudhanTextileERP_log.ldf',
    SIZE = 50MB,
    MAXSIZE = 2GB,
    FILEGROWTH = 10MB
);
GO

-- Set database options
ALTER DATABASE SudhanTextileERP SET RECOVERY FULL;
ALTER DATABASE SudhanTextileERP SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE SudhanTextileERP SET AUTO_UPDATE_STATISTICS ON;
ALTER DATABASE SudhanTextileERP COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

-- Verify creation
SELECT 
    name,
    database_id,
    recovery_model_desc,
    collation_name,
    compatibility_level
FROM sys.databases 
WHERE name = 'SudhanTextileERP';
GO
```

**Expected Output:**
```
name                recovery_model_desc  collation_name
-----------------   -------------------  ----------------------------------
SudhanTextileERP    FULL                 SQL_Latin1_General_CP1_CI_AS
```

---

## 📜 STEP 4: EXECUTE SCHEMA SCRIPTS (CRITICAL ORDER)

### Execute scripts in this EXACT order:

#### 4.1 Execute 01_CreateSchema.sql
```powershell
# In PowerShell (Run as Administrator)
cd "d:\Sudhan_Textile\ERP\ERP\database"

sqlcmd -S localhost -E -d SudhanTextileERP -i "01_CreateSchema.sql" -o "log_01_schema.txt"
```

**Verify in SSMS:**
```sql
USE SudhanTextileERP;
GO

-- Check table count (should be 30+)
SELECT COUNT(*) AS TableCount FROM sys.tables;

-- List all tables
SELECT name FROM sys.tables ORDER BY name;
```

#### 4.2 Execute 02_SeedData.sql
```powershell
sqlcmd -S localhost -E -d SudhanTextileERP -i "02_SeedData.sql" -o "log_02_seed.txt"
```

**Verify:**
```sql
-- Check Companies (should have at least 1)
SELECT COUNT(*) FROM Companies;

-- Check Financial Years
SELECT * FROM FinancialYears;

-- Check Roles
SELECT * FROM Roles;

-- Check Users
SELECT UserName, Email, RoleName FROM Users;
```

#### 4.3 Execute 03_StoredProcedures.sql
```powershell
sqlcmd -S localhost -E -d SudhanTextileERP -i "03_StoredProcedures.sql" -o "log_03_sprocs.txt"
```

**Verify:**
```sql
-- Check stored procedures (should be 15+)
SELECT name, type_desc 
FROM sys.objects 
WHERE type = 'P' AND is_ms_shipped = 0
ORDER BY name;
```

#### 4.4 Execute 04_AuditRemediation.sql
```powershell
sqlcmd -S localhost -E -d SudhanTextileERP -i "04_AuditRemediation.sql" -o "log_04_audit.txt"
```

**Verify:**
```sql
-- Check constraints
SELECT 
    t.name AS TableName,
    cc.name AS ConstraintName,
    cc.definition
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
ORDER BY t.name, cc.name;

-- Check triggers
SELECT 
    t.name AS TableName,
    tr.name AS TriggerName,
    tr.is_disabled
FROM sys.triggers tr
INNER JOIN sys.tables t ON tr.parent_id = t.object_id
ORDER BY t.name;
```

#### 4.5 Execute 05_GoLiveVerification.sql
```powershell
sqlcmd -S localhost -E -d SudhanTextileERP -i "05_GoLiveVerification.sql" -o "log_05_verification.txt"
```

**Review output log:**
```powershell
Get-Content "log_05_verification.txt"
```

**All tests should show:** ✓ PASSED

---

## 🔐 STEP 5: CREATE APPLICATION LOGIN

```sql
USE master;
GO

-- Create login for application
CREATE LOGIN [SudhanERPApp] WITH PASSWORD = 'YourSecurePassword123!';
GO

-- Create user in application database
USE SudhanTextileERP;
GO

CREATE USER [SudhanERPApp] FOR LOGIN [SudhanERPApp];
GO

-- Grant permissions
ALTER ROLE db_owner ADD MEMBER [SudhanERPApp];
GO

-- Verify
SELECT 
    dp.name AS UserName,
    dp.type_desc AS UserType,
    r.name AS RoleName
FROM sys.database_principals dp
LEFT JOIN sys.database_role_members drm ON dp.principal_id = drm.member_principal_id
LEFT JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
WHERE dp.name = 'SudhanERPApp';
```

---

## 🔌 STEP 6: UPDATE BACKEND CONNECTION STRING

This will be done in a separate automated update script.

**Connection String Format:**
```
Server=localhost;Database=SudhanTextileERP;User Id=SudhanERPApp;Password=YourSecurePassword123!;TrustServerCertificate=True;Encrypt=False;
```

**Or using Trusted Connection:**
```
Server=localhost;Database=SudhanTextileERP;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;
```

---

## ✅ STEP 7: CRITICAL VERIFICATION POINTS

### 7.1 Schema Verification
```sql
-- Table count
SELECT COUNT(*) AS TableCount FROM sys.tables;
-- Expected: 30+

-- Check for missing tables
SELECT 'Companies' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Companies')
UNION ALL
SELECT 'Parties' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Parties')
UNION ALL
SELECT 'YarnReceipts' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnReceipts')
UNION ALL
SELECT 'WarpingJobCards' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'WarpingJobCards')
UNION ALL
SELECT 'SizingJobCards' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SizingJobCards')
UNION ALL
SELECT 'TaxInvoices' WHERE NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaxInvoices');
-- Should return no rows if all exist
```

### 7.2 Constraint Verification
```sql
-- Check constraints
SELECT COUNT(*) AS CheckConstraintCount 
FROM sys.check_constraints;
-- Expected: 10+

-- Critical constraints
SELECT name FROM sys.check_constraints 
WHERE name IN (
    'CHK_YarnStocks_CurrentBalanceKg',
    'CHK_YarnReceiptDetails_Weights',
    'CHK_BabyCones_NetWeight'
);
-- Should return all listed constraints
```

### 7.3 Trigger Verification
```sql
-- Triggers for record locking
SELECT name FROM sys.triggers 
WHERE name LIKE '%PreventLockedUpdate%';
-- Expected: 4+ triggers
```

### 7.4 Index Verification
```sql
-- Index count
SELECT COUNT(*) AS IndexCount 
FROM sys.indexes 
WHERE type > 0 AND is_primary_key = 0 AND is_unique_constraint = 0;
-- Expected: 20+
```

---

## 🔒 STEP 8: BACKUP CONFIGURATION

```sql
-- Create initial full backup
BACKUP DATABASE SudhanTextileERP
TO DISK = 'C:\Backups\SudhanTextileERP_Initial_20251223.bak'
WITH FORMAT, INIT, NAME = 'Full Database Backup', COMPRESSION;
GO

-- Verify backup
RESTORE VERIFYONLY 
FROM DISK = 'C:\Backups\SudhanTextileERP_Initial_20251223.bak';
GO
```

**Setup Automated Backups:**
- See PRODUCTION_OPERATIONS_GUIDE.md for SQL Server Agent job setup

---

## 📊 STEP 9: PERFORMANCE BASELINE

```sql
-- Get database size
EXEC sp_spaceused;

-- Get table sizes
EXEC sp_MSforeachtable 'EXEC sp_spaceused ''?''';

-- Check query execution plans
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Sample query
SELECT TOP 100 * FROM YarnReceipts ORDER BY ReceiptDate DESC;
```

---

## 🚨 ROLLBACK PROCEDURE

If migration fails at any step:

```sql
USE master;
GO

-- Force disconnect all users
ALTER DATABASE SudhanTextileERP SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Drop database
DROP DATABASE SudhanTextileERP;
GO

-- Revert backend to SQLite connection string
-- Restore from last UAT backup
```

---

## 📞 SUPPORT CONTACTS

**Database Issues:**
- Check logs: `C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Log\ERRORLOG`
- SQL Server Configuration Manager
- SSMS Activity Monitor

**Application Issues:**
- Check application logs: `backend/SudhanTextileERP.API/logs/`
- Verify connection string
- Test API health endpoint: http://localhost:5000/api/health

---

## 📝 MIGRATION SIGN-OFF

| Checkpoint | Status | Verified By | Date/Time |
|------------|--------|-------------|-----------|
| SQL Server Installed | ⬜ | ___________ | _________ |
| SSMS Installed | ⬜ | ___________ | _________ |
| Database Created | ⬜ | ___________ | _________ |
| Schema Deployed | ⬜ | ___________ | _________ |
| Constraints Verified | ⬜ | ___________ | _________ |
| Triggers Verified | ⬜ | ___________ | _________ |
| Seed Data Loaded | ⬜ | ___________ | _________ |
| Backup Created | ⬜ | ___________ | _________ |
| Backend Connected | ⬜ | ___________ | _________ |
| Functional Tests Passed | ⬜ | ___________ | _________ |

---

**MIGRATION STATUS:** READY FOR EXECUTION  
**NEXT STEPS:** Execute Step 1 (SQL Server Installation)
