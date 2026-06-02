-- =============================================
-- SUDHAN TEXTILE ERP - SIZING MODULE
-- Database Creation Script for SQL Server
-- =============================================

USE master;
GO

-- Create Database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SudhanTextileERP')
BEGIN
    CREATE DATABASE SudhanTextileERP;
END
GO

USE SudhanTextileERP;
GO

-- =============================================
-- MASTER TABLES
-- =============================================

-- Company Master
CREATE TABLE Companies (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(200) NOT NULL,
    ShortName NVARCHAR(50) NOT NULL,
    AddressLine1 NVARCHAR(200) NOT NULL,
    AddressLine2 NVARCHAR(200) NULL,
    City NVARCHAR(100) NOT NULL,
    [State] NVARCHAR(100) NOT NULL,
    StateCode CHAR(2) NOT NULL,
    Pincode CHAR(6) NOT NULL,
    Country NVARCHAR(100) NOT NULL DEFAULT 'India',
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Website NVARCHAR(200) NULL,
    GSTIN CHAR(15) NOT NULL,
    PAN CHAR(10) NOT NULL,
    CIN NVARCHAR(21) NULL,
    BankName NVARCHAR(100) NULL,
    BankBranch NVARCHAR(100) NULL,
    BankAccountNo NVARCHAR(20) NULL,
    BankIFSC CHAR(11) NULL,
    LogoUrl NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Companies_GSTIN UNIQUE (GSTIN),
    CONSTRAINT UQ_Companies_PAN UNIQUE (PAN)
);
GO

-- Financial Year Master
CREATE TABLE FinancialYears (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    YearCode NVARCHAR(10) NOT NULL,
    YearName NVARCHAR(50) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsClosed BIT NOT NULL DEFAULT 0,
    ClosedBy NVARCHAR(100) NULL,
    ClosedAt DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_FinancialYears_YearCode UNIQUE (YearCode),
    CONSTRAINT CHK_FinancialYears_Dates CHECK (EndDate > StartDate)
);
GO

-- Party Master
CREATE TABLE Parties (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PartyCode NVARCHAR(20) NOT NULL,
    PartyName NVARCHAR(200) NOT NULL,
    PartyType NVARCHAR(20) NOT NULL CHECK (PartyType IN ('Customer', 'Vendor', 'Jobwork')),
    AddressLine1 NVARCHAR(200) NOT NULL,
    AddressLine2 NVARCHAR(200) NULL,
    City NVARCHAR(100) NOT NULL,
    [State] NVARCHAR(100) NOT NULL,
    StateCode CHAR(2) NOT NULL,
    Pincode CHAR(6) NOT NULL,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    GSTIN CHAR(15) NULL,
    PAN CHAR(10) NULL,
    CreditDays INT NOT NULL DEFAULT 0,
    CreditLimit DECIMAL(18,2) NOT NULL DEFAULT 0,
    CommissionPercent DECIMAL(5,2) NOT NULL DEFAULT 0,
    LedgerCategoryId INT NULL,
    IsBillToBill BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Parties_PartyCode UNIQUE (PartyCode)
);
GO

CREATE INDEX IX_Parties_PartyType ON Parties(PartyType);
CREATE INDEX IX_Parties_GSTIN ON Parties(GSTIN);
GO

-- Yarn Count Master
CREATE TABLE YarnCounts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CountCode NVARCHAR(50) NOT NULL,
    CountDescription NVARCHAR(200) NOT NULL,
    Ply INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_YarnCounts_CountCode UNIQUE (CountCode)
);
GO

-- Loom Type Master
CREATE TABLE LoomTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LoomTypeCode NVARCHAR(50) NOT NULL,
    LoomTypeName NVARCHAR(100) NOT NULL,
    WidthInches DECIMAL(6,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_LoomTypes_LoomTypeCode UNIQUE (LoomTypeCode)
);
GO

