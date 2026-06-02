# PRODUCTION OPERATIONS RUNBOOK
**Sudhan Textile ERP - Daily Operations Guide**

---

## 🎯 PURPOSE

This runbook provides **step-by-step procedures** for managing the Sudhan Textile ERP system in production. Follow these procedures to ensure system stability, data integrity, and business continuity.

---

## 📅 DAILY OPERATIONS CHECKLIST

### Morning Routine (Start of Day)

**Time Required**: 15-20 minutes  
**Frequency**: Every business day  
**Responsibility**: ERP Admin / Operations Lead

---

#### 1. System Health Check

```powershell
# Run daily checklist script
.\daily-golive-checklist.ps1 -DayNumber 1

# Or for ongoing operations:
.\monitor-production.ps1
```

**Verify**:
- [ ] API is running and responding
- [ ] Database is accessible
- [ ] No errors in overnight logs
- [ ] Backup completed successfully

**If any check fails**:
→ Escalate immediately to Technical Support  
→ Do not proceed until resolved

---

#### 2. Backup Verification

**Check Last Night's Backup**:

```sql
-- Connect to SQL Server
-- Run this query:

SELECT TOP 1 
    backup_finish_date,
    DATEDIFF(HOUR, backup_finish_date, GETDATE()) AS HoursSinceBackup,
    backup_size / 1024 / 1024 AS BackupSizeMB,
    physical_device_name
FROM msdb.dbo.backupset bs
INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE database_name = 'SudhanTextileERP'
    AND type = 'D'
ORDER BY backup_finish_date DESC
```

**Expected Result**:
- Backup within last 24 hours
- Backup size reasonable (not 0 KB)
- Backup location accessible

**If backup failed**:
→ Trigger manual backup immediately:
```sql
BACKUP DATABASE [SudhanTextileERP] 
TO DISK = 'C:\Backups\SudhanTextileERP_Manual.bak' 
WITH COMPRESSION, STATS = 10
```

---

#### 3. Data Integrity Spot Check

**Run Integrity Checks**:

```sql
-- Check for negative stock
SELECT 
    PartyName,
    YarnTypeName,
    CurrentBalanceKg
FROM YarnStocks
WHERE CurrentBalanceKg < 0

-- Should return 0 rows
```

```sql
-- Check for orphaned records
SELECT COUNT(*) AS OrphanedCount
FROM BabyCones bc
LEFT JOIN YarnReceipts yr ON bc.ReceiptId = yr.ReceiptId
WHERE yr.ReceiptId IS NULL

-- Should return 0
```

**If integrity issues found**:
→ Log the issue  
→ Investigate root cause before allowing transactions  
→ Escalate if needed

---

#### 4. Review Yesterday's Activity

```sql
-- Transaction summary for yesterday
SELECT 
    'Receipts' AS TransactionType,
    COUNT(*) AS Count,
    SUM(NetWeightKg) AS TotalKg
FROM YarnReceipts
WHERE CAST(ReceiptDate AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)

UNION ALL

SELECT 
    'Beams' AS TransactionType,
    COUNT(*) AS Count,
    SUM(NetWeightKg) AS TotalKg
FROM Beams
WHERE CAST(BeamDate AS DATE) = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)
```

**Expected**:
- Transaction counts reasonable
- No suspicious patterns

**Log the summary** in daily log book

---

### Midday Check (Optional but Recommended - First Week)

**Time Required**: 5 minutes  
**Frequency**: First 5 days, then as needed

#### Quick Health Check

```powershell
# Run monitoring script
.\monitor-production.ps1
```

**Verify**:
- [ ] System still responsive
- [ ] No new critical errors
- [ ] Users not reporting issues

---

### End-of-Day Routine

**Time Required**: 10-15 minutes  
**Frequency**: Every business day

---

#### 1. Review Today's Logs

**Check Application Logs**:
```powershell
# Navigate to logs folder
cd backend\SudhanTextileERP.API\logs

# Check today's log
$today = Get-Date -Format "yyyyMMdd"
Select-String -Path "log-$today*.txt" -Pattern "ERROR|EXCEPTION|FATAL" | Select-Object -Last 10
```

**Action**:
- Document any errors
- Investigate critical errors immediately
- Log non-critical for follow-up

---

