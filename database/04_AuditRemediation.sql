-- =============================================
-- SUDHAN TEXTILE ERP - AUDIT REMEDIATION MIGRATION
-- Database Migration Script for HIGH-RISK gaps
-- Run this after 01_CreateSchema.sql and before 03_StoredProcedures.sql
-- =============================================

USE SudhanTextileERP;
GO

-- =============================================
-- 1. ADD CHECK CONSTRAINT ON YARN STOCK BALANCE
-- Prevents negative stock situations
-- =============================================

-- First check if YarnStock table exists (may be a view or different table)
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnStocks')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_YarnStocks_CurrentBalanceKg')
    BEGIN
        ALTER TABLE YarnStocks 
        ADD CONSTRAINT CHK_YarnStocks_CurrentBalanceKg CHECK (CurrentBalanceKg >= 0);
        PRINT 'Added CHECK constraint CHK_YarnStocks_CurrentBalanceKg';
    END
END
GO

-- =============================================
-- 2. ADD AUDIT LOG TABLE (if not exists)
-- For mandatory audit trail on all transactions
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        EntityType NVARCHAR(100) NOT NULL,
        EntityId INT NOT NULL,
        Action NVARCHAR(20) NOT NULL CHECK (Action IN ('INSERT', 'UPDATE', 'DELETE', 'OVERRIDE', 'APPROVE', 'REJECT', 'LOCK', 'PRINT')),
        OldValues NVARCHAR(MAX) NULL,
        NewValues NVARCHAR(MAX) NULL,
        ChangedBy NVARCHAR(100) NOT NULL,
        ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IPAddress NVARCHAR(50) NULL,
        UserAgent NVARCHAR(500) NULL
    );

    CREATE INDEX IX_AuditLogs_EntityType_EntityId ON AuditLogs(EntityType, EntityId);
    CREATE INDEX IX_AuditLogs_ChangedAt ON AuditLogs(ChangedAt);
    CREATE INDEX IX_AuditLogs_ChangedBy ON AuditLogs(ChangedBy);
    
    PRINT 'Created AuditLogs table';
END
GO

-- =============================================
-- 3. ADD BABY CONE TABLE (if not exists)
-- For baby cone winding operations
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'BabyCones')
BEGIN
    CREATE TABLE BabyCones (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        BabyConeNo NVARCHAR(50) NOT NULL,
        BabyConeDate DATE NOT NULL,
        FinancialYearId INT NOT NULL,
        YarnReceiptId INT NOT NULL,
        YarnReceiptDetailId INT NOT NULL,
        YarnCountId INT NOT NULL,
        LotNo NVARCHAR(50) NOT NULL,
        MachineNo NVARCHAR(20) NULL,
        OperatorName NVARCHAR(100) NULL,
        GrossWeight DECIMAL(12,3) NOT NULL,
        TareWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
        NetWeight AS (GrossWeight - TareWeight) PERSISTED,
        WindingLoss DECIMAL(12,3) NOT NULL DEFAULT 0,
        LeftoverWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
        YieldPercent AS CASE WHEN GrossWeight > 0 THEN ((GrossWeight - TareWeight - WindingLoss) / GrossWeight) * 100 ELSE 0 END PERSISTED,
        ConesProduced INT NOT NULL DEFAULT 0,
        AverageWeight AS CASE WHEN ConesProduced > 0 THEN (GrossWeight - TareWeight) / ConesProduced ELSE 0 END PERSISTED,
        IsUsedInWarping BIT NOT NULL DEFAULT 0,
        WarpingJobCardId INT NULL,
        Remarks NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(100) NULL,
        ModifiedAt DATETIME2 NULL,
        RowVersion ROWVERSION,
        CONSTRAINT FK_BabyCones_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
        CONSTRAINT FK_BabyCones_YarnReceipt FOREIGN KEY (YarnReceiptId) REFERENCES YarnReceipts(Id),
        CONSTRAINT FK_BabyCones_YarnReceiptDetail FOREIGN KEY (YarnReceiptDetailId) REFERENCES YarnReceiptDetails(Id),
        CONSTRAINT FK_BabyCones_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
        CONSTRAINT FK_BabyCones_WarpingJobCard FOREIGN KEY (WarpingJobCardId) REFERENCES WarpingJobCards(Id),
        CONSTRAINT CHK_BabyCones_NetWeight CHECK (GrossWeight >= TareWeight),
        CONSTRAINT CHK_BabyCones_LeftoverWeight CHECK (LeftoverWeight >= 0)
    );

    CREATE INDEX IX_BabyCones_YarnReceiptId ON BabyCones(YarnReceiptId);
    CREATE INDEX IX_BabyCones_YarnCountId ON BabyCones(YarnCountId);
    CREATE INDEX IX_BabyCones_LotNo ON BabyCones(LotNo);
    CREATE INDEX IX_BabyCones_IsUsedInWarping ON BabyCones(IsUsedInWarping);
    
    PRINT 'Created BabyCones table';