-- Beam Master
CREATE TABLE Beams (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BeamNo NVARCHAR(50) NOT NULL,
    BeamType NVARCHAR(50) NOT NULL,
    TareWeight DECIMAL(10,3) NOT NULL,
    WidthInches DECIMAL(6,2) NOT NULL,
    MaxEnds INT NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Available' CHECK ([Status] IN ('Available', 'InUse', 'Maintenance', 'Issued')),
    CurrentLocation NVARCHAR(100) NULL,
    LastMaintenanceDate DATE NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Beams_BeamNo UNIQUE (BeamNo)
);
GO

CREATE INDEX IX_Beams_Status ON Beams([Status]);
GO

-- Vehicle Master
CREATE TABLE Vehicles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    VehicleNo NVARCHAR(20) NOT NULL,
    VehicleType NVARCHAR(50) NOT NULL,
    DriverName NVARCHAR(100) NULL,
    DriverPhone NVARCHAR(15) NULL,
    OwnerName NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Vehicles_VehicleNo UNIQUE (VehicleNo)
);
GO

-- Document Number Series
CREATE TABLE DocumentNumberSeries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DocumentType NVARCHAR(50) NOT NULL CHECK (DocumentType IN ('YarnReceipt', 'WarpingJobCard', 'SizingJobCard', 'YarnReturnDC', 'YarnDeliveryDC', 'TaxInvoice')),
    FinancialYearId INT NOT NULL,
    Prefix NVARCHAR(20) NOT NULL,
    CurrentNumber INT NOT NULL DEFAULT 0,
    PadLength INT NOT NULL DEFAULT 6,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT FK_DocumentNumberSeries_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT UQ_DocumentNumberSeries_Type_FY UNIQUE (DocumentType, FinancialYearId)
);
GO

-- =============================================
-- SIZING ERP TABLES
-- =============================================

-- Yarn Receipt (Inward)
CREATE TABLE YarnReceipts (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ReceiptNo NVARCHAR(50) NOT NULL,
    ReceiptDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PDCNo NVARCHAR(50) NULL,
    PDCDate DATE NULL,
    PartyId INT NOT NULL,
    MillName NVARCHAR(200) NULL,
    VehicleId INT NULL,
    DriverName NVARCHAR(100) NULL,
    DriverPhone NVARCHAR(15) NULL,
    Remarks NVARCHAR(500) NULL,
    TotalBags INT NOT NULL DEFAULT 0,
    TotalCones INT NOT NULL DEFAULT 0,
    TotalGrossWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    TotalTareWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    TotalNetWeight AS (TotalGrossWeight - TotalTareWeight) PERSISTED,
    IsUsedInJobCard BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_YarnReceipts_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_YarnReceipts_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_YarnReceipts_Vehicle FOREIGN KEY (VehicleId) REFERENCES Vehicles(Id),
    CONSTRAINT UQ_YarnReceipts_ReceiptNo UNIQUE (ReceiptNo)
);
GO

CREATE INDEX IX_YarnReceipts_ReceiptDate ON YarnReceipts(ReceiptDate);
CREATE INDEX IX_YarnReceipts_PartyId ON YarnReceipts(PartyId);
GO

-- Yarn Receipt Details
CREATE TABLE YarnReceiptDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    YarnReceiptId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    Bags INT NOT NULL,
    Cones INT NOT NULL,
    ConesPerBag INT NOT NULL,
    WeightPerCone DECIMAL(8,3) NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    CONSTRAINT FK_YarnReceiptDetails_YarnReceipt FOREIGN KEY (YarnReceiptId) REFERENCES YarnReceipts(Id) ON DELETE CASCADE,
    CONSTRAINT FK_YarnReceiptDetails_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
    CONSTRAINT CHK_YarnReceiptDetails_Weights CHECK (GrossWeight >= TareWeight)
);
GO

CREATE INDEX IX_YarnReceiptDetails_YarnReceiptId ON YarnReceiptDetails(YarnReceiptId);
CREATE INDEX IX_YarnReceiptDetails_LotNo ON YarnReceiptDetails(LotNo);
GO

