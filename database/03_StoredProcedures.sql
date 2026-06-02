-- =============================================
-- SUDHAN TEXTILE ERP - STORED PROCEDURES
-- Core business logic for Sizing module
-- =============================================

USE SudhanTextileERP;
GO

-- =============================================
-- GET NEXT DOCUMENT NUMBER
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
            SET @DefaultPrefix = LEFT(@DocumentType, 2) + '/';
            
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
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- CREATE YARN RECEIPT
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateYarnReceipt
    @ReceiptDate DATE,
    @PartyId INT,
    @VehicleId INT = NULL,
    @VehicleNo NVARCHAR(20) = NULL,
    @DriverName NVARCHAR(100) = NULL,
    @FinancialYearId INT,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedBy NVARCHAR(100),
    @Details YarnReceiptDetailType READONLY,
    @NewReceiptId INT OUTPUT,
    @ReceiptNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get next receipt number
        EXEC sp_GetNextDocumentNumber 'YarnReceipt', @FinancialYearId, @ReceiptNumber OUTPUT;
        
        -- Insert receipt header
        INSERT INTO YarnReceipts (
            ReceiptNumber, ReceiptDate, PartyId, VehicleId, VehicleNo,
            DriverName, FinancialYearId, Remarks, CreatedBy
        )
        VALUES (
            @ReceiptNumber, @ReceiptDate, @PartyId, @VehicleId, @VehicleNo,
            @DriverName, @FinancialYearId, @Remarks, @CreatedBy
        );
        
        SET @NewReceiptId = SCOPE_IDENTITY();
        
        -- Insert receipt details
        INSERT INTO YarnReceiptDetails (
            YarnReceiptId, YarnCountId, LotNo, BagNo, GrossWeight,
            TareWeight, ConeCount, RatePerKg
        )
        SELECT
            @NewReceiptId, YarnCountId, LotNo, BagNo, GrossWeight,
            TareWeight, ConeCount, RatePerKg
        FROM @Details;
        
        -- Create yarn stock entries
        INSERT INTO YarnStock (
            YarnCountId, PartyId, LotNo, TransactionType, TransactionId,
            TransactionDate, InwardQtyKg, CurrentBalanceKg, FinancialYearId, CreatedBy
        )
        SELECT
            d.YarnCountId,
            @PartyId,
            d.LotNo,
            'YarnReceipt',
            @NewReceiptId,
            @ReceiptDate,
            d.GrossWeight - d.TareWeight,  -- Net weight
            d.GrossWeight - d.TareWeight,
            @FinancialYearId,
            @CreatedBy
        FROM @Details d;
        
        COMMIT TRANSACTION;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Create table type for yarn receipt details
IF TYPE_ID('YarnReceiptDetailType') IS NOT NULL
    DROP TYPE YarnReceiptDetailType;

CREATE TYPE YarnReceiptDetailType AS TABLE (
    YarnCountId INT,
    LotNo NVARCHAR(50),
    BagNo NVARCHAR(20),
    GrossWeight DECIMAL(18,3),
    TareWeight DECIMAL(18,3),
    ConeCount INT,
    RatePerKg DECIMAL(18,2)
);
GO

