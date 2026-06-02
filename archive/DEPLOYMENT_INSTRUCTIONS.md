# DEPLOYMENT INSTRUCTIONS - GO-LIVE BLOCKERS REMEDIATION

## DEPLOYMENT SEQUENCE (MANDATORY ORDER)

### Step 1: Database Migration (CRITICAL - MUST BE FIRST)

```powershell
# Connect to SQL Server
sqlcmd -S YourServerName -d SudhanTextileERP -i "d:\Sudhan_Textile\ERP\ERP\database\04_AuditRemediation.sql"

# Run verification
sqlcmd -S YourServerName -d SudhanTextileERP -i "d:\Sudhan_Textile\ERP\ERP\database\05_GoLiveVerification.sql"
```

**Expected Output:**
```
✓ CHECK constraint CHK_YarnStocks_CurrentBalanceKg exists
✓ AuditLogs table exists
✓ YarnReceipts lock trigger exists
✓ WarpingJobCards lock trigger exists
✓ SizingJobCards lock trigger exists
✓ TaxInvoices lock trigger exists
```

### Step 2: Backend Deployment

**Modified Files:**
1. `backend/SudhanTextileERP.API/Services/InvoiceService.cs`
   - Added HSN/rate validation
   - Added audit logging to all operations
   
2. `backend/SudhanTextileERP.API/Services/ApprovalWorkflowService.cs` ⭐ NEW
   - Approval workflow with state validation
   
3. `backend/SudhanTextileERP.API/Controllers/ReportsController.cs`
   - Fixed report queries to use TaxInvoices
   - Aligned stock reports to YarnStocks table
   
4. `backend/SudhanTextileERP.API/Program.cs`
   - Registered ApprovalWorkflowService
   
5. `database/04_AuditRemediation.sql`
   - Added WarpingJobCards and SizingJobCards lock triggers
   - Enhanced verification script

**Deployment Commands:**
```powershell
cd d:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API

# Build
dotnet build --configuration Release

# Publish
dotnet publish --configuration Release --output ./publish

# Deploy to IIS or run
dotnet ./publish/SudhanTextileERP.API.dll
```

### Step 3: Post-Deployment Verification

**3.1 Test Database Controls:**
```sql
-- Test 1: Negative stock should FAIL
BEGIN TRANSACTION;
INSERT INTO YarnStocks (YarnCountId, PartyId, LotNo, TransactionType, TransactionId, 
                        TransactionDate, InwardQtyKg, OutwardQtyKg, CurrentBalanceKg, 
                        FinancialYearId, CreatedBy)
VALUES (1, 1, 'TEST', 'TEST', 0, GETDATE(), 0, 0, -100, 1, 'SYSTEM');
ROLLBACK; -- Should fail before rollback with CHK constraint error

-- Test 2: Locked record update should FAIL
UPDATE TaxInvoices SET TaxableAmount = 999 WHERE IsLocked = 1;
-- Expected: Error - "Cannot modify locked invoice."

-- Test 3: Verify audit logs exist
SELECT COUNT(*) FROM AuditLogs WHERE TableName = 'TaxInvoices';
```

**3.2 Test Backend API:**
```bash
# Test 1: Invalid HSN should FAIL
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"details": [{"hsnCode": "123456", "rate": 10}]}'
# Expected: 400 Bad Request - "Invalid HSN/SAC code"

# Test 2: Zero rate should FAIL
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"details": [{"hsnCode": "998821", "rate": 0}]}'
# Expected: 400 Bad Request - "Rate cannot be zero"

# Test 3: Valid invoice should SUCCEED
curl -X POST http://localhost:5000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{"details": [{"hsnCode": "998821", "rate": 50}]}'
# Expected: 200 OK with invoice object

# Test 4: Yarn stock report includes real data
curl http://localhost:5000/api/reports/yarn-stock-register
# Expected: 200 OK with stock summary from YarnStocks table

# Test 5: Invoice register uses TaxInvoices
curl http://localhost:5000/api/reports/invoice-register
# Expected: 200 OK with all invoices from TaxInvoices table
```

**3.3 Test Approval Workflow:**
```csharp
// Requires controller endpoint implementation
POST /api/sizing-job-cards/1/prepare
POST /api/sizing-job-cards/1/check
POST /api/sizing-job-cards/1/approve
POST /api/sizing-job-cards/1/authorize

// Should fail if out of sequence:
POST /api/sizing-job-cards/1/authorize (when status is "Prepared")
// Expected: 400 Bad Request - "Cannot authorize from status 'Prepared'. Must be 'Approved'."
```

### Step 4: Rollback Plan (IF NEEDED)

