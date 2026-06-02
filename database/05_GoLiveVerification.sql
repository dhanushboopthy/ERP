-- =============================================
-- GO-LIVE VERIFICATION TEST SCRIPT
-- Execute this after running 04_AuditRemediation.sql
-- =============================================

USE SudhanTextileERP;
GO

PRINT '';
PRINT '=============================================';
PRINT 'GO-LIVE VERIFICATION TEST SUITE';
PRINT 'Execution Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================';
PRINT '';

-- =============================================
-- TEST 1: CHECK CONSTRAINT VERIFICATION
-- =============================================
PRINT '--- TEST 1: Negative Stock Prevention ---';

BEGIN TRY
    -- Attempt to insert negative stock (should fail)
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnStocks')
    BEGIN
        BEGIN TRANSACTION;
        
        INSERT INTO YarnStocks (YarnCountId, PartyId, LotNo, TransactionType, TransactionId, TransactionDate, 
                                InwardQtyKg, OutwardQtyKg, CurrentBalanceKg, FinancialYearId, CreatedBy)
        VALUES (1, 1, 'TEST', 'TEST', 0, GETDATE(), 0, 0, -100, 1, 'SYSTEM');
        
        ROLLBACK TRANSACTION;
        PRINT '✗ FAILED: Negative stock was allowed (CHECK constraint not working)';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        IF ERROR_MESSAGE() LIKE '%CHK_YarnStocks_CurrentBalanceKg%'
            PRINT '✓ PASSED: Negative stock blocked by CHECK constraint';
        ELSE
            PRINT '✗ FAILED: Different error occurred: ' + ERROR_MESSAGE();
    END CATCH
END
GO

-- =============================================
-- TEST 2: FINANCIAL YEAR CLOSURE ENFORCEMENT
-- =============================================
PRINT '';
PRINT '--- TEST 2: Financial Year Closure Enforcement ---';

-- Check if IsClosed column exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('FinancialYears') AND name = 'IsClosed')
BEGIN
    PRINT '✓ IsClosed column exists on FinancialYears';
    
    -- Check if any FY is closed
    DECLARE @ClosedFYCount INT;
    SELECT @ClosedFYCount = COUNT(*) FROM FinancialYears WHERE IsClosed = 1;
    PRINT '  Closed financial years: ' + CAST(@ClosedFYCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT '✗ FAILED: IsClosed column missing on FinancialYears';
END
GO

-- =============================================
-- TEST 3: RECORD LOCKING TRIGGERS
-- =============================================
PRINT '';
PRINT '--- TEST 3: Record Locking Trigger Verification ---';

-- Test YarnReceipts lock trigger
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_YarnReceipts_PreventLockedUpdate')
    PRINT '✓ YarnReceipts lock trigger exists';
ELSE
    PRINT '✗ FAILED: YarnReceipts lock trigger missing';

-- Test WarpingJobCards lock trigger
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_WarpingJobCards_PreventLockedUpdate')
    PRINT '✓ WarpingJobCards lock trigger exists';
ELSE
    PRINT '✗ FAILED: WarpingJobCards lock trigger missing';

-- Test SizingJobCards lock trigger
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_SizingJobCards_PreventLockedUpdate')
    PRINT '✓ SizingJobCards lock trigger exists';
ELSE
    PRINT '✗ FAILED: SizingJobCards lock trigger missing';

-- Test TaxInvoices lock trigger
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_TaxInvoices_PreventLockedUpdate')
    PRINT '✓ TaxInvoices lock trigger exists';
ELSE
    PRINT '✗ FAILED: TaxInvoices lock trigger missing';
GO

-- =============================================
-- TEST 4: AUDIT LOG TABLE
-- =============================================
PRINT '';
PRINT '--- TEST 4: Audit Log Table Verification ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    PRINT '✓ AuditLogs table exists';
    
    -- Check required columns
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('AuditLogs') AND name = 'TableName')
        PRINT '  ✓ TableName column exists';
    ELSE
        PRINT '  ✗ TableName column missing';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('AuditLogs') AND name = 'Action')
        PRINT '  ✓ Action column exists';
    ELSE
        PRINT '  ✗ Action column missing';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('AuditLogs') AND name = 'OldValues')
        PRINT '  ✓ OldValues column exists';
    ELSE
        PRINT '  ✗ OldValues column missing';
    
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('AuditLogs') AND name = 'NewValues')
        PRINT '  ✓ NewValues column exists';
    ELSE
        PRINT '  ✗ NewValues column missing';
    
    -- Count audit log entries
    DECLARE @AuditCount INT;
    SELECT @AuditCount = COUNT(*) FROM AuditLogs;
    PRINT '  Total audit log entries: ' + CAST(@AuditCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT '✗ FAILED: AuditLogs table missing';
END
GO

-- =============================================
-- TEST 5: BABY CONE TABLE
-- =============================================
PRINT '';
PRINT '--- TEST 5: Baby Cone Table Verification ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BabyCones')
BEGIN
    PRINT '✓ BabyCones table exists';
    
    DECLARE @BabyConeCount INT;
    SELECT @BabyConeCount = COUNT(*) FROM BabyCones WHERE IsActive = 1;
    PRINT '  Active baby cone records: ' + CAST(@BabyConeCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT '✗ FAILED: BabyCones table missing';
END
GO

-- =============================================
-- TEST 6: YARN DELIVERY TABLES
-- =============================================
PRINT '';
PRINT '--- TEST 6: Yarn Delivery Tables Verification ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnDeliveries')
    PRINT '✓ YarnDeliveries table exists';