-- =============================================
-- CREATE WARPING JOB CARD
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateWarpingJobCard
    @SetNo NVARCHAR(50),
    @JobCardDate DATE,
    @PartyId INT,
    @YarnCountId INT,
    @LotNo NVARCHAR(50),
    @TotalEnds INT,
    @EndsPerBeam INT,
    @SetLength DECIMAL(18,2),
    @ActualLength DECIMAL(18,2) = NULL,
    @NumberOfBeams INT,
    @WarpingMachineNo NVARCHAR(20) = NULL,
    @FinancialYearId INT,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedBy NVARCHAR(100),
    @Beams dbo.BeamAllocationTableType READONLY,
    @NewJobCardId INT OUTPUT,
    @JobCardNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get next job card number
        EXEC sp_GetNextDocumentNumber 'WarpingJobCard', @FinancialYearId, @JobCardNumber OUTPUT;
        
        -- Insert job card
        INSERT INTO WarpingJobCards (
            JobCardNumber, SetNo, JobCardDate, PartyId, YarnCountId, LotNo,
            TotalEnds, EndsPerBeam, SetLength, ActualLength, NumberOfBeams,
            WarpingMachineNo, FinancialYearId, Remarks, CreatedBy
        )
        VALUES (
            @JobCardNumber, @SetNo, @JobCardDate, @PartyId, @YarnCountId, @LotNo,
            @TotalEnds, @EndsPerBeam, @SetLength, @ActualLength, @NumberOfBeams,
            @WarpingMachineNo, @FinancialYearId, @Remarks, @CreatedBy
        );
        
        SET @NewJobCardId = SCOPE_IDENTITY();
        
        -- Allocate beams
        INSERT INTO WarpingJobCardBeams (WarpingJobCardId, BeamId, BeamSequence, WarpingDate, EndsOnBeam)
        SELECT @NewJobCardId, BeamId, BeamSequence, @JobCardDate, EndsOnBeam
        FROM @Beams;
        
        -- Update beam status
        UPDATE Beams
        SET [Status] = 'InUse',
            CurrentJobCardId = @NewJobCardId,
            CurrentJobCardType = 'Warping',
            ModifiedDate = GETDATE(),
            ModifiedBy = @CreatedBy
        WHERE Id IN (SELECT BeamId FROM @Beams);
        
        COMMIT TRANSACTION;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Create table type for beam allocation
IF TYPE_ID('BeamAllocationTableType') IS NOT NULL
    DROP TYPE BeamAllocationTableType;

CREATE TYPE BeamAllocationTableType AS TABLE (
    BeamId INT,
    BeamSequence INT,
    EndsOnBeam INT
);
GO

-- =============================================
-- CREATE SIZING JOB CARD
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateSizingJobCard
    @JobCardDate DATE,
    @PartyId INT,
    @YarnCountId INT,
    @LotNo NVARCHAR(50),
    @SetNo NVARCHAR(50),
    @LoomTypeId INT = NULL,
    @TotalEnds INT,
    @SetLength DECIMAL(18,2),
    @SizingMachineNo NVARCHAR(20) = NULL,
    @SizeRecipe NVARCHAR(500) = NULL,
    @BeamWidth DECIMAL(10,2) = NULL,
    @FinancialYearId INT,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedBy NVARCHAR(100),
    @SourceWarpingBeams dbo.SizingSourceBeamType READONLY,
    @OutputSizingBeamId INT = NULL,
    @NewJobCardId INT OUTPUT,
    @JobCardNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get next job card number
        EXEC sp_GetNextDocumentNumber 'SizingJobCard', @FinancialYearId, @JobCardNumber OUTPUT;
        
        -- Insert job card
        INSERT INTO SizingJobCards (
            JobCardNumber, JobCardDate, PartyId, YarnCountId, LotNo, SetNo,
            LoomTypeId, TotalEnds, SetLength, SizingMachineNo, SizeRecipe,
            BeamWidth, OutputSizingBeamId, FinancialYearId, Remarks, CreatedBy
        )
        VALUES (
            @JobCardNumber, @JobCardDate, @PartyId, @YarnCountId, @LotNo, @SetNo,
            @LoomTypeId, @TotalEnds, @SetLength, @SizingMachineNo, @SizeRecipe,
            @BeamWidth, @OutputSizingBeamId, @FinancialYearId, @Remarks, @CreatedBy
        );
        
        SET @NewJobCardId = SCOPE_IDENTITY();
        
        -- Link source warping beams
        INSERT INTO SizingJobCardBeams (SizingJobCardId, BeamId, BeamSequence, EndsOnBeam)
        SELECT @NewJobCardId, BeamId, BeamSequence, EndsOnBeam
        FROM @SourceWarpingBeams;
        
        -- Update source beam status
        UPDATE Beams
        SET [Status] = 'InUse',
            CurrentJobCardId = @NewJobCardId,
            CurrentJobCardType = 'Sizing',
            ModifiedDate = GETDATE(),
            ModifiedBy = @CreatedBy
        WHERE Id IN (SELECT BeamId FROM @SourceWarpingBeams);
        
        -- Update output sizing beam if provided
        IF @OutputSizingBeamId IS NOT NULL
        BEGIN
            UPDATE Beams
            SET [Status] = 'InUse',
                CurrentJobCardId = @NewJobCardId,
                CurrentJobCardType = 'SizingOutput',
                ModifiedDate = GETDATE(),
                ModifiedBy = @CreatedBy
            WHERE Id = @OutputSizingBeamId;
        END
        
        COMMIT TRANSACTION;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Create table type for sizing source beams