-- Baby Cone / Winding
CREATE TABLE BabyCones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BabyConeNo NVARCHAR(50) NOT NULL,
    BabyConeDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    YarnReceiptId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    BagNo INT NOT NULL,
    TotalCones INT NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    WindingLoss DECIMAL(10,3) NOT NULL DEFAULT 0,
    LeftoverWeight DECIMAL(10,3) NOT NULL DEFAULT 0,
    IsUsedInWarping BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_BabyCones_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_BabyCones_YarnReceipt FOREIGN KEY (YarnReceiptId) REFERENCES YarnReceipts(Id),
    CONSTRAINT FK_BabyCones_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
    CONSTRAINT UQ_BabyCones_BabyConeNo UNIQUE (BabyConeNo)
);
GO

-- Warping Job Card
CREATE TABLE WarpingJobCards (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    WarpingNo NVARCHAR(50) NOT NULL,
    WarpingDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PartyId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    TotalEnds INT NOT NULL,
    TotalMeters DECIMAL(12,2) NOT NULL,
    RPMSpeed INT NULL,
    StartTime DATETIME2 NULL,
    EndTime DATETIME2 NULL,
    BreakCount INT NOT NULL DEFAULT 0,
    MachineNo NVARCHAR(50) NULL,
    OperatorName NVARCHAR(100) NULL,
    RemnantCones INT NOT NULL DEFAULT 0,
    WasteWeight DECIMAL(10,3) NOT NULL DEFAULT 0,
    ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (ApprovalStatus IN ('Draft', 'Prepared', 'Checked', 'GMApproved', 'Authorized', 'Rejected')),
    Remarks NVARCHAR(500) NULL,
    IsKarlMayer BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_WarpingJobCards_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_WarpingJobCards_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_WarpingJobCards_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
    CONSTRAINT UQ_WarpingJobCards_WarpingNo UNIQUE (WarpingNo)
);
GO

CREATE INDEX IX_WarpingJobCards_WarpingDate ON WarpingJobCards(WarpingDate);
CREATE INDEX IX_WarpingJobCards_ApprovalStatus ON WarpingJobCards(ApprovalStatus);
GO

-- Warping Beam Details
CREATE TABLE WarpingBeamDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    WarpingJobCardId INT NOT NULL,
    BeamId INT NOT NULL,
    BeamSequence INT NOT NULL,
    Ends INT NOT NULL,
    Meters DECIMAL(12,2) NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    CONSTRAINT FK_WarpingBeamDetails_WarpingJobCard FOREIGN KEY (WarpingJobCardId) REFERENCES WarpingJobCards(Id) ON DELETE CASCADE,
    CONSTRAINT FK_WarpingBeamDetails_Beam FOREIGN KEY (BeamId) REFERENCES Beams(Id)
);
GO

-- Warping Yarn Consumption
CREATE TABLE WarpingYarnConsumption (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    WarpingJobCardId INT NOT NULL,
    BabyConeId INT NULL,
    YarnReceiptDetailId INT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    ConesUsed INT NOT NULL,
    WeightUsed DECIMAL(12,3) NOT NULL,
    CONSTRAINT FK_WarpingYarnConsumption_WarpingJobCard FOREIGN KEY (WarpingJobCardId) REFERENCES WarpingJobCards(Id) ON DELETE CASCADE,
    CONSTRAINT FK_WarpingYarnConsumption_BabyCone FOREIGN KEY (BabyConeId) REFERENCES BabyCones(Id),
    CONSTRAINT FK_WarpingYarnConsumption_YarnReceiptDetail FOREIGN KEY (YarnReceiptDetailId) REFERENCES YarnReceiptDetails(Id),
    CONSTRAINT FK_WarpingYarnConsumption_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
);
GO