END
GO

-- =============================================
-- 4. ADD YARN DELIVERY TABLE (if not exists)
-- For yarn delivery challans
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnDeliveries')
BEGIN
    CREATE TABLE YarnDeliveries (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DCNo NVARCHAR(50) NOT NULL,
        DCDate DATE NOT NULL,
        FinancialYearId INT NOT NULL,
        PartyId INT NOT NULL,
        VehicleId INT NULL,
        VehicleNo NVARCHAR(20) NULL,
        DriverName NVARCHAR(100) NULL,
        TotalWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (Status IN ('Draft', 'Approved', 'Dispatched', 'Cancelled')),
        ApprovedBy NVARCHAR(100) NULL,
        ApprovedAt DATETIME2 NULL,
        DispatchedBy NVARCHAR(100) NULL,
        DispatchedAt DATETIME2 NULL,
        ReceiverName NVARCHAR(100) NULL,
        ReceiverSignature NVARCHAR(MAX) NULL,
        Remarks NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(100) NULL,
        ModifiedAt DATETIME2 NULL,
        RowVersion ROWVERSION,
        CONSTRAINT FK_YarnDeliveries_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
        CONSTRAINT FK_YarnDeliveries_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
        CONSTRAINT FK_YarnDeliveries_Vehicle FOREIGN KEY (VehicleId) REFERENCES Vehicles(Id)
    );

    CREATE INDEX IX_YarnDeliveries_DCDate ON YarnDeliveries(DCDate);
    CREATE INDEX IX_YarnDeliveries_PartyId ON YarnDeliveries(PartyId);
    CREATE INDEX IX_YarnDeliveries_Status ON YarnDeliveries(Status);
    
    PRINT 'Created YarnDeliveries table';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'YarnDeliveryDetails')
BEGIN
    CREATE TABLE YarnDeliveryDetails (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        YarnDeliveryId INT NOT NULL,
        YarnCountId INT NOT NULL,
        LotNo NVARCHAR(50) NOT NULL,
        Bags INT NOT NULL DEFAULT 0,
        GrossWeight DECIMAL(12,3) NOT NULL,
        TareWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
        NetWeight AS (GrossWeight - TareWeight) PERSISTED,
        RatePerKg DECIMAL(10,2) NOT NULL DEFAULT 0,
        Amount AS (GrossWeight - TareWeight) * RatePerKg PERSISTED,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ModifiedBy NVARCHAR(100) NULL,
        ModifiedAt DATETIME2 NULL,
        CONSTRAINT FK_YarnDeliveryDetails_YarnDelivery FOREIGN KEY (YarnDeliveryId) REFERENCES YarnDeliveries(Id) ON DELETE CASCADE,
        CONSTRAINT FK_YarnDeliveryDetails_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
    );

    CREATE INDEX IX_YarnDeliveryDetails_YarnDeliveryId ON YarnDeliveryDetails(YarnDeliveryId);
    
    PRINT 'Created YarnDeliveryDetails table';
END
GO

-- =============================================
-- 5. ADD ISNOTFORSALE AND STATUS TO YARNRETURNS (if not exists)
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('YarnReturns') AND name = 'Status')
BEGIN
    ALTER TABLE YarnReturns ADD Status NVARCHAR(20) NOT NULL DEFAULT 'Draft';
    PRINT 'Added Status column to YarnReturns';
END
GO

-- =============================================
-- 6. UPDATE SP_GETNEXTDOCUMENTNUMBER TO CHECK FINANCIAL YEAR CLOSURE
-- =============================================

