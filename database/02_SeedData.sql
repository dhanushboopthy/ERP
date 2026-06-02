-- =============================================
-- SUDHAN TEXTILE ERP - SEED DATA
-- Initial data for masters and configuration
-- =============================================

USE SudhanTextileERP;
GO

-- =============================================
-- ROLES
-- =============================================
INSERT INTO Roles (RoleName, RoleDescription, Permissions, CreatedBy)
VALUES 
('SuperAdmin', 'Full system access with all permissions', '["*"]', 'System'),
('Admin', 'Administrative access for masters and reports', '["masters.*", "sizing.*", "reports.*", "settings.users"]', 'System'),
('Manager', 'Manager access for approvals and reports', '["sizing.view", "sizing.approve", "reports.*"]', 'System'),
('Operator', 'Operator access for data entry', '["sizing.create", "sizing.edit", "sizing.view"]', 'System'),
('Viewer', 'Read-only access to view data', '["sizing.view", "reports.view"]', 'System');
GO

-- =============================================
-- USERS
-- =============================================
-- Password: Admin@123 (hashed)
INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, CreatedBy)
VALUES 
('admin', 'admin@sudhan.com', 'AQAAAAEAACcQAAAAEPxxxxxxxxxxxxxxxxxxx', 'System Administrator', 1, 'System'),
('manager', 'manager@sudhan.com', 'AQAAAAEAACcQAAAAEPxxxxxxxxxxxxxxxxxxx', 'Production Manager', 3, 'System'),
('operator1', 'operator1@sudhan.com', 'AQAAAAEAACcQAAAAEPxxxxxxxxxxxxxxxxxxx', 'Machine Operator 1', 4, 'System'),
('operator2', 'operator2@sudhan.com', 'AQAAAAEAACcQAAAAEPxxxxxxxxxxxxxxxxxxx', 'Machine Operator 2', 4, 'System');
GO

-- =============================================
-- COMPANY MASTER
-- =============================================
INSERT INTO Companies (
    CompanyName, ShortName, AddressLine1, AddressLine2, City, [State], StateCode,
    Pincode, Country, Phone, Email, Website, GSTIN, PAN, BankName, BankBranch,
    BankAccountNo, BankIFSC, CreatedBy
)
VALUES (
    'Sudhan Textile Mills Pvt Ltd',
    'STMPL',
    '123, Industrial Estate, SIPCOT',
    'Near Water Tank Road',
    'Erode',
    'Tamil Nadu',
    '33',
    '638001',
    'India',
    '0424-2345678',
    'info@sudhantextile.com',
    'www.sudhantextile.com',
    '33AABCS1234A1Z5',
    'AABCS1234A',
    'State Bank of India',
    'Erode Main Branch',
    '38574950238',
    'SBIN0001234',
    'System'
);
GO

-- =============================================
-- FINANCIAL YEARS
-- =============================================
INSERT INTO FinancialYears (YearCode, YearName, StartDate, EndDate, CreatedBy)
VALUES 
('2023-24', 'FY 2023-24', '2023-04-01', '2024-03-31', 'System'),
('2024-25', 'FY 2024-25', '2024-04-01', '2025-03-31', 'System'),
('2025-26', 'FY 2025-26', '2025-04-01', '2026-03-31', 'System');
GO

-- =============================================
-- YARN COUNTS
-- =============================================
INSERT INTO YarnCounts (CountCode, CountDescription, Ply, CreatedBy)
VALUES 
('20s 2/100', '20s Double 100 Ply', 2, 'System'),
('30s 2/80', '30s Double 80 Ply', 2, 'System'),
('30s 2/100', '30s Double 100 Ply', 2, 'System'),
('30s 2/120', '30s Double 120 Ply', 2, 'System'),
('40s 2/80', '40s Double 80 Ply', 2, 'System'),
('40s 2/100', '40s Double 100 Ply', 2, 'System'),
('40s 2/120', '40s Double 120 Ply', 2, 'System'),
('60s 2/60', '60s Double 60 Ply', 2, 'System'),
('60s 2/80', '60s Double 80 Ply', 2, 'System'),
('80s 2/60', '80s Double 60 Ply', 2, 'System'),
('2/10s', '2 Ply 10s Count', 2, 'System'),
('2/20s', '2 Ply 20s Count', 2, 'System'),
('2/40s', '2 Ply 40s Count', 2, 'System'),
('Ne 40/1', 'Compact 40s Single', 1, 'System'),
('Ne 60/1', 'Compact 60s Single', 1, 'System');
GO