IF TYPE_ID('SizingSourceBeamType') IS NOT NULL
    DROP TYPE SizingSourceBeamType;

CREATE TYPE SizingSourceBeamType AS TABLE (
    BeamId INT,
    BeamSequence INT,
    EndsOnBeam INT
);
GO

-- =============================================
-- COMPLETE SIZING JOB CARD
-- =============================================
CREATE OR ALTER PROCEDURE sp_CompleteSizingJobCard
    @SizingJobCardId INT,
    @ActualLength DECIMAL(18,2),
    @OutputWeight DECIMAL(18,3) = NULL,
    @SizingDate DATE,
    @CompletedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Update sizing job card
        UPDATE SizingJobCards
        SET ActualLength = @ActualLength,
            OutputWeight = @OutputWeight,
            SizingDate = @SizingDate,
            [Status] = 'Completed',
            ModifiedDate = GETDATE(),
            ModifiedBy = @CompletedBy
        WHERE Id = @SizingJobCardId;
        
        -- Release source beams (back to available)
        UPDATE b
        SET b.[Status] = 'Available',
            b.CurrentJobCardId = NULL,
            b.CurrentJobCardType = NULL,
            b.ModifiedDate = GETDATE(),
            b.ModifiedBy = @CompletedBy
        FROM Beams b
        INNER JOIN SizingJobCardBeams sjb ON sjb.BeamId = b.Id
        WHERE sjb.SizingJobCardId = @SizingJobCardId;
        
        -- Update output sizing beam status
        UPDATE b
        SET b.[Status] = 'SizingComplete',
            b.ModifiedDate = GETDATE(),
            b.ModifiedBy = @CompletedBy
        FROM Beams b
        INNER JOIN SizingJobCards sj ON sj.OutputSizingBeamId = b.Id
        WHERE sj.Id = @SizingJobCardId;
        
        COMMIT TRANSACTION;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- APPROVE SIZING JOB CARD