#### 2. Stock Reconciliation Check

**Run End-of-Day Reconciliation**:

```sql
-- Compare receipts vs stock
SELECT 
    'Expected Stock' AS Measure,
    SUM(NetWeightKg) AS TotalKg
FROM YarnReceipts
WHERE IsActive = 1

UNION ALL

SELECT 
    'Actual Stock' AS Measure,
    SUM(CurrentBalanceKg) AS TotalKg
FROM YarnStocks

UNION ALL

SELECT 
    'Consumed in Beams' AS Measure,
    SUM(NetWeightKg) AS TotalKg
FROM Beams
WHERE IsActive = 1
```

**Verify**:
- Expected Stock = Actual Stock + Consumed
- Variance within acceptable limits (< 0.1%)

**If variance is high**:
→ Run detailed stock report  
→ Identify transactions causing variance  
→ Create adjustment if needed (via UI only!)

---

#### 3. User Activity Summary

```sql
-- Today's user activity
SELECT 
    u.Username,
    COUNT(al.AuditId) AS Actions,
    MAX(al.CreatedDate) AS LastAction
FROM Users u
LEFT JOIN AuditLogs al ON u.UserId = al.UserId
    AND CAST(al.CreatedDate AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY u.UserId, u.Username
ORDER BY Actions DESC
```

**Note**:
- High activity users (verify normal)
- Inactive users (follow up if expected to work)
- Unusual activity patterns

---

#### 4. Prepare Tomorrow's Readiness

**Checklist**:
- [ ] All today's transactions completed
- [ ] No pending errors or issues
- [ ] System ready for tomorrow's work
- [ ] Any known issues communicated to team

---

## 🔧 COMMON OPERATIONAL TASKS

### Task 1: Create New User

**When**: New employee joins or needs system access  
**Who**: ERP Admin (with approval)  
**How**:

1. **Get Approval**
   - Written request from manager
   - Specify role needed (Operator / Admin / etc.)

2. **Create User via UI**
   - Navigate to: Settings → Users
   - Click "Add New User"
   - Fill in details:
     - Username (format: firstname.lastname)
     - Full Name
     - Email
     - Role
     - Company (if applicable)
   - **Important**: Set strong password, force change on first login

3. **Verify User**
   ```sql
   SELECT UserId, Username, RoleId, IsActive
   FROM Users
   WHERE Username = 'new.username'
   ```

4. **Test Login**
   - Have user log in
   - Verify they can access their screens
   - Verify they cannot access restricted areas

5. **Document**
   - Log user creation in user management log
   - Add to user list

---

### Task 2: Reset User Password

**When**: User forgot password or account locked  
**Who**: ERP Admin  
**How**:

1. **Verify User Identity**
   - Confirm via phone/in-person
   - Verify employee ID

2. **Reset Password via UI**
   - Navigate to: Settings → Users
   - Find user
   - Click "Reset Password"
   - Generate temporary password
   - **Option**: Force password change on next login

3. **Communicate Securely**
   - Give password in person or via secure method
   - Do NOT email passwords

4. **Verify**
   - Confirm user can log in
   - Confirm they changed password

---

### Task 3: Add New Master Data

**When**: New party, yarn type, loom type, etc. needed  
**Who**: ERP Admin / Data Entry Operator  
**How**:

1. **Verify Need**
   - Confirm it doesn't already exist
   - Search thoroughly before adding

2. **Add via UI**
   - Navigate to appropriate master screen
   - Click "Add New"
   - Fill all required fields
   - Use consistent naming conventions

3. **Verify**
   - Confirm data appears in dropdown lists
   - Confirm data saved correctly
   - Check audit log entry

4. **Communicate**
   - Inform relevant users of new master data
   - Update reference lists if maintained

---

### Task 4: Run Stock Reconciliation

**When**: 
- End of week
- End of month
- After suspected data issues
- Before important reports

**Who**: ERP Admin  
**How**:

1. **Generate Stock Report**
   - Navigate to: Reports → Stock Reports
   - Select "Current Stock by Yarn Type"
   - Generate report

2. **Compare with Physical Count** (if applicable)
   - Get physical count from warehouse
   - Compare system vs physical

