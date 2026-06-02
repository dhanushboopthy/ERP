-- ========================================
-- Sudhan Textile ERP - MySQL Database Creation Script
-- Database: u244866688_ERP
-- Created: 2026-01-20
-- ========================================

-- Instructions:
-- 1. Open phpMyAdmin (already open in your browser)
-- 2. Select database 'u244866688_ERP' from left sidebar
-- 3. Click on 'SQL' tab
-- 4. Copy and paste this entire script
-- 5. Click 'Go' button to execute
-- ========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ========================================
-- CORE TABLES
-- ========================================

-- Roles Table
CREATE TABLE IF NOT EXISTS `Roles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) NOT NULL,
  `Description` varchar(200) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Roles_RoleName` (`RoleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS `Users` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `PasswordHash` varchar(500) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `RoleId` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `LastLogin` datetime(6) DEFAULT NULL,
  `FailedLoginAttempts` int NOT NULL DEFAULT '0',
  `LockoutEnd` datetime(6) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Users_Username` (`Username`),
  UNIQUE KEY `IX_Users_Email` (`Email`),
  KEY `IX_Users_RoleId` (`RoleId`),
  CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules Table
CREATE TABLE IF NOT EXISTS `Modules` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ModuleKey` varchar(50) NOT NULL,
  `ModuleName` varchar(100) NOT NULL,
  `ParentModule` varchar(50) NOT NULL,
  `RoutePath` varchar(200) DEFAULT NULL,
  `Icon` varchar(50) DEFAULT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `SortOrder` int NOT NULL DEFAULT '0',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Modules_ModuleKey` (`ModuleKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions Table
CREATE TABLE IF NOT EXISTS `Permissions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PermissionCode` varchar(100) NOT NULL,
  `PermissionName` varchar(100) NOT NULL,
  `ModuleId` int NOT NULL,
  `ModuleKey` varchar(50) NOT NULL,
  `Action` varchar(20) NOT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Permissions_PermissionCode` (`PermissionCode`),
  KEY `IX_Permissions_ModuleId` (`ModuleId`),
  CONSTRAINT `FK_Permissions_Modules_ModuleId` FOREIGN KEY (`ModuleId`) REFERENCES `Modules` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RolePermissions Table
CREATE TABLE IF NOT EXISTS `RolePermissions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `RoleId` int NOT NULL,
  `PermissionId` int NOT NULL,
  `GrantedBy` varchar(50) NOT NULL,
  `GrantedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_RolePermissions_RoleId_PermissionId` (`RoleId`,`PermissionId`),
  KEY `IX_RolePermissions_PermissionId` (`PermissionId`),
  CONSTRAINT `FK_RolePermissions_Permissions_PermissionId` FOREIGN KEY (`PermissionId`) REFERENCES `Permissions` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_RolePermissions_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies Table
CREATE TABLE IF NOT EXISTS `Companies` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CompanyName` varchar(200) NOT NULL,
  `Address` varchar(500) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Pincode` varchar(20) DEFAULT NULL,
  `GSTNo` varchar(20) DEFAULT NULL,
  `PhoneNo` varchar(20) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FinancialYears Table
CREATE TABLE IF NOT EXISTS `FinancialYears` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CompanyId` int NOT NULL,
  `YearName` varchar(50) NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `IsClosed` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_FinancialYears_CompanyId` (`CompanyId`),
  CONSTRAINT `FK_FinancialYears_Companies_CompanyId` FOREIGN KEY (`CompanyId`) REFERENCES `Companies` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parties Table (Suppliers/Customers)
CREATE TABLE IF NOT EXISTS `Parties` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PartyCode` varchar(20) NOT NULL,
  `PartyName` varchar(200) NOT NULL,
  `PartyType` varchar(20) NOT NULL,
  `Address` varchar(500) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL,
  `State` varchar(100) DEFAULT NULL,
  `Pincode` varchar(20) DEFAULT NULL,
  `GSTNo` varchar(20) DEFAULT NULL,
  `PhoneNo` varchar(20) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `ContactPerson` varchar(100) DEFAULT NULL,
  `OpeningBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CreditLimit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CreditDays` int NOT NULL DEFAULT '0',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Parties_PartyCode` (`PartyCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnCounts Table
CREATE TABLE IF NOT EXISTS `YarnCounts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `YarnCountName` varchar(50) NOT NULL,
  `Description` varchar(200) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_YarnCounts_YarnCountName` (`YarnCountName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LoomTypes Table
CREATE TABLE IF NOT EXISTS `LoomTypes` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `LoomTypeName` varchar(50) NOT NULL,
  `Description` varchar(200) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_LoomTypes_LoomTypeName` (`LoomTypeName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Beams Table
CREATE TABLE IF NOT EXISTS `Beams` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `BeamNo` varchar(50) NOT NULL,
  `Description` varchar(200) DEFAULT NULL,
  `LoomTypeId` int DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Beams_BeamNo` (`BeamNo`),
  KEY `IX_Beams_LoomTypeId` (`LoomTypeId`),
  CONSTRAINT `FK_Beams_LoomTypes_LoomTypeId` FOREIGN KEY (`LoomTypeId`) REFERENCES `LoomTypes` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Table
CREATE TABLE IF NOT EXISTS `Vehicles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `VehicleNo` varchar(20) NOT NULL,
  `VehicleName` varchar(100) DEFAULT NULL,
  `Description` varchar(200) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Vehicles_VehicleNo` (`VehicleNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DocumentNumberSeries Table
CREATE TABLE IF NOT EXISTS `DocumentNumberSeries` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `DocumentType` varchar(50) NOT NULL,
  `Prefix` varchar(20) DEFAULT NULL,
  `NextNumber` int NOT NULL DEFAULT '1',
  `Suffix` varchar(20) DEFAULT NULL,
  `FinancialYearId` int NOT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_DocumentNumberSeries_FinancialYearId` (`FinancialYearId`),
  CONSTRAINT `FK_DocumentNumberSeries_FinancialYears_FinancialYearId` FOREIGN KEY (`FinancialYearId`) REFERENCES `FinancialYears` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TRANSACTION TABLES
-- ========================================

-- YarnReceipts Table
CREATE TABLE IF NOT EXISTS `YarnReceipts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReceiptNo` varchar(50) NOT NULL,
  `ReceiptDate` datetime(6) NOT NULL,
  `PartyId` int NOT NULL,
  `VehicleId` int DEFAULT NULL,
  `TotalQuantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `TotalAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_YarnReceipts_ReceiptNo` (`ReceiptNo`),
  KEY `IX_YarnReceipts_PartyId` (`PartyId`),
  KEY `IX_YarnReceipts_VehicleId` (`VehicleId`),
  CONSTRAINT `FK_YarnReceipts_Parties_PartyId` FOREIGN KEY (`PartyId`) REFERENCES `Parties` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_YarnReceipts_Vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `Vehicles` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnReceiptDetails Table
CREATE TABLE IF NOT EXISTS `YarnReceiptDetails` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `YarnReceiptId` int NOT NULL,
  `YarnCountId` int NOT NULL,
  `Quantity` decimal(18,2) NOT NULL,
  `Rate` decimal(18,2) NOT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `LotNo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_YarnReceiptDetails_YarnReceiptId` (`YarnReceiptId`),
  KEY `IX_YarnReceiptDetails_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_YarnReceiptDetails_YarnReceipts_YarnReceiptId` FOREIGN KEY (`YarnReceiptId`) REFERENCES `YarnReceipts` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_YarnReceiptDetails_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WarpingJobCards Table
CREATE TABLE IF NOT EXISTS `WarpingJobCards` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `JobCardNo` varchar(50) NOT NULL,
  `JobCardDate` datetime(6) NOT NULL,
  `PartyId` int NOT NULL,
  `LoomTypeId` int NOT NULL,
  `TotalMeters` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Status` varchar(20) NOT NULL DEFAULT 'Pending',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_WarpingJobCards_JobCardNo` (`JobCardNo`),
  KEY `IX_WarpingJobCards_PartyId` (`PartyId`),
  KEY `IX_WarpingJobCards_LoomTypeId` (`LoomTypeId`),
  CONSTRAINT `FK_WarpingJobCards_Parties_PartyId` FOREIGN KEY (`PartyId`) REFERENCES `Parties` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_WarpingJobCards_LoomTypes_LoomTypeId` FOREIGN KEY (`LoomTypeId`) REFERENCES `LoomTypes` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WarpingJobCardBeams Table
CREATE TABLE IF NOT EXISTS `WarpingJobCardBeams` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `WarpingJobCardId` int NOT NULL,
  `BeamId` int NOT NULL,
  `YarnCountId` int NOT NULL,
  `Meters` decimal(18,2) NOT NULL,
  `Weight` decimal(18,2) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_WarpingJobCardBeams_WarpingJobCardId` (`WarpingJobCardId`),
  KEY `IX_WarpingJobCardBeams_BeamId` (`BeamId`),
  KEY `IX_WarpingJobCardBeams_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_WarpingJobCardBeams_WarpingJobCards_WarpingJobCardId` FOREIGN KEY (`WarpingJobCardId`) REFERENCES `WarpingJobCards` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_WarpingJobCardBeams_Beams_BeamId` FOREIGN KEY (`BeamId`) REFERENCES `Beams` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_WarpingJobCardBeams_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SizingJobCards Table
CREATE TABLE IF NOT EXISTS `SizingJobCards` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `JobCardNo` varchar(50) NOT NULL,
  `JobCardDate` datetime(6) NOT NULL,
  `WarpingJobCardId` int NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Pending',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_SizingJobCards_JobCardNo` (`JobCardNo`),
  KEY `IX_SizingJobCards_WarpingJobCardId` (`WarpingJobCardId`),
  CONSTRAINT `FK_SizingJobCards_WarpingJobCards_WarpingJobCardId` FOREIGN KEY (`WarpingJobCardId`) REFERENCES `WarpingJobCards` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SizingJobCardBeams Table
CREATE TABLE IF NOT EXISTS `SizingJobCardBeams` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `SizingJobCardId` int NOT NULL,
  `BeamId` int NOT NULL,
  `SizedMeters` decimal(18,2) NOT NULL,
  `SizedWeight` decimal(18,2) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_SizingJobCardBeams_SizingJobCardId` (`SizingJobCardId`),
  KEY `IX_SizingJobCardBeams_BeamId` (`BeamId`),
  CONSTRAINT `FK_SizingJobCardBeams_SizingJobCards_SizingJobCardId` FOREIGN KEY (`SizingJobCardId`) REFERENCES `SizingJobCards` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_SizingJobCardBeams_Beams_BeamId` FOREIGN KEY (`BeamId`) REFERENCES `Beams` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TaxInvoices Table
CREATE TABLE IF NOT EXISTS `TaxInvoices` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `InvoiceNo` varchar(50) NOT NULL,
  `InvoiceDate` datetime(6) NOT NULL,
  `PartyId` int NOT NULL,
  `TotalAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `TaxAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `GrandTotal` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_TaxInvoices_InvoiceNo` (`InvoiceNo`),
  KEY `IX_TaxInvoices_PartyId` (`PartyId`),
  CONSTRAINT `FK_TaxInvoices_Parties_PartyId` FOREIGN KEY (`PartyId`) REFERENCES `Parties` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TaxInvoiceDetails Table
CREATE TABLE IF NOT EXISTS `TaxInvoiceDetails` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TaxInvoiceId` int NOT NULL,
  `Description` varchar(200) NOT NULL,
  `HSNCode` varchar(20) DEFAULT NULL,
  `Quantity` decimal(18,2) NOT NULL,
  `Rate` decimal(18,2) NOT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `TaxRate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `TaxAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`Id`),
  KEY `IX_TaxInvoiceDetails_TaxInvoiceId` (`TaxInvoiceId`),
  CONSTRAINT `FK_TaxInvoiceDetails_TaxInvoices_TaxInvoiceId` FOREIGN KEY (`TaxInvoiceId`) REFERENCES `TaxInvoices` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnStocks Table
CREATE TABLE IF NOT EXISTS `YarnStocks` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `YarnCountId` int NOT NULL,
  `LotNo` varchar(50) DEFAULT NULL,
  `Quantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `LastUpdated` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_YarnStocks_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_YarnStocks_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BabyCones Table
CREATE TABLE IF NOT EXISTS `BabyCones` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ConeNo` varchar(50) NOT NULL,
  `YarnCountId` int NOT NULL,
  `Weight` decimal(18,2) NOT NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Available',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_BabyCones_ConeNo` (`ConeNo`),
  KEY `IX_BabyCones_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_BabyCones_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnReturns Table
CREATE TABLE IF NOT EXISTS `YarnReturns` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReturnNo` varchar(50) NOT NULL,
  `ReturnDate` datetime(6) NOT NULL,
  `PartyId` int NOT NULL,
  `TotalQuantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_YarnReturns_ReturnNo` (`ReturnNo`),
  KEY `IX_YarnReturns_PartyId` (`PartyId`),
  CONSTRAINT `FK_YarnReturns_Parties_PartyId` FOREIGN KEY (`PartyId`) REFERENCES `Parties` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnReturnDetails Table
CREATE TABLE IF NOT EXISTS `YarnReturnDetails` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `YarnReturnId` int NOT NULL,
  `YarnCountId` int NOT NULL,
  `Quantity` decimal(18,2) NOT NULL,
  `LotNo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_YarnReturnDetails_YarnReturnId` (`YarnReturnId`),
  KEY `IX_YarnReturnDetails_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_YarnReturnDetails_YarnReturns_YarnReturnId` FOREIGN KEY (`YarnReturnId`) REFERENCES `YarnReturns` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_YarnReturnDetails_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnDeliveries Table
CREATE TABLE IF NOT EXISTS `YarnDeliveries` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `DeliveryNo` varchar(50) NOT NULL,
  `DeliveryDate` datetime(6) NOT NULL,
  `PartyId` int NOT NULL,
  `VehicleId` int DEFAULT NULL,
  `TotalQuantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(500) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_YarnDeliveries_DeliveryNo` (`DeliveryNo`),
  KEY `IX_YarnDeliveries_PartyId` (`PartyId`),
  KEY `IX_YarnDeliveries_VehicleId` (`VehicleId`),
  CONSTRAINT `FK_YarnDeliveries_Parties_PartyId` FOREIGN KEY (`PartyId`) REFERENCES `Parties` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_YarnDeliveries_Vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `Vehicles` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- YarnDeliveryDetails Table
CREATE TABLE IF NOT EXISTS `YarnDeliveryDetails` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `YarnDeliveryId` int NOT NULL,
  `YarnCountId` int NOT NULL,
  `Quantity` decimal(18,2) NOT NULL,
  `LotNo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_YarnDeliveryDetails_YarnDeliveryId` (`YarnDeliveryId`),
  KEY `IX_YarnDeliveryDetails_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_YarnDeliveryDetails_YarnDeliveries_YarnDeliveryId` FOREIGN KEY (`YarnDeliveryId`) REFERENCES `YarnDeliveries` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_YarnDeliveryDetails_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AuditLogs Table
CREATE TABLE IF NOT EXISTS `AuditLogs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `Username` varchar(50) NOT NULL,
  `Action` varchar(100) NOT NULL,
  `TableName` varchar(100) DEFAULT NULL,
  `RecordId` int DEFAULT NULL,
  `OldValues` text DEFAULT NULL,
  `NewValues` text DEFAULT NULL,
  `IPAddress` varchar(50) DEFAULT NULL,
  `Timestamp` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_AuditLogs_UserId` (`UserId`),
  CONSTRAINT `FK_AuditLogs_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StockLedgers Table
CREATE TABLE IF NOT EXISTS `StockLedgers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TransactionDate` datetime(6) NOT NULL,
  `TransactionType` varchar(50) NOT NULL,
  `ReferenceNo` varchar(50) DEFAULT NULL,
  `YarnCountId` int NOT NULL,
  `LotNo` varchar(50) DEFAULT NULL,
  `InQuantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `OutQuantity` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Balance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_StockLedgers_YarnCountId` (`YarnCountId`),
  CONSTRAINT `FK_StockLedgers_YarnCounts_YarnCountId` FOREIGN KEY (`YarnCountId`) REFERENCES `YarnCounts` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SYSTEM CONFIGURATION TABLES
-- ========================================

-- ApprovalMatrix Table
CREATE TABLE IF NOT EXISTS `ApprovalMatrix` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `DocumentType` varchar(50) NOT NULL,
  `MinAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `MaxAmount` decimal(18,2) NOT NULL DEFAULT '999999999.99',
  `ApproverRoleId` int NOT NULL,
  `Sequence` int NOT NULL DEFAULT '1',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ApprovalMatrix_ApproverRoleId` (`ApproverRoleId`),
  CONSTRAINT `FK_ApprovalMatrix_Roles_ApproverRoleId` FOREIGN KEY (`ApproverRoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ApprovalHistories Table
CREATE TABLE IF NOT EXISTS `ApprovalHistories` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `DocumentType` varchar(50) NOT NULL,
  `DocumentId` int NOT NULL,
  `DocumentNo` varchar(50) NOT NULL,
  `ApproverUserId` int NOT NULL,
  `ApprovalStatus` varchar(20) NOT NULL,
  `Comments` varchar(500) DEFAULT NULL,
  `ApprovedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ApprovalHistories_ApproverUserId` (`ApproverUserId`),
  CONSTRAINT `FK_ApprovalHistories_Users_ApproverUserId` FOREIGN KEY (`ApproverUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SystemConfigurations Table
CREATE TABLE IF NOT EXISTS `SystemConfigurations` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ConfigKey` varchar(100) NOT NULL,
  `ConfigValue` text NOT NULL,
  `ConfigType` varchar(50) NOT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `IsEncrypted` tinyint(1) NOT NULL DEFAULT '0',
  `ModifiedBy` varchar(50) NOT NULL,
  `ModifiedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_SystemConfigurations_ConfigKey` (`ConfigKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SecurityPolicies Table
CREATE TABLE IF NOT EXISTS `SecurityPolicies` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PolicyName` varchar(100) NOT NULL,
  `PolicyType` varchar(50) NOT NULL,
  `PolicyValue` text NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `ModifiedBy` varchar(50) NOT NULL,
  `ModifiedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_SecurityPolicies_PolicyName` (`PolicyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BackupConfigurations Table
CREATE TABLE IF NOT EXISTS `BackupConfigurations` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `BackupName` varchar(100) NOT NULL,
  `BackupType` varchar(50) NOT NULL,
  `BackupPath` varchar(500) NOT NULL,
  `Schedule` varchar(100) NOT NULL,
  `RetentionDays` int NOT NULL DEFAULT '30',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `LastBackupDate` datetime(6) DEFAULT NULL,
  `CreatedBy` varchar(50) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(50) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NotificationSettings Table
CREATE TABLE IF NOT EXISTS `NotificationSettings` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `NotificationType` varchar(50) NOT NULL,
  `IsEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `EmailEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `SMSEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `ModifiedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_NotificationSettings_UserId` (`UserId`),
  CONSTRAINT `FK_NotificationSettings_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table (Real-time user notifications)
CREATE TABLE IF NOT EXISTS `Notifications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Type` varchar(50) NOT NULL COMMENT 'approval, invoice, stock, document, system',
  `Title` varchar(200) NOT NULL,
  `Message` varchar(1000) NOT NULL,
  `Priority` varchar(20) NOT NULL DEFAULT 'normal' COMMENT 'low, normal, high, urgent',
  `Link` varchar(500) DEFAULT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT '0',
  `ReadAt` datetime(6) DEFAULT NULL,
  `UserId` int DEFAULT NULL COMMENT 'Target user (NULL for broadcasts)',
  `RoleId` int DEFAULT NULL COMMENT 'Target role (NULL for user-specific or broadcasts)',
  `ReferenceType` varchar(100) DEFAULT NULL COMMENT 'SizingJobCard, TaxInvoice, etc.',
  `ReferenceId` int DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedBy` varchar(100) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `ModifiedBy` varchar(100) DEFAULT NULL,
  `ModifiedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Notifications_UserId_IsRead_CreatedDate` (`UserId`, `IsRead`, `CreatedDate`),
  KEY `IX_Notifications_RoleId` (`RoleId`),
  KEY `IX_Notifications_CreatedDate` (`CreatedDate`),
  CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Notifications_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- UserSessions Table
CREATE TABLE IF NOT EXISTS `UserSessions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `SessionToken` varchar(500) NOT NULL,
  `IPAddress` varchar(50) DEFAULT NULL,
  `UserAgent` varchar(500) DEFAULT NULL,
  `LoginTime` datetime(6) NOT NULL,
  `LastActivity` datetime(6) NOT NULL,
  `LogoutTime` datetime(6) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`Id`),
  KEY `IX_UserSessions_UserId` (`UserId`),
  CONSTRAINT `FK_UserSessions_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

-- ========================================
-- Database schema created successfully!
-- ========================================
-- Next: Your application will seed initial data (roles, users, modules) on first run
-- ========================================