-- Sizing Job Card (Set Report)
CREATE TABLE SizingJobCards (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SetNo NVARCHAR(50) NOT NULL,
    SetDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PartyId INT NOT NULL,
    LoomTypeId INT NOT NULL,
    YarnCountId INT NOT NULL,
    TotalEnds INT NOT NULL,
    WarpingMeters DECIMAL(12,2) NOT NULL,
    SizingMeters DECIMAL(12,2) NOT NULL DEFAULT 0,
    PickupPercent DECIMAL(5,2) NOT NULL DEFAULT 0,
    ElongationPercent DECIMAL(5,2) NOT NULL DEFAULT 0,
    BeamCount INT NOT NULL DEFAULT 0,
    MachineNo NVARCHAR(50) NULL,
    OperatorName NVARCHAR(100) NULL,
    RecipeDetails NVARCHAR(1000) NULL,
    ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (ApprovalStatus IN ('Draft', 'Prepared', 'Checked', 'GMApproved', 'Authorized', 'Rejected')),
    PreparedBy NVARCHAR(100) NULL,
    PreparedAt DATETIME2 NULL,
    CheckedBy NVARCHAR(100) NULL,
    CheckedAt DATETIME2 NULL,
    GMApprovedBy NVARCHAR(100) NULL,
    GMApprovedAt DATETIME2 NULL,
    AuthorizedBy NVARCHAR(100) NULL,
    AuthorizedAt DATETIME2 NULL,
    Remarks NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_SizingJobCards_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_SizingJobCards_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_SizingJobCards_LoomType FOREIGN KEY (LoomTypeId) REFERENCES LoomTypes(Id),
    CONSTRAINT FK_SizingJobCards_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
    CONSTRAINT UQ_SizingJobCards_SetNo UNIQUE (SetNo),
    CONSTRAINT CHK_SizingJobCards_PickupPercent CHECK (PickupPercent >= 0 AND PickupPercent <= 25),
    CONSTRAINT CHK_SizingJobCards_ElongationPercent CHECK (ElongationPercent >= 0 AND ElongationPercent <= 5)
);
GO

CREATE INDEX IX_SizingJobCards_SetDate ON SizingJobCards(SetDate);
CREATE INDEX IX_SizingJobCards_PartyId ON SizingJobCards(PartyId);
CREATE INDEX IX_SizingJobCards_ApprovalStatus ON SizingJobCards(ApprovalStatus);
GO

-- Sizing Beam Details
CREATE TABLE SizingBeamDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SizingJobCardId INT NOT NULL,
    BeamId INT NOT NULL,
    BeamSequence INT NOT NULL,
    Ends INT NOT NULL,
    Meters DECIMAL(12,2) NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    IsEmptyBeamReturned BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_SizingBeamDetails_SizingJobCard FOREIGN KEY (SizingJobCardId) REFERENCES SizingJobCards(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SizingBeamDetails_Beam FOREIGN KEY (BeamId) REFERENCES Beams(Id)
);
GO

-- Sizing Yarn Taken
CREATE TABLE SizingYarnTaken (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SizingJobCardId INT NOT NULL,
    WarpingJobCardId INT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    BeamsTaken INT NOT NULL,
    WeightTaken DECIMAL(12,3) NOT NULL,
    CONSTRAINT FK_SizingYarnTaken_SizingJobCard FOREIGN KEY (SizingJobCardId) REFERENCES SizingJobCards(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SizingYarnTaken_WarpingJobCard FOREIGN KEY (WarpingJobCardId) REFERENCES WarpingJobCards(Id),
    CONSTRAINT FK_SizingYarnTaken_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
);
GO

-- Yarn Stock Ledger
CREATE TABLE YarnStockLedger (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LedgerDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    TransactionType NVARCHAR(20) NOT NULL CHECK (TransactionType IN ('IN', 'OUT', 'RETURN', 'DELIVERY', 'ADJUSTMENT')),
    ReferenceType NVARCHAR(50) NOT NULL,
    ReferenceId INT NOT NULL,
    ReferenceNo NVARCHAR(50) NOT NULL,
    InQty INT NOT NULL DEFAULT 0,
    OutQty INT NOT NULL DEFAULT 0,
    BalanceQty INT NOT NULL,
    InWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    OutWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    BalanceWeight DECIMAL(12,3) NOT NULL,
    Remarks NVARCHAR(500) NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT FK_YarnStockLedger_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_YarnStockLedger_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id),
    CONSTRAINT CHK_YarnStockLedger_BalanceWeight CHECK (BalanceWeight >= 0)
);
GO

CREATE INDEX IX_YarnStockLedger_LedgerDate ON YarnStockLedger(LedgerDate);
CREATE INDEX IX_YarnStockLedger_YarnCountId ON YarnStockLedger(YarnCountId);
CREATE INDEX IX_YarnStockLedger_LotNo ON YarnStockLedger(LotNo);
GO