3. **Investigate Discrepancies**
   ```sql
   -- Detail stock movements
   SELECT 
       yr.ReceiptNo,
       yr.ReceiptDate,
       yr.PartyName,
       yr.YarnTypeName,
       yr.NetWeightKg AS ReceiptKg,
       ISNULL(beams.ConsumedKg, 0) AS ConsumedKg,
       yr.NetWeightKg - ISNULL(beams.ConsumedKg, 0) AS RemainingKg
   FROM YarnReceipts yr
   LEFT JOIN (
       SELECT ReceiptId, SUM(NetWeightKg) AS ConsumedKg
       FROM Beams
       WHERE IsActive = 1
       GROUP BY ReceiptId
   ) beams ON yr.ReceiptId = beams.ReceiptId
   WHERE yr.IsActive = 1
   ORDER BY yr.ReceiptDate DESC
   ```

4. **Create Adjustment** (if needed)
   - Use stock adjustment transaction (via UI)
   - **NEVER** edit database directly
   - Document reason for adjustment
   - Get approval if large adjustment

5. **Document**
   - Log reconciliation results
   - Note any adjustments made
   - File for audit trail

---

### Task 5: Generate End-of-Month Reports

**When**: Last day of month  
**Who**: ERP Admin  
**How**:

1. **Verify Month is Complete**
   - All transactions for the month entered
   - All corrections made
   - Data verified

2. **Run Reports**
   - Stock Summary Report
   - Transaction Summary Report
   - Party-wise Report
   - Any custom reports needed

3. **Export to Excel**
   - Export each report
   - Save with naming: `ReportName_YYYYMM.xlsx`

4. **Distribute**
   - Email to stakeholders
   - Archive in shared folder

5. **Backup**
   - Ensure month-end backup taken
   - Verify backup successful

---

### Task 6: Activate New Financial Year

**When**: Start of new financial year  
**Who**: ERP Admin (with management approval)  
**How**:

1. **Verify Current FY is Complete**
   - All transactions for year entered
   - Year-end reports generated
   - Closing stock verified

2. **Prepare New FY**
   - Determine FY dates
   - Get approval from management