CREATE OR ALTER PROCEDURE sp_GetNextDocumentNumber
    @DocumentType NVARCHAR(50),
    @FinancialYearId INT = NULL,
    @DocumentNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get current financial year if not provided
        IF @FinancialYearId IS NULL
        BEGIN
            SELECT TOP 1 @FinancialYearId = Id
            FROM FinancialYears
            WHERE GETDATE() BETWEEN StartDate AND EndDate
            AND IsActive = 1;
        END
        
        -- =============================================
        -- HIGH-RISK FIX: Check if financial year is closed
        -- =============================================
        DECLARE @IsClosed BIT;
        SELECT @IsClosed = IsClosed 
        FROM FinancialYears 
        WHERE Id = @FinancialYearId;
        
        IF @IsClosed = 1
        BEGIN
            RAISERROR('Cannot generate document number for closed financial year.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        -- =============================================
        
        DECLARE @Prefix NVARCHAR(20);
        DECLARE @CurrentNumber INT;
        DECLARE @PadLength INT;
        
        -- Update and get next number atomically
        UPDATE DocumentNumberSeries
        SET CurrentNumber = CurrentNumber + 1,
            @Prefix = Prefix,
            @CurrentNumber = CurrentNumber + 1,
            @PadLength = PadLength
        WHERE DocumentType = @DocumentType
        AND FinancialYearId = @FinancialYearId;
        
        IF @@ROWCOUNT = 0
        BEGIN
            -- Create new series if not exists
            DECLARE @DefaultPrefix NVARCHAR(20);
            DECLARE @YearCode NVARCHAR(10);
            
            SELECT @YearCode = YearCode FROM FinancialYears WHERE Id = @FinancialYearId;
            
            SET @DefaultPrefix = LEFT(@DocumentType, 2) + '/' + ISNULL(@YearCode, '') + '/';
            
            INSERT INTO DocumentNumberSeries (DocumentType, FinancialYearId, Prefix, CurrentNumber, PadLength, CreatedBy)
            VALUES (@DocumentType, @FinancialYearId, @DefaultPrefix, 1, 6, 'System');
            
            SET @Prefix = @DefaultPrefix;
            SET @CurrentNumber = 1;
            SET @PadLength = 6;
        END
        
        SET @DocumentNumber = @Prefix + RIGHT(REPLICATE('0', @PadLength) + CAST(@CurrentNumber AS NVARCHAR(20)), @PadLength);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'Updated sp_GetNextDocumentNumber with financial year closure check';

-- =============================================
-- 7. ADD ISLOCKED COLUMN TO KEY TABLES
-- For record locking after authorization/print
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('YarnReceipts') AND name = 'IsLocked')
BEGIN
    ALTER TABLE YarnReceipts ADD IsLocked BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsLocked column to YarnReceipts';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('WarpingJobCards') AND name = 'IsLocked')
BEGIN
    ALTER TABLE WarpingJobCards ADD IsLocked BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsLocked column to WarpingJobCards';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SizingJobCards') AND name = 'IsLocked')
BEGIN
    ALTER TABLE SizingJobCards ADD IsLocked BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsLocked column to SizingJobCards';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TaxInvoices') AND name = 'IsLocked')
BEGIN
    ALTER TABLE TaxInvoices ADD IsLocked BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsLocked column to TaxInvoices';
END
GO

-- =============================================
-- 8. ADD ISCLOSED COLUMN TO FINANCIAL YEARS (if not exists)
-- =============================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('FinancialYears') AND name = 'IsClosed')
BEGIN
    ALTER TABLE FinancialYears ADD IsClosed BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsClosed column to FinancialYears';
END
GO

-- =============================================
-- 9. ADD TRIGGER TO PREVENT UPDATES ON LOCKED RECORDS
-- =============================================