-- Yarn Return
CREATE TABLE YarnReturns (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DCNo NVARCHAR(50) NOT NULL,
    DCDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PartyId INT NOT NULL,
    ReturnType NVARCHAR(20) NOT NULL CHECK (ReturnType IN ('Mill', 'Jobwork')),
    SizingJobCardId INT NULL,
    VehicleId INT NULL,
    TotalWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    Remarks NVARCHAR(500) NULL,
    IsNotForSale BIT NOT NULL DEFAULT 1,
    ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Draft',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_YarnReturns_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_YarnReturns_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_YarnReturns_SizingJobCard FOREIGN KEY (SizingJobCardId) REFERENCES SizingJobCards(Id),
    CONSTRAINT FK_YarnReturns_Vehicle FOREIGN KEY (VehicleId) REFERENCES Vehicles(Id),
    CONSTRAINT UQ_YarnReturns_DCNo UNIQUE (DCNo)
);
GO

-- Yarn Return Details
CREATE TABLE YarnReturnDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    YarnReturnId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    Bags INT NOT NULL,
    Cones INT NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    CONSTRAINT FK_YarnReturnDetails_YarnReturn FOREIGN KEY (YarnReturnId) REFERENCES YarnReturns(Id) ON DELETE CASCADE,
    CONSTRAINT FK_YarnReturnDetails_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
);
GO

-- Yarn Delivery
CREATE TABLE YarnDeliveries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    DCNo NVARCHAR(50) NOT NULL,
    DCDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PartyId INT NOT NULL,
    VehicleId INT NULL,
    DriverName NVARCHAR(100) NULL,
    TotalWeight DECIMAL(12,3) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Remarks NVARCHAR(500) NULL,
    ApprovalStatus NVARCHAR(20) NOT NULL DEFAULT 'Draft',
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_YarnDeliveries_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_YarnDeliveries_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_YarnDeliveries_Vehicle FOREIGN KEY (VehicleId) REFERENCES Vehicles(Id),
    CONSTRAINT UQ_YarnDeliveries_DCNo UNIQUE (DCNo)
);
GO

-- Yarn Delivery Details
CREATE TABLE YarnDeliveryDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    YarnDeliveryId INT NOT NULL,
    YarnCountId INT NOT NULL,
    LotNo NVARCHAR(50) NOT NULL,
    Bags INT NOT NULL,
    Cones INT NOT NULL,
    GrossWeight DECIMAL(12,3) NOT NULL,
    TareWeight DECIMAL(12,3) NOT NULL,
    NetWeight AS (GrossWeight - TareWeight) PERSISTED,
    RatePerKg DECIMAL(10,2) NOT NULL,
    Amount AS (GrossWeight - TareWeight) * RatePerKg PERSISTED,
    CONSTRAINT FK_YarnDeliveryDetails_YarnDelivery FOREIGN KEY (YarnDeliveryId) REFERENCES YarnDeliveries(Id) ON DELETE CASCADE,
    CONSTRAINT FK_YarnDeliveryDetails_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
);
GO

-- Sizing Charges
CREATE TABLE SizingCharges (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PartyId INT NOT NULL,
    ChargeType NVARCHAR(20) NOT NULL CHECK (ChargeType IN ('PerMeter', 'PerBeam', 'PerKg')),
    YarnCountId INT NULL,
    RateAmount DECIMAL(10,2) NOT NULL,
    EffectiveFrom DATE NOT NULL,
    EffectiveTo DATE NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT FK_SizingCharges_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT FK_SizingCharges_YarnCount FOREIGN KEY (YarnCountId) REFERENCES YarnCounts(Id)
);
GO