3. **Create New FY via UI**
   - Navigate to: Settings → Financial Years
   - Click "Add New"
   - Enter:
     - Year Name (e.g., "FY 2024-25")
     - Start Date
     - End Date
   - Save (but don't activate yet)

4. **Set Up Document Number Series**
   - Navigate to: Settings → Document Series
   - Create series for new FY:
     - Receipts: REC/2425/0001 to REC/2425/9999
     - Beams: BM/2425/0001 to BM/2425/9999
     - Etc.

5. **Activate New FY**
   - Deactivate old FY (set IsActive = 0)
   - Activate new FY (set IsActive = 1)
   - **Important**: Only ONE FY should be active

6. **Verify**
   ```sql
   SELECT YearId, YearName, StartDate, EndDate, IsActive
   FROM FinancialYears
   ORDER BY StartDate DESC
   ```

7. **Test**
   - Create test transaction
   - Verify document number from new series
   - Verify transaction allowed

8. **Communicate**
   - Inform all users of FY change
   - Confirm new document number format

---

## 🚨 TROUBLESHOOTING PROCEDURES

### Problem: API Not Responding

**Symptoms**:
- Users cannot connect
- "Cannot connect to server" error

**Steps**:

1. **Check if API is running**
   ```powershell
   # Check process
   Get-Process -Name "SudhanTextileERP.API" -ErrorAction SilentlyContinue
   ```

2. **If not running, start it**
   ```powershell
   cd backend\SudhanTextileERP.API
   $env:ASPNETCORE_ENVIRONMENT = "Production"
   dotnet run --configuration Release
   ```

3. **Check health endpoint**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/health"
   ```

4. **Check logs for errors**
   ```powershell
   cd logs
   Get-Content -Path (Get-ChildItem -Filter "log-*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName -Tail 50
   ```

5. **If still failing**
   → Check database connection  
   → Check firewall  
   → Restart server if needed  
   → Escalate to Technical Support

---

### Problem: Database Connection Lost

**Symptoms**:
- "Cannot connect to database" error
- Timeout errors

**Steps**:

1. **Verify SQL Server is running**
   ```powershell
   Get-Service -Name "MSSQL*"
   ```

2. **Test connection**
   ```powershell
   # Use SQL Server Management Studio or:
   $connString = "Server=YOUR_SERVER;Database=SudhanTextileERP;Trusted_Connection=True;"
   $conn = New-Object System.Data.SqlClient.SqlConnection($connString)
   try {
       $conn.Open()
       Write-Host "Connection successful"
       $conn.Close()
   } catch {
       Write-Host "Connection failed: $_"
   }
   ```

3. **Check for blocking**
   ```sql
   SELECT 
       blocking_session_id,
       session_id,
       wait_type,
       wait_time,
       wait_resource
   FROM sys.dm_exec_requests
   WHERE blocking_session_id <> 0
   ```

4. **If blocked, identify blocker**
   ```sql
   SELECT 
       session_id,
       status,
       command,
       last_request_start_time
   FROM sys.dm_exec_sessions
   WHERE session_id IN (SELECT DISTINCT blocking_session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0)
   ```

5. **Resolve blocking** (with caution!)
   ```sql
   -- Only if absolutely necessary and you understand impact
   -- KILL <blocking_session_id>
   ```

6. **If connection string issue**
   → Verify appsettings.Production.json  
   → Verify SQL Server network configuration  
   → Escalate to DBA

---

### Problem: Transaction Failing

**Symptoms**:
- User gets error when saving
- Transaction not completing

**Steps**:

1. **Get exact error message**
   - Ask user to screenshot
   - Check application logs

2. **Identify error type**
   
   **Validation Error** (user can fix):
   - "Required field missing"
   - "Invalid date"
   - "Duplicate entry"
   → Guide user to fix data

   **Business Rule Error**:
   - "Negative stock not allowed"
   - "Financial year not active"
   - "Locked document"
   → Verify data, may need correction

   **Database Error**:
   - "Constraint violation"
   - "Timeout"
   - "Deadlock"
   → Escalate to Technical Support

3. **Check database state**
   ```sql
   -- For yarn receipt example
   SELECT * FROM YarnStocks WHERE StockId = <id>
   SELECT * FROM FinancialYears WHERE IsActive = 1
   ```

4. **Attempt workaround**
   - Retry transaction
   - Use different data
   - Try different time

5. **If persistent**
   → Log detailed issue  
   → Escalate with full context

---

### Problem: Report Shows Wrong Data

**Symptoms**:
- Numbers don't match expectations
- Missing transactions
- Incorrect totals

**Steps**:

1. **Verify report parameters**
   - Date range correct?
   - Filters applied correctly?
   - Refresh report

2. **Compare with database**
   ```sql
   -- Example: Verify stock report
   SELECT 
       YarnTypeName,
       SUM(CurrentBalanceKg) AS TotalStock
   FROM YarnStocks
   GROUP BY YarnTypeName
   ```

3. **Check if data issue or report issue**
   - If database correct → Report bug
   - If database wrong → Data issue

4. **For data issues**
   → Run integrity checks  
   → Identify incorrect transactions  
   → Correct via proper procedure

5. **For report bugs**
   → Document expected vs actual  
   → Log bug report  
   → Find alternative report if available

---

## 📊 PERFORMANCE MONITORING

### Weekly Performance Review

**Frequency**: Every Monday  
**Time Required**: 30 minutes

**Activities**:

1. **Review last week's metrics**
   ```sql
   -- Transaction volumes
   SELECT 
       DATEPART(WEEK, CreatedDate) AS Week,
       COUNT(*) AS Transactions
   FROM YarnReceipts
   WHERE CreatedDate >= DATEADD(WEEK, -1, GETDATE())
   GROUP BY DATEPART(WEEK, CreatedDate)
   ```

2. **Check database size growth**
   ```sql
   SELECT 
       name,
       size * 8 / 1024 AS SizeMB
   FROM sys.master_files
   WHERE database_id = DB_ID()
   ```

3. **Review slow queries**
   ```sql
   SELECT TOP 10
       qs.total_elapsed_time / qs.execution_count AS AvgTime,
       qs.execution_count,
       SUBSTRING(qt.text, 1, 200) AS QueryText
   FROM sys.dm_exec_query_stats qs
   CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
   ORDER BY AvgTime DESC
   ```

4. **Check index usage**
   ```sql
   SELECT 
       OBJECT_NAME(s.object_id) AS TableName,
       i.name AS IndexName,
       s.user_seeks,
       s.user_scans,
       s.user_updates
   FROM sys.dm_db_index_usage_stats s
   INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
   WHERE database_id = DB_ID()
   ORDER BY s.user_updates DESC
   ```

5. **Document trends**
   - Increasing/decreasing usage
   - Performance improvements/degradations
   - Capacity planning needs

---

## 🔐 SECURITY PROCEDURES

### Monthly Security Review

**Frequency**: First Monday of each month  
**Time Required**: 1 hour

**Activities**:

1. **Review user access**
   ```sql
   SELECT 
       u.Username,
       r.RoleName,
       u.IsActive,
       u.LastLoginDate
   FROM Users u
   INNER JOIN Roles r ON u.RoleId = r.RoleId
   ORDER BY u.LastLoginDate DESC
   ```

2. **Identify inactive users**
   ```sql
   SELECT 
       Username,
       LastLoginDate,
       DATEDIFF(DAY, LastLoginDate, GETDATE()) AS DaysSinceLogin
   FROM Users
   WHERE IsActive = 1
       AND LastLoginDate < DATEADD(MONTH, -3, GETDATE())
   ```

3. **Review failed login attempts**
   ```sql
   SELECT 
       UserId,
       Action,
       Details,
       CreatedDate
   FROM AuditLogs
   WHERE Action LIKE '%FAILED%LOGIN%'
       AND CreatedDate >= DATEADD(MONTH, -1, GETDATE())
   ORDER BY CreatedDate DESC
   ```

4. **Verify role assignments**
   - Ensure users have appropriate roles
   - No unnecessary admin access
   - Segregation of duties maintained

5. **Document findings**
   - Users to deactivate
   - Role changes needed
   - Security concerns

---

## 📚 KNOWLEDGE BASE

### Common Questions

**Q: How do I know if system is healthy?**  
A: Run `.\monitor-production.ps1` - if all checks pass (green ✓), system is healthy.

**Q: When should I take a backup?**  
A: Automated backups run nightly. Manual backup before: major changes, FY activation, bulk operations.

**Q: Can I edit data directly in database?**  
A: **NO**. Always use the UI. Direct edits bypass business logic and audit trails.

**Q: User says transaction is slow. What do I do?**  
A: Check if system-wide or just that user. Run monitoring script. Check network. Review recent database activity.

**Q: How long should I keep backups?**  
A: Daily: 7 days, Weekly: 4 weeks, Monthly: 1 year, Year-end: Permanently

---

## 📋 CHECKLISTS

### Pre-Holiday Checklist

Before extended shutdown (holidays/weekends):

- [ ] All transactions completed
- [ ] Backup verified successful
- [ ] No pending errors
- [ ] System shut down properly (if shutting down)
- [ ] Emergency contact list updated
- [ ] On-call person identified

### Post-Holiday Checklist

After extended shutdown:

- [ ] Verify system started correctly
- [ ] Check backup from last business day
- [ ] Run health check script
- [ ] Verify database accessible
- [ ] Test user login
- [ ] Review any alerts/notifications

---

## 🆘 EMERGENCY CONTACTS

**System Down (P1)**:
- Technical Lead: ________________
- DBA: ________________
- After Hours: ________________

**Data Issues (P2)**:
- ERP Admin: ________________
- Backup: ________________

**Business Questions (P3)**:
- Business Owner: ________________

---

## 📅 SCHEDULED MAINTENANCE

### Daily
- ✓ Morning health check
- ✓ Backup verification
- ✓ End-of-day log review

### Weekly
- ✓ Performance review (Monday)
- ✓ Weekly backup verification
- ✓ Issue log review

### Monthly
- ✓ Security review (1st Monday)
- ✓ Database maintenance (1st Sunday)
- ✓ User access review
- ✓ Archive old logs

### Quarterly
- ✓ Full system audit
- ✓ Disaster recovery test
- ✓ User training refresh

### Yearly
- ✓ FY activation
- ✓ Year-end reports
- ✓ Annual backup archive

---

**END OF RUNBOOK**

**Document Version**: 1.0  
**Last Updated**: [Go-Live Date]  
**Next Review**: [30 Days Post Go-Live]  
**Owner**: ERP Operations Team