-- =============================================
-- LOOM TYPES
-- =============================================
INSERT INTO LoomTypes (LoomTypeCode, LoomTypeName, WidthInches, CreatedBy)
VALUES 
('SUL-190', 'Sulzer 190"', 190, 'System'),
('SUL-220', 'Sulzer 220"', 220, 'System'),
('SUL-260', 'Sulzer 260"', 260, 'System'),
('PIC-190', 'Picanol 190"', 190, 'System'),
('PIC-220', 'Picanol 220"', 220, 'System'),
('TOY-170', 'Toyota 170"', 170, 'System'),
('TOY-190', 'Toyota 190"', 190, 'System'),
('TOY-210', 'Toyota 210"', 210, 'System'),
('DOR-170', 'Dornier 170"', 170, 'System'),
('DOR-190', 'Dornier 190"', 190, 'System'),
('RAP-170', 'Rapier 170"', 170, 'System'),
('RAP-190', 'Rapier 190"', 190, 'System');
GO

-- =============================================
-- BEAMS
-- =============================================
-- Sizing Beams
INSERT INTO Beams (BeamNo, BeamType, TareWeight, WidthInches, MaxEnds, [Status], CreatedBy)
VALUES 
('SB-001', 'Sizing Beam', 85.500, 260, 6000, 'Available', 'System'),
('SB-002', 'Sizing Beam', 85.250, 260, 6000, 'Available', 'System'),
('SB-003', 'Sizing Beam', 86.000, 260, 6000, 'InUse', 'System'),
('SB-004', 'Sizing Beam', 85.750, 260, 6000, 'InUse', 'System'),
('SB-005', 'Sizing Beam', 85.500, 260, 6000, 'Available', 'System'),
('SB-006', 'Sizing Beam', 85.250, 220, 5000, 'Available', 'System'),
('SB-007', 'Sizing Beam', 84.000, 220, 5000, 'Available', 'System'),
('SB-008', 'Sizing Beam', 84.500, 220, 5000, 'Maintenance', 'System'),
('SB-009', 'Sizing Beam', 72.500, 190, 4500, 'Available', 'System'),
('SB-010', 'Sizing Beam', 72.250, 190, 4500, 'InUse', 'System');

-- Warping Beams
INSERT INTO Beams (BeamNo, BeamType, TareWeight, WidthInches, MaxEnds, [Status], CreatedBy)
VALUES 
('WB-001', 'Warping Beam', 45.500, 260, 800, 'Available', 'System'),
('WB-002', 'Warping Beam', 45.250, 260, 800, 'Available', 'System'),
('WB-003', 'Warping Beam', 45.750, 260, 800, 'InUse', 'System'),
('WB-004', 'Warping Beam', 45.500, 260, 800, 'InUse', 'System'),
('WB-005', 'Warping Beam', 45.250, 260, 800, 'Available', 'System'),
('WB-006', 'Warping Beam', 44.000, 220, 700, 'Available', 'System'),
('WB-007', 'Warping Beam', 44.500, 220, 700, 'InUse', 'System'),
('WB-008', 'Warping Beam', 38.500, 190, 600, 'Available', 'System'),
('WB-009', 'Warping Beam', 38.250, 190, 600, 'Available', 'System'),
('WB-010', 'Warping Beam', 38.750, 190, 600, 'Maintenance', 'System');
GO

-- =============================================
-- VEHICLES
-- =============================================
INSERT INTO Vehicles (VehicleNo, VehicleType, DriverName, DriverPhone, OwnerName, CreatedBy)
VALUES 
('TN 33 AB 1234', 'Truck', 'Raman', '9876543210', 'Sudhan Textile', 'System'),
('TN 38 CD 5678', 'Tempo', 'Kumar', '9876543211', 'Sudhan Textile', 'System'),
('TN 39 EF 9012', 'Mini Truck', 'Selvam', '9876543212', 'Sudhan Textile', 'System'),
('TN 33 GH 3456', 'Truck', 'Murugan', '9876543213', 'External', 'System'),
('TN 36 IJ 7890', 'Container', 'Kannan', '9876543214', 'External', 'System'),
('TN 38 KL 2345', 'Tempo', 'Senthil', '9876543215', 'External', 'System');
GO