```sql
-- Rollback database changes
DROP TRIGGER IF EXISTS TR_WarpingJobCards_PreventLockedUpdate;
DROP TRIGGER IF EXISTS TR_SizingJobCards_PreventLockedUpdate;
ALTER TABLE YarnStocks DROP CONSTRAINT IF EXISTS CHK_YarnStocks_CurrentBalanceKg;

-- Restore previous backend version
cd d:\Sudhan_Textile\ERP\ERP\backend\SudhanTextileERP.API
git checkout HEAD~1 -- Services/InvoiceService.cs
git checkout HEAD~1 -- Controllers/ReportsController.cs
dotnet publish --configuration Release --output ./publish
```

## VERIFICATION CHECKLIST

### ✅ Database Layer
- [ ] `04_AuditRemediation.sql` executed successfully
- [ ] `05_GoLiveVerification.sql` shows all ✓ checks passed
- [ ] CHECK constraint exists: `SELECT name FROM sys.check_constraints WHERE name='CHK_YarnStocks_CurrentBalanceKg'`
- [ ] All 4 lock triggers exist: `SELECT COUNT(*) FROM sys.triggers WHERE name LIKE '%PreventLocked%'` returns 4
- [ ] Negative stock insert test FAILS with constraint error
- [ ] Locked record update test FAILS with trigger error

### ✅ Backend Layer
- [ ] No compilation errors: `dotnet build` succeeds
- [ ] ApprovalWorkflowService registered in DI container
- [ ] Invoice creation with invalid HSN returns 400 error
- [ ] Invoice creation with zero rate returns 400 error
- [ ] Invoice creation with valid HSN 998821 and rate > 0 succeeds
- [ ] Audit log entries created for invoice operations
- [ ] Reports use TaxInvoices (not GstInvoices)
- [ ] Stock reports use YarnStocks table

### ✅ Functional Testing
- [ ] Create invoice with HSN 998821 → Success
- [ ] Create invoice with HSN 999999 → Fail (invalid HSN)
- [ ] Create invoice with rate 0 → Fail (zero rate)
- [ ] Print invoice → IsLocked = 1 in database
- [ ] Edit locked invoice → Fail (trigger prevents)
- [ ] Check AuditLogs → PRINT entry exists
- [ ] Run yarn stock report → Shows current stock from YarnStocks
- [ ] Run invoice register → Shows all TaxInvoices
- [ ] Run party ledger → Includes TaxInvoices in debit column

### ✅ Audit Trail
- [ ] Audit log created on invoice INSERT
- [ ] Audit log created on invoice UPDATE
- [ ] Audit log created on invoice FINALIZE
- [ ] Audit log created on invoice PRINT (with lock)
- [ ] Audit log created on invoice CANCEL
- [ ] Audit log includes OldValues → NewValues JSON
- [ ] Audit log captures IP address and user agent

## MONITORING (First Week)

**Daily Checks:**
```sql
-- 1. Check for negative stock (should be 0)
SELECT COUNT(*) AS NegativeStockCount 
FROM YarnStocks 
WHERE CurrentBalanceKg < 0 AND IsActive = 1;

-- 2. Verify audit log growth
SELECT CAST(ChangedAt AS DATE) AS AuditDate, COUNT(*) AS LogCount
FROM AuditLogs
WHERE ChangedAt >= DATEADD(DAY, -7, GETDATE())
GROUP BY CAST(ChangedAt AS DATE)
ORDER BY AuditDate DESC;

-- 3. Check locked invoice count
SELECT Status, IsLocked, COUNT(*) AS InvoiceCount
FROM TaxInvoices
GROUP BY Status, IsLocked;

-- 4. Stock reconciliation
SELECT 
    YarnCountId,
    SUM(InwardQtyKg) - SUM(OutwardQtyKg) AS CalculatedBalance,
    (SELECT TOP 1 CurrentBalanceKg FROM YarnStocks ys2 
     WHERE ys2.YarnCountId = ys1.YarnCountId 
     ORDER BY Id DESC) AS LastBalance
FROM YarnStocks ys1
WHERE IsActive = 1
GROUP BY YarnCountId
HAVING ABS(SUM(InwardQtyKg) - SUM(OutwardQtyKg) - 
       (SELECT TOP 1 CurrentBalanceKg FROM YarnStocks ys2 
        WHERE ys2.YarnCountId = ys1.YarnCountId 
        ORDER BY Id DESC)) > 0.01; -- Should return 0 rows
```

## SUPPORT CONTACTS

**Database Issues:** DBA Team  
**Backend API Issues:** Development Team  
**Business Logic Issues:** ERP Functional Lead  
**Audit/Compliance:** QA Lead  

## SUCCESS CRITERIA

✅ All database verification tests pass  
✅ All backend API tests return expected results  
✅ Negative stock is physically impossible  
✅ Locked records cannot be modified  
✅ HSN/Rate validation prevents invalid invoices  
✅ Audit logs capture all critical operations  
✅ Reports show accurate real-time data  

---

**DEPLOYMENT STATUS:** Ready for UAT Testing  
**GO-LIVE RECOMMENDATION:** ✅ APPROVED (after UAT sign-off)  
**Date Prepared:** December 17, 2025