-- GST Tax Invoice
CREATE TABLE GstInvoices (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNo NVARCHAR(50) NOT NULL,
    InvoiceDate DATE NOT NULL,
    FinancialYearId INT NOT NULL,
    PartyId INT NOT NULL,
    PlaceOfSupply NVARCHAR(100) NOT NULL,
    StateCode CHAR(2) NOT NULL,
    IsInterState BIT NOT NULL DEFAULT 0,
    HsnSac NVARCHAR(10) NOT NULL DEFAULT '998821',
    TaxableAmount DECIMAL(18,2) NOT NULL,
    CGSTRate DECIMAL(5,2) NOT NULL DEFAULT 0,
    CGSTAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    SGSTRate DECIMAL(5,2) NOT NULL DEFAULT 0,
    SGSTAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    IGSTRate DECIMAL(5,2) NOT NULL DEFAULT 0,
    IGSTAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalTaxAmount AS (CGSTAmount + SGSTAmount + IGSTAmount) PERSISTED,
    RoundOff DECIMAL(8,2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18,2) NOT NULL,
    AmountInWords NVARCHAR(500) NOT NULL,
    DueDate DATE NOT NULL,
    IsPaid BIT NOT NULL DEFAULT 0,
    PaidDate DATE NULL,
    IsPrinted BIT NOT NULL DEFAULT 0,
    PrintedAt DATETIME2 NULL,
    IsLocked BIT NOT NULL DEFAULT 0,
    Remarks NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    RowVersion ROWVERSION,
    CONSTRAINT FK_GstInvoices_FinancialYear FOREIGN KEY (FinancialYearId) REFERENCES FinancialYears(Id),
    CONSTRAINT FK_GstInvoices_Party FOREIGN KEY (PartyId) REFERENCES Parties(Id),
    CONSTRAINT UQ_GstInvoices_InvoiceNo UNIQUE (InvoiceNo)
);
GO

CREATE INDEX IX_GstInvoices_InvoiceDate ON GstInvoices(InvoiceDate);
CREATE INDEX IX_GstInvoices_PartyId ON GstInvoices(PartyId);
CREATE INDEX IX_GstInvoices_IsPaid ON GstInvoices(IsPaid);
GO

-- GST Invoice Details
CREATE TABLE GstInvoiceDetails (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    GstInvoiceId INT NOT NULL,
    SizingJobCardId INT NULL,
    [Description] NVARCHAR(500) NOT NULL,
    Quantity DECIMAL(12,2) NOT NULL,
    Unit NVARCHAR(20) NOT NULL,
    Rate DECIMAL(12,2) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_GstInvoiceDetails_GstInvoice FOREIGN KEY (GstInvoiceId) REFERENCES GstInvoices(Id) ON DELETE CASCADE,
    CONSTRAINT FK_GstInvoiceDetails_SizingJobCard FOREIGN KEY (SizingJobCardId) REFERENCES SizingJobCards(Id)
);
GO

-- =============================================
-- AUDIT & SECURITY TABLES
-- =============================================

-- Users
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    FullName NVARCHAR(200) NOT NULL,
    RoleId INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    LastLoginAt DATETIME2 NULL,
    PasswordChangedAt DATETIME2 NULL,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-- Roles
CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL,
    RoleDescription NVARCHAR(500) NULL,
    Permissions NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedBy NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME2 NULL,
    CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
);
GO

ALTER TABLE Users
ADD CONSTRAINT FK_Users_Role FOREIGN KEY (RoleId) REFERENCES Roles(Id);
GO

-- Audit Logs
CREATE TABLE AuditLogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(100) NOT NULL,
    RecordId INT NOT NULL,
    [Action] NVARCHAR(20) NOT NULL CHECK ([Action] IN ('INSERT', 'UPDATE', 'DELETE')),
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    ChangedBy NVARCHAR(100) NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    IpAddress NVARCHAR(50) NULL,
    UserAgent NVARCHAR(500) NULL
);
GO

CREATE INDEX IX_AuditLogs_TableName ON AuditLogs(TableName);
CREATE INDEX IX_AuditLogs_RecordId ON AuditLogs(RecordId);
CREATE INDEX IX_AuditLogs_ChangedAt ON AuditLogs(ChangedAt);
GO

-- =============================================
-- VIEWS FOR REPORTS
-- =============================================