-- =============================================
-- PARTIES
-- =============================================
-- Customers (Jobwork)
INSERT INTO Parties (
    PartyCode, PartyName, PartyType, AddressLine1, AddressLine2, City, [State], StateCode,
    Pincode, Phone, Email, GSTIN, PAN, CreditDays, CreditLimit, IsBillToBill, CreatedBy
)
VALUES 
('P001', 'Rajesh Textiles Pvt Ltd', 'Customer', '45, Mill Road', 'Near Bus Stand', 'Erode', 'Tamil Nadu', '33', '638001', '9876543210', 'rajesh@rajeshtextiles.com', '33AABCT1234Z1Z5', 'AABCT1234Z', 30, 500000.00, 1, 'System'),
('P002', 'Krishna Mills', 'Customer', '78, Industrial Area', 'Phase 2', 'Coimbatore', 'Tamil Nadu', '33', '641025', '9876543220', 'info@krishnamills.com', '33AABCK5678M1M9', 'AABCK5678M', 45, 750000.00, 1, 'System'),
('P003', 'Lakshmi Weaving Works', 'Customer', '23, Weaving Street', 'Main Road', 'Tirupur', 'Tamil Nadu', '33', '641601', '9876543230', 'lakshmi@lakshmweaving.com', '33AABCL9012P1P3', 'AABCL9012P', 30, 400000.00, 0, 'System'),
('P004', 'Sakthi Looms', 'Customer', '56, Loom Colony', 'Industrial Estate', 'Salem', 'Tamil Nadu', '33', '636001', '9876543240', 'sakthi@sakthilooms.com', '33AABCS3456Q1Q7', 'AABCS3456Q', 30, 300000.00, 1, 'System'),
('P005', 'Vinayaka Tex Industries', 'Customer', '12, Textile Park', 'Near Railway Station', 'Karur', 'Tamil Nadu', '33', '639001', '9876543250', 'info@vinayakatex.com', '33AABCV7890R1R1', 'AABCV7890R', 21, 250000.00, 0, 'System'),
('P006', 'Gujarat Textiles Ltd', 'Customer', '89, GIDC Industrial', 'Sector 5', 'Ahmedabad', 'Gujarat', '24', '380015', '9876543260', 'sales@gujarattex.com', '24AABCG9012N1N3', 'AABCG9012N', 45, 1000000.00, 1, 'System'),
('P007', 'Maharashtra Fabrics', 'Customer', '34, MIDC Area', 'Bhosari', 'Pune', 'Maharashtra', '27', '411026', '9876543270', 'info@maharashtrafab.com', '27AABCM4567O1O5', 'AABCM4567O', 30, 600000.00, 1, 'System');

-- Vendors (Yarn Suppliers)
INSERT INTO Parties (
    PartyCode, PartyName, PartyType, AddressLine1, AddressLine2, City, [State], StateCode,
    Pincode, Phone, Email, GSTIN, PAN, CreditDays, CreatedBy
)
VALUES 
('V001', 'Lakshmi Cotton Mills', 'Vendor', '100, Spinning Complex', 'Industrial Area', 'Coimbatore', 'Tamil Nadu', '33', '641018', '9876543300', 'sales@lakshmicotton.com', '33AADCL1234A1A5', 'AADCL1234A', 60, 'System'),
('V002', 'Sakthi Spinning Mills', 'Vendor', '55, Spinning Zone', 'SIPCOT', 'Salem', 'Tamil Nadu', '33', '636109', '9876543310', 'info@sakthispinning.com', '33AADCS5678B1B9', 'AADCS5678B', 45, 'System'),
('V003', 'Coimbatore Cotton Mills', 'Vendor', '200, Mills Road', 'Saravanampatty', 'Coimbatore', 'Tamil Nadu', '33', '641035', '9876543320', 'sales@cbecotton.com', '33AADCC9012C1C3', 'AADCC9012C', 30, 'System'),
('V004', 'Erode Yarn Mills', 'Vendor', '75, Yarn Complex', 'Bhavani Road', 'Erode', 'Tamil Nadu', '33', '638009', '9876543330', 'info@erodeyarn.com', '33AADCE3456D1D7', 'AADCE3456D', 45, 'System'),
('V005', 'Tirupur Spinning Ltd', 'Vendor', '150, Spinning Estate', 'Avinashi Road', 'Tirupur', 'Tamil Nadu', '33', '641603', '9876543340', 'sales@tirupurspin.com', '33AADCT7890E1E1', 'AADCT7890E', 60, 'System');
GO

-- =============================================
-- DOCUMENT NUMBER SERIES
-- =============================================
DECLARE @FY2024Id INT = (SELECT Id FROM FinancialYears WHERE YearCode = '2024-25');

INSERT INTO DocumentNumberSeries (DocumentType, FinancialYearId, Prefix, CurrentNumber, PadLength, CreatedBy)
VALUES 
('YarnReceipt', @FY2024Id, 'YR/24-25/', 156, 6, 'System'),
('WarpingJobCard', @FY2024Id, 'WP/24-25/', 98, 6, 'System'),
('SizingJobCard', @FY2024Id, 'SET/24-25/', 145, 6, 'System'),
('YarnReturnDC', @FY2024Id, 'RDC/24-25/', 45, 6, 'System'),
('YarnDeliveryDC', @FY2024Id, 'DDC/24-25/', 32, 6, 'System'),
('TaxInvoice', @FY2024Id, 'INV/24-25/', 89, 6, 'System');
GO

-- =============================================
-- SIZING CHARGES
-- =============================================
INSERT INTO SizingCharges (PartyId, ChargeType, YarnCountId, RateAmount, EffectiveFrom, CreatedBy)
SELECT 
    p.Id,
    'PerMeter',
    NULL,
    0.85,
    '2024-04-01',
    'System'
FROM Parties p
WHERE p.PartyType = 'Customer';
GO

PRINT 'Seed data inserted successfully!';
GO