-- =============================================
CREATE OR ALTER PROCEDURE sp_ApproveSizingJobCard
    @SizingJobCardId INT,
    @ApprovalLevel NVARCHAR(20),  -- 'Prepare', 'Check', 'Approve', 'Authorize'
    @ApprovedBy NVARCHAR(100),
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentStatus NVARCHAR(20);
    DECLARE @NewStatus NVARCHAR(20);
    
    SELECT @CurrentStatus = [Status]
    FROM SizingJobCards
    WHERE Id = @SizingJobCardId;
    
    -- Validate approval sequence
    IF @ApprovalLevel = 'Prepare' AND @CurrentStatus <> 'Draft'
        RAISERROR('Can only prepare from Draft status', 16, 1);
    ELSE IF @ApprovalLevel = 'Check' AND @CurrentStatus <> 'Prepared'
        RAISERROR('Can only check from Prepared status', 16, 1);
    ELSE IF @ApprovalLevel = 'Approve' AND @CurrentStatus <> 'Checked'
        RAISERROR('Can only approve from Checked status', 16, 1);
    ELSE IF @ApprovalLevel = 'Authorize' AND @CurrentStatus <> 'Approved'
        RAISERROR('Can only authorize from Approved status', 16, 1);
    
    SET @NewStatus = 
        CASE @ApprovalLevel
            WHEN 'Prepare' THEN 'Prepared'
            WHEN 'Check' THEN 'Checked'
            WHEN 'Approve' THEN 'Approved'
            WHEN 'Authorize' THEN 'Authorized'
        END;
    
    UPDATE SizingJobCards
    SET [Status] = @NewStatus,
        PreparedBy = CASE WHEN @ApprovalLevel = 'Prepare' THEN @ApprovedBy ELSE PreparedBy END,
        PreparedDate = CASE WHEN @ApprovalLevel = 'Prepare' THEN GETDATE() ELSE PreparedDate END,
        CheckedBy = CASE WHEN @ApprovalLevel = 'Check' THEN @ApprovedBy ELSE CheckedBy END,
        CheckedDate = CASE WHEN @ApprovalLevel = 'Check' THEN GETDATE() ELSE CheckedDate END,
        ApprovedBy = CASE WHEN @ApprovalLevel = 'Approve' THEN @ApprovedBy ELSE ApprovedBy END,
        ApprovedDate = CASE WHEN @ApprovalLevel = 'Approve' THEN GETDATE() ELSE ApprovedDate END,
        AuthorizedBy = CASE WHEN @ApprovalLevel = 'Authorize' THEN @ApprovedBy ELSE AuthorizedBy END,
        AuthorizedDate = CASE WHEN @ApprovalLevel = 'Authorize' THEN GETDATE() ELSE AuthorizedDate END,
        ModifiedDate = GETDATE(),
        ModifiedBy = @ApprovedBy
    WHERE Id = @SizingJobCardId;
    
    -- Log approval
    INSERT INTO AuditTrail (TableName, RecordId, Action, NewValues, PerformedBy)
    VALUES ('SizingJobCards', @SizingJobCardId, 'Approval', 
            '{"approvalLevel":"' + @ApprovalLevel + '","newStatus":"' + @NewStatus + '","remarks":"' + ISNULL(@Remarks, '') + '"}',
            @ApprovedBy);
    
    RETURN 0;
END
GO

-- =============================================
-- CREATE TAX INVOICE
-- =============================================
CREATE OR ALTER PROCEDURE sp_CreateTaxInvoice
    @InvoiceDate DATE,
    @PartyId INT,
    @PlaceOfSupply NVARCHAR(100),
    @IsInterState BIT,
    @FinancialYearId INT,
    @DueDate DATE = NULL,
    @TransportMode NVARCHAR(50) = NULL,
    @VehicleNo NVARCHAR(20) = NULL,
    @Remarks NVARCHAR(500) = NULL,
    @CreatedBy NVARCHAR(100),
    @LineItems dbo.InvoiceLineItemType READONLY,
    @NewInvoiceId INT OUTPUT,
    @InvoiceNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get next invoice number
        EXEC sp_GetNextDocumentNumber 'TaxInvoice', @FinancialYearId, @InvoiceNumber OUTPUT;
        
        -- Calculate totals
        DECLARE @TaxableAmount DECIMAL(18,2);
        DECLARE @CGSTAmount DECIMAL(18,2) = 0;
        DECLARE @SGSTAmount DECIMAL(18,2) = 0;
        DECLARE @IGSTAmount DECIMAL(18,2) = 0;
        DECLARE @TotalAmount DECIMAL(18,2);
        
        SELECT @TaxableAmount = SUM(Amount)
        FROM @LineItems;
        
        IF @IsInterState = 1
        BEGIN
            SELECT @IGSTAmount = SUM(Amount * IGSTRate / 100)
            FROM @LineItems;
        END
        ELSE
        BEGIN
            SELECT @CGSTAmount = SUM(Amount * CGSTRate / 100),
                   @SGSTAmount = SUM(Amount * SGSTRate / 100)
            FROM @LineItems;
        END
        
        SET @TotalAmount = @TaxableAmount + @CGSTAmount + @SGSTAmount + @IGSTAmount;
        
        -- Insert invoice header
        INSERT INTO TaxInvoices (
            InvoiceNumber, InvoiceDate, PartyId, PlaceOfSupply, IsInterState,
            TaxableAmount, CGSTAmount, SGSTAmount, IGSTAmount, TotalAmount, RoundOff,
            GrandTotal, FinancialYearId, DueDate, TransportMode, VehicleNo, Remarks, CreatedBy
        )
        VALUES (
            @InvoiceNumber, @InvoiceDate, @PartyId, @PlaceOfSupply, @IsInterState,
            @TaxableAmount, @CGSTAmount, @SGSTAmount, @IGSTAmount, @TotalAmount, 
            ROUND(@TotalAmount, 0) - @TotalAmount,
            ROUND(@TotalAmount, 0), @FinancialYearId, @DueDate, @TransportMode, @VehicleNo, @Remarks, @CreatedBy
        );
        
        SET @NewInvoiceId = SCOPE_IDENTITY();
        
        -- Insert line items
        INSERT INTO TaxInvoiceDetails (
            TaxInvoiceId, SizingJobCardId, Description, HSNCode, Quantity, UOM,
            Rate, Amount, CGSTRate, CGSTAmount, SGSTRate, SGSTAmount, IGSTRate, IGSTAmount
        )
        SELECT
            @NewInvoiceId, SizingJobCardId, [Description], HSNCode, Quantity, UOM,
            Rate, Amount,
            CASE WHEN @IsInterState = 0 THEN CGSTRate ELSE 0 END,
            CASE WHEN @IsInterState = 0 THEN Amount * CGSTRate / 100 ELSE 0 END,
            CASE WHEN @IsInterState = 0 THEN SGSTRate ELSE 0 END,
            CASE WHEN @IsInterState = 0 THEN Amount * SGSTRate / 100 ELSE 0 END,
            CASE WHEN @IsInterState = 1 THEN IGSTRate ELSE 0 END,
            CASE WHEN @IsInterState = 1 THEN Amount * IGSTRate / 100 ELSE 0 END
        FROM @LineItems;
        
        -- Update sizing job cards as invoiced
        UPDATE SizingJobCards
        SET InvoiceId = @NewInvoiceId,
            ModifiedDate = GETDATE(),
            ModifiedBy = @CreatedBy
        WHERE Id IN (SELECT SizingJobCardId FROM @LineItems WHERE SizingJobCardId IS NOT NULL);
        
        COMMIT TRANSACTION;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Create table type for invoice line items