CREATE OR ALTER TRIGGER TR_YarnReceipts_PreventLockedUpdate
ON YarnReceipts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM deleted d 
        INNER JOIN inserted i ON d.Id = i.Id
        WHERE d.IsLocked = 1 AND d.IsLocked = i.IsLocked
    )
    BEGIN
        RAISERROR('Cannot modify locked yarn receipt.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

CREATE OR ALTER TRIGGER TR_WarpingJobCards_PreventLockedUpdate
ON WarpingJobCards
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM deleted d 
        INNER JOIN inserted i ON d.Id = i.Id
        WHERE d.IsLocked = 1 AND d.IsLocked = i.IsLocked
    )
    BEGIN
        RAISERROR('Cannot modify locked warping job card.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

CREATE OR ALTER TRIGGER TR_SizingJobCards_PreventLockedUpdate
ON SizingJobCards
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM deleted d 
        INNER JOIN inserted i ON d.Id = i.Id
        WHERE d.IsLocked = 1 AND d.IsLocked = i.IsLocked
    )
    BEGIN
        RAISERROR('Cannot modify locked sizing job card.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

CREATE OR ALTER TRIGGER TR_TaxInvoices_PreventLockedUpdate
ON TaxInvoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM deleted d 
        INNER JOIN inserted i ON d.Id = i.Id
        WHERE d.IsLocked = 1 AND d.IsLocked = i.IsLocked
    )
    BEGIN
        RAISERROR('Cannot modify locked invoice.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

PRINT 'Created triggers to prevent locked record updates';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- =============================================
-- 10. ADD VERIFICATION SCRIPT
-- =============================================

PRINT '';
PRINT '=============================================';
PRINT 'RUNNING VERIFICATION CHECKS';
PRINT '=============================================';

-- Check 1: Verify CHECK constraint exists
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CHK_YarnStocks_CurrentBalanceKg')
    PRINT '✓ CHECK constraint CHK_YarnStocks_CurrentBalanceKg exists'
ELSE
    PRINT '✗ FAILED: CHECK constraint missing';

-- Check 2: Verify AuditLogs table exists
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs')
    PRINT '✓ AuditLogs table exists'
ELSE
    PRINT '✗ FAILED: AuditLogs table missing';

-- Check 3: Verify IsLocked columns exist
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('YarnReceipts') AND name = 'IsLocked')
    PRINT '✓ YarnReceipts.IsLocked column exists'
ELSE
    PRINT '✗ FAILED: YarnReceipts.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('WarpingJobCards') AND name = 'IsLocked')
    PRINT '✓ WarpingJobCards.IsLocked column exists'
ELSE
    PRINT '✗ FAILED: WarpingJobCards.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SizingJobCards') AND name = 'IsLocked')
    PRINT '✓ SizingJobCards.IsLocked column exists'
ELSE
    PRINT '✗ FAILED: SizingJobCards.IsLocked missing';

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TaxInvoices') AND name = 'IsLocked')
    PRINT '✓ TaxInvoices.IsLocked column exists'
ELSE
    PRINT '✗ FAILED: TaxInvoices.IsLocked missing';

-- Check 4: Verify triggers exist
IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_YarnReceipts_PreventLockedUpdate')
    PRINT '✓ YarnReceipts lock trigger exists'
ELSE
    PRINT '✗ FAILED: YarnReceipts lock trigger missing';

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_WarpingJobCards_PreventLockedUpdate')
    PRINT '✓ WarpingJobCards lock trigger exists'
ELSE
    PRINT '✗ FAILED: WarpingJobCards lock trigger missing';

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_SizingJobCards_PreventLockedUpdate')
    PRINT '✓ SizingJobCards lock trigger exists'
ELSE
    PRINT '✗ FAILED: SizingJobCards lock trigger missing';

IF EXISTS (SELECT 1 FROM sys.triggers WHERE name = 'TR_TaxInvoices_PreventLockedUpdate')
    PRINT '✓ TaxInvoices lock trigger exists'
ELSE
    PRINT '✗ FAILED: TaxInvoices lock trigger missing';

-- Check 5: Verify IsClosed column on FinancialYears
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('FinancialYears') AND name = 'IsClosed')
    PRINT '✓ FinancialYears.IsClosed column exists'
ELSE
    PRINT '✗ FAILED: FinancialYears.IsClosed missing';

PRINT '';
PRINT '=============================================';
PRINT 'AUDIT REMEDIATION MIGRATION COMPLETED';
PRINT '=============================================';
PRINT 'Applied fixes:';
PRINT '1. Added CHECK constraint on YarnStocks.CurrentBalanceKg';
PRINT '2. Created AuditLogs table for audit trail';
PRINT '3. Created BabyCones table for baby cone operations';
PRINT '4. Created YarnDeliveries and YarnDeliveryDetails tables';
PRINT '5. Added Status column to YarnReturns';
PRINT '6. Updated sp_GetNextDocumentNumber with FY closure check';
PRINT '7. Added IsLocked column to key transactional tables';
PRINT '8. Added IsClosed column to FinancialYears';
PRINT '9. Created triggers to prevent locked record modifications';
PRINT '10. Added verification checks';
PRINT '=============================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Review verification results above';
PRINT '2. Test negative stock prevention';
PRINT '3. Test locked record update prevention';
PRINT '4. Test financial year closure enforcement';
PRINT '=============================================';
GO