-- Yarn Stock Summary View
CREATE VIEW vw_YarnStockSummary AS
SELECT 
    yc.Id AS YarnCountId,
    yc.CountCode,
    yc.CountDescription,
    ysl.LotNo,
    fy.YearCode AS FinancialYear,
    SUM(ysl.InWeight) AS TotalInWeight,
    SUM(ysl.OutWeight) AS TotalOutWeight,
    SUM(ysl.InWeight) - SUM(ysl.OutWeight) AS BalanceWeight,
    SUM(ysl.InQty) AS TotalInQty,
    SUM(ysl.OutQty) AS TotalOutQty,
    SUM(ysl.InQty) - SUM(ysl.OutQty) AS BalanceQty
FROM YarnStockLedger ysl
INNER JOIN YarnCounts yc ON ysl.YarnCountId = yc.Id
INNER JOIN FinancialYears fy ON ysl.FinancialYearId = fy.Id
GROUP BY yc.Id, yc.CountCode, yc.CountDescription, ysl.LotNo, fy.YearCode;
GO

-- Set-wise Production View
CREATE VIEW vw_SetWiseProduction AS
SELECT 
    sjc.Id,
    sjc.SetNo,
    sjc.SetDate,
    p.PartyName,
    yc.CountCode AS YarnCount,
    lt.LoomTypeName AS LoomType,
    sjc.TotalEnds,
    sjc.WarpingMeters,
    sjc.SizingMeters,
    sjc.PickupPercent,
    sjc.ElongationPercent,
    sjc.BeamCount,
    sjc.ApprovalStatus,
    sjc.PreparedBy,
    sjc.PreparedAt,
    sjc.CheckedBy,
    sjc.CheckedAt,
    sjc.GMApprovedBy,
    sjc.GMApprovedAt,
    sjc.AuthorizedBy,
    sjc.AuthorizedAt,
    fy.YearCode AS FinancialYear
FROM SizingJobCards sjc
INNER JOIN Parties p ON sjc.PartyId = p.Id
INNER JOIN YarnCounts yc ON sjc.YarnCountId = yc.Id
INNER JOIN LoomTypes lt ON sjc.LoomTypeId = lt.Id
INNER JOIN FinancialYears fy ON sjc.FinancialYearId = fy.Id
WHERE sjc.IsActive = 1;
GO

-- Invoice Register View
CREATE VIEW vw_InvoiceRegister AS
SELECT 
    gi.Id,
    gi.InvoiceNo,
    gi.InvoiceDate,
    p.PartyName,
    p.GSTIN AS PartyGSTIN,
    gi.PlaceOfSupply,
    gi.IsInterState,
    gi.TaxableAmount,
    gi.CGSTAmount,
    gi.SGSTAmount,
    gi.IGSTAmount,
    gi.TotalTaxAmount,
    gi.TotalAmount,
    gi.DueDate,
    gi.IsPaid,
    CASE 
        WHEN gi.IsPaid = 1 THEN 0
        ELSE DATEDIFF(DAY, gi.DueDate, GETDATE())
    END AS DaysOverdue,
    fy.YearCode AS FinancialYear
FROM GstInvoices gi
INNER JOIN Parties p ON gi.PartyId = p.Id
INNER JOIN FinancialYears fy ON gi.FinancialYearId = fy.Id
WHERE gi.IsActive = 1;
GO

-- Beam Utilization View
CREATE VIEW vw_BeamUtilization AS
SELECT 
    b.Id AS BeamId,
    b.BeamNo,
    b.BeamType,
    b.TareWeight,
    b.[Status],
    b.CurrentLocation,
    COUNT(DISTINCT sbd.SizingJobCardId) AS TotalSizingUsage,
    COUNT(DISTINCT wbd.WarpingJobCardId) AS TotalWarpingUsage,
    MAX(sjc.SetDate) AS LastUsedDate,
    MAX(sjc.SetNo) AS LastUsedInSet
FROM Beams b
LEFT JOIN SizingBeamDetails sbd ON b.Id = sbd.BeamId
LEFT JOIN SizingJobCards sjc ON sbd.SizingJobCardId = sjc.Id
LEFT JOIN WarpingBeamDetails wbd ON b.Id = wbd.BeamId
GROUP BY b.Id, b.BeamNo, b.BeamType, b.TareWeight, b.[Status], b.CurrentLocation;
GO

PRINT 'Database schema created successfully!';
GO