IF TYPE_ID('InvoiceLineItemType') IS NOT NULL
    DROP TYPE InvoiceLineItemType;

CREATE TYPE InvoiceLineItemType AS TABLE (
    SizingJobCardId INT NULL,
    [Description] NVARCHAR(500),
    HSNCode NVARCHAR(8),
    Quantity DECIMAL(18,3),
    UOM NVARCHAR(20),
    Rate DECIMAL(18,2),
    Amount DECIMAL(18,2),
    CGSTRate DECIMAL(5,2),
    SGSTRate DECIMAL(5,2),
    IGSTRate DECIMAL(5,2)
);
GO

-- =============================================
-- GET YARN STOCK BY PARTY
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetYarnStockByParty
    @PartyId INT = NULL,
    @YarnCountId INT = NULL,
    @AsOnDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @AsOnDate IS NULL
        SET @AsOnDate = GETDATE();
    
    SELECT 
        p.PartyCode,
        p.PartyName,
        yc.CountCode,
        yc.CountDescription,
        ys.LotNo,
        SUM(ys.InwardQtyKg) AS TotalInward,
        SUM(ys.OutwardQtyKg) AS TotalOutward,
        SUM(ys.InwardQtyKg) - SUM(ys.OutwardQtyKg) AS BalanceQtyKg
    FROM YarnStock ys
    INNER JOIN Parties p ON ys.PartyId = p.Id
    INNER JOIN YarnCounts yc ON ys.YarnCountId = yc.Id
    WHERE ys.TransactionDate <= @AsOnDate
    AND (@PartyId IS NULL OR ys.PartyId = @PartyId)
    AND (@YarnCountId IS NULL OR ys.YarnCountId = @YarnCountId)
    GROUP BY p.PartyCode, p.PartyName, yc.CountCode, yc.CountDescription, ys.LotNo
    HAVING SUM(ys.InwardQtyKg) - SUM(ys.OutwardQtyKg) > 0
    ORDER BY p.PartyName, yc.CountCode, ys.LotNo;
END
GO