ELSE
    PRINT '✗ FAILED: YarnDeliveries table missing';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnDeliveryDetails')
    PRINT '✓ YarnDeliveryDetails table exists';
ELSE
    PRINT '✗ FAILED: YarnDeliveryDetails table missing';
GO

-- =============================================
-- TEST 7: ISLOCKED COLUMNS
-- =============================================
PRINT '';
PRINT '--- TEST 7: IsLocked Column Verification ---';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('YarnReceipts') AND name = 'IsLocked')
    PRINT '✓ YarnReceipts.IsLocked exists';
ELSE
    PRINT '✗ FAILED: YarnReceipts.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('WarpingJobCards') AND name = 'IsLocked')
    PRINT '✓ WarpingJobCards.IsLocked exists';
ELSE
    PRINT '✗ FAILED: WarpingJobCards.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SizingJobCards') AND name = 'IsLocked')
    PRINT '✓ SizingJobCards.IsLocked exists';
ELSE
    PRINT '✗ FAILED: SizingJobCards.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TaxInvoices') AND name = 'IsLocked')
    PRINT '✓ TaxInvoices.IsLocked exists';
ELSE
    PRINT '✗ FAILED: TaxInvoices.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TaxInvoices') AND name = 'IsPrinted')
    PRINT '✓ TaxInvoices.IsPrinted exists';
ELSE
    PRINT '✗ FAILED: TaxInvoices.IsPrinted missing';
GO

-- =============================================
-- TEST 8: STOCK RECONCILIATION
-- =============================================
PRINT '';
PRINT '--- TEST 8: Stock Reconciliation Check ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnStocks')
BEGIN
    PRINT '✓ YarnStocks table exists';
    
    -- Check for any negative balances
    DECLARE @NegativeStockCount INT;
    SELECT @NegativeStockCount = COUNT(*) 
    FROM YarnStocks 
    WHERE CurrentBalanceKg < 0 AND IsActive = 1;
    
    IF @NegativeStockCount = 0
        PRINT '  ✓ No negative stock balances found';
    ELSE
        PRINT '  ✗ WARNING: ' + CAST(@NegativeStockCount AS VARCHAR) + ' records with negative stock found';
    
    -- Total stock summary
    DECLARE @TotalInward DECIMAL(18,3), @TotalOutward DECIMAL(18,3), @CurrentBalance DECIMAL(18,3);
    SELECT 
        @TotalInward = ISNULL(SUM(InwardQtyKg), 0),
        @TotalOutward = ISNULL(SUM(OutwardQtyKg), 0),
        @CurrentBalance = ISNULL(SUM(CASE WHEN IsActive = 1 THEN CurrentBalanceKg ELSE 0 END), 0)
    FROM YarnStocks;
    
    PRINT '  Total Inward: ' + CAST(@TotalInward AS VARCHAR) + ' kg';
    PRINT '  Total Outward: ' + CAST(@TotalOutward AS VARCHAR) + ' kg';
    PRINT '  Current Balance: ' + CAST(@CurrentBalance AS VARCHAR) + ' kg';
END
ELSE
BEGIN
    PRINT '✗ FAILED: YarnStocks table missing';
END
GO

-- =============================================
-- TEST 9: TAX INVOICES TABLE
-- =============================================
PRINT '';
PRINT '--- TEST 9: Tax Invoices Table Verification ---';

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TaxInvoices')
BEGIN
    PRINT '✓ TaxInvoices table exists';
    
    DECLARE @InvoiceCount INT, @LockedInvoiceCount INT;
    SELECT @InvoiceCount = COUNT(*) FROM TaxInvoices;
    SELECT @LockedInvoiceCount = COUNT(*) FROM TaxInvoices WHERE IsLocked = 1;
    
    PRINT '  Total invoices: ' + CAST(@InvoiceCount AS VARCHAR);
    PRINT '  Locked invoices: ' + CAST(@LockedInvoiceCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT '✗ FAILED: TaxInvoices table missing';
END
GO

-- =============================================
-- FINAL SUMMARY
-- =============================================
PRINT '';
PRINT '=============================================';
PRINT 'VERIFICATION COMPLETE';
PRINT '=============================================';
PRINT '';
PRINT 'ACTION ITEMS:';
PRINT '1. Review all FAILED items above';
PRINT '2. Ensure all triggers are active';
PRINT '3. Test locked record updates manually';
PRINT '4. Verify audit logs are being created';
PRINT '5. Confirm negative stock is blocked';
PRINT '=============================================';
GO