-- =============================================
-- GET PENDING SIZING JOB CARDS FOR INVOICE
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetPendingSizingForInvoice
    @PartyId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sj.Id,
        sj.JobCardNumber,
        sj.JobCardDate,
        sj.SetNo,
        p.PartyCode,
        p.PartyName,
        yc.CountCode,
        sj.TotalEnds,
        sj.ActualLength,
        sj.OutputWeight,
        sj.[Status],
        sc.RateAmount AS ChargeRate,
        sj.ActualLength * sc.RateAmount AS CalculatedAmount
    FROM SizingJobCards sj
    INNER JOIN Parties p ON sj.PartyId = p.Id
    INNER JOIN YarnCounts yc ON sj.YarnCountId = yc.Id
    LEFT JOIN SizingCharges sc ON sc.PartyId = sj.PartyId 
        AND (sc.YarnCountId = sj.YarnCountId OR sc.YarnCountId IS NULL)
        AND sc.IsActive = 1
    WHERE sj.[Status] = 'Authorized'
    AND sj.InvoiceId IS NULL
    AND (@PartyId IS NULL OR sj.PartyId = @PartyId)
    ORDER BY sj.JobCardDate, sj.JobCardNumber;
END
GO

-- =============================================
-- DASHBOARD STATISTICS
-- =============================================
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
    @FinancialYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get current FY if not provided
    IF @FinancialYearId IS NULL
    BEGIN
        SELECT TOP 1 @FinancialYearId = Id
        FROM FinancialYears
        WHERE GETDATE() BETWEEN StartDate AND EndDate
        AND IsActive = 1;
    END
    
    -- Today's stats
    SELECT
        -- Yarn Receipts
        (SELECT COUNT(*) FROM YarnReceipts WHERE CAST(ReceiptDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayYarnReceipts,
        (SELECT ISNULL(SUM(yrd.GrossWeight - yrd.TareWeight), 0) 
         FROM YarnReceiptDetails yrd
         INNER JOIN YarnReceipts yr ON yr.Id = yrd.YarnReceiptId
         WHERE CAST(yr.ReceiptDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayYarnReceiptKg,
        
        -- Sizing Job Cards
        (SELECT COUNT(*) FROM SizingJobCards WHERE CAST(JobCardDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodaySizingCards,
        (SELECT ISNULL(SUM(ActualLength), 0) FROM SizingJobCards 
         WHERE CAST(SizingDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodaySizingMeters,
        
        -- Pending Approvals
        (SELECT COUNT(*) FROM SizingJobCards WHERE [Status] IN ('Draft', 'Prepared', 'Checked', 'Approved')) AS PendingApprovals,
        
        -- Pending Invoices
        (SELECT COUNT(*) FROM SizingJobCards WHERE [Status] = 'Authorized' AND InvoiceId IS NULL) AS PendingForInvoice,
        
        -- Month Stats
        (SELECT COUNT(*) FROM YarnReceipts 
         WHERE FinancialYearId = @FinancialYearId 
         AND MONTH(ReceiptDate) = MONTH(GETDATE()) AND YEAR(ReceiptDate) = YEAR(GETDATE())) AS MonthYarnReceipts,
        
        (SELECT ISNULL(SUM(ActualLength), 0) FROM SizingJobCards 
         WHERE FinancialYearId = @FinancialYearId
         AND MONTH(SizingDate) = MONTH(GETDATE()) AND YEAR(SizingDate) = YEAR(GETDATE())) AS MonthSizingMeters,
        
        (SELECT ISNULL(SUM(GrandTotal), 0) FROM TaxInvoices 
         WHERE FinancialYearId = @FinancialYearId
         AND MONTH(InvoiceDate) = MONTH(GETDATE()) AND YEAR(InvoiceDate) = YEAR(GETDATE())) AS MonthInvoiceValue,
        
        -- Available Beams
        (SELECT COUNT(*) FROM Beams WHERE [Status] = 'Available' AND BeamType = 'Sizing Beam') AS AvailableSizingBeams,
        (SELECT COUNT(*) FROM Beams WHERE [Status] = 'Available' AND BeamType = 'Warping Beam') AS AvailableWarpingBeams;
END
GO

PRINT 'Stored procedures created successfully!';
GO
