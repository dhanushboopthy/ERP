<?php
/**
 * Sudhan Textile ERP - Database Setup Script
 * This script creates all database tables and initial structure
 * 
 * Instructions:
 * 1. Upload this file to your Hostinger public_html directory
 * 2. Access it via browser: https://yourdomain.com/setup-database.php
 * 3. Run once to create all tables
 * 4. DELETE this file after successful setup (for security)
 */

// Database Configuration
define('DB_HOST', 'localhost'); // On Hostinger, use 'localhost'
define('DB_NAME', 'u244866688_ERP');
define('DB_USER', 'u244866688_ERP');
define('DB_PASS', '@ERP@Duolink12345678');
define('DB_PORT', '3306');

// Set execution time limit (this might take a while)
set_time_limit(300);
ini_set('memory_limit', '256M');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sudhan Textile ERP - Database Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { color: #cbd5e0; }
        .content {
            padding: 30px;
        }
        .status {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .success {
            background: #f0fdf4;
            border-color: #22c55e;
            color: #166534;
        }
        .error {
            background: #fef2f2;
            border-color: #ef4444;
            color: #991b1b;
        }
        .warning {
            background: #fffbeb;
            border-color: #f59e0b;
            color: #92400e;
        }
        .info {
            background: #eff6ff;
            border-color: #3b82f6;
            color: #1e40af;
        }
        .table-list {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        .table-item {
            padding: 8px;
            margin: 5px 0;
            background: white;
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success { background: #22c55e; color: white; }
        .badge-error { background: #ef4444; color: white; }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        .btn:hover { background: #2563eb; }
        .btn-danger {
            background: #ef4444;
        }
        .btn-danger:hover { background: #dc2626; }
        .progress {
            background: #e5e7eb;
            border-radius: 10px;
            height: 25px;
            margin: 20px 0;
            overflow: hidden;
        }
        .progress-bar {
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            height: 100%;
            transition: width 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏭 Sudhan Textile ERP</h1>
            <p>Database Setup & Installation</p>
        </div>
        <div class="content">
<?php

// Check if setup should run
if (isset($_GET['run']) && $_GET['run'] === 'setup') {
    
    echo '<h2>Setting up Database...</h2>';
    
    // Test Connection
    echo '<div class="status info"><strong>Step 1:</strong> Testing database connection...</div>';
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        
        echo '<div class="status success">✓ Database connection successful!</div>';
        
    } catch (PDOException $e) {
        echo '<div class="status error"><strong>✗ Connection Failed:</strong> ' . htmlspecialchars($e->getMessage()) . '</div>';
        echo '<div class="status warning">Please check your database credentials in this file.</div>';
        echo '</div></div></body></html>';
        exit;
    }
    
    // Create Tables
    echo '<div class="status info"><strong>Step 2:</strong> Creating database tables...</div>';
    
    $tables = [];
    $errors = [];
    $totalTables = 0;
    $successTables = 0;
    
    // SQL statements for table creation
    $sqlStatements = [
        'Roles' => "CREATE TABLE IF NOT EXISTS `Roles` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `RoleName` varchar(50) NOT NULL,
            `RoleDescription` varchar(200) DEFAULT NULL,
            `Permissions` text DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `IsSystemRole` tinyint(1) NOT NULL DEFAULT '0',
            `SortOrder` int NOT NULL DEFAULT '0',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Roles_RoleName` (`RoleName`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Users' => "CREATE TABLE IF NOT EXISTS `Users` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `Username` varchar(50) NOT NULL,
            `Email` varchar(100) NOT NULL,
            `PasswordHash` varchar(500) NOT NULL,
            `FullName` varchar(100) NOT NULL,
            `Mobile` varchar(20) DEFAULT NULL,
            `Department` varchar(100) DEFAULT NULL,
            `DefaultLocation` varchar(100) DEFAULT NULL,
            `RoleId` int NOT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `IsLocked` tinyint(1) NOT NULL DEFAULT '0',
            `LockReason` varchar(200) DEFAULT NULL,
            `LockedAt` datetime(6) DEFAULT NULL,
            `LastLoginDate` datetime(6) DEFAULT NULL,
            `LastLoginIp` varchar(50) DEFAULT NULL,
            `LastLoginDevice` varchar(200) DEFAULT NULL,
            `FailedLoginAttempts` int NOT NULL DEFAULT '0',
            `PasswordChangedAt` datetime(6) DEFAULT NULL,
            `PasswordExpiresAt` datetime(6) DEFAULT NULL,
            `MustChangePassword` tinyint(1) NOT NULL DEFAULT '0',
            `RefreshToken` varchar(500) DEFAULT NULL,
            `RefreshTokenExpiry` datetime(6) DEFAULT NULL,
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Users_Username` (`Username`),
            UNIQUE KEY `IX_Users_Email` (`Email`),
            KEY `IX_Users_RoleId` (`RoleId`),
            CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Modules' => "CREATE TABLE IF NOT EXISTS `Modules` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Permissions' => "CREATE TABLE IF NOT EXISTS `Permissions` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `PermissionCode` varchar(100) NOT NULL,
            `PermissionName` varchar(100) NOT NULL,
            `ModuleId` int NOT NULL,
            `ModuleKey` varchar(50) NOT NULL,
            `Action` varchar(20) NOT NULL,
            `Description` varchar(500) DEFAULT NULL,
            `SortOrder` int NOT NULL DEFAULT '0',
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Permissions_PermissionCode` (`PermissionCode`),
            KEY `IX_Permissions_ModuleId` (`ModuleId`),
            CONSTRAINT `FK_Permissions_Modules_ModuleId` FOREIGN KEY (`ModuleId`) REFERENCES `Modules` (`Id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'RolePermissions' => "CREATE TABLE IF NOT EXISTS `RolePermissions` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `RoleId` int NOT NULL,
            `PermissionId` int NOT NULL,
            `IsGranted` tinyint(1) NOT NULL DEFAULT '1',
            `GrantedBy` varchar(50) NOT NULL,
            `GrantedAt` datetime(6) NOT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_RolePermissions_RoleId_PermissionId` (`RoleId`,`PermissionId`),
            KEY `IX_RolePermissions_PermissionId` (`PermissionId`),
            CONSTRAINT `FK_RolePermissions_Permissions_PermissionId` FOREIGN KEY (`PermissionId`) REFERENCES `Permissions` (`Id`) ON DELETE CASCADE,
            CONSTRAINT `FK_RolePermissions_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Companies' => "CREATE TABLE IF NOT EXISTS `Companies` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `CompanyName` varchar(200) NOT NULL,
            `ShortName` varchar(50) DEFAULT NULL,
            `AddressLine1` varchar(200) DEFAULT NULL,
            `AddressLine2` varchar(200) DEFAULT NULL,
            `City` varchar(100) DEFAULT NULL,
            `State` varchar(100) DEFAULT NULL,
            `StateCode` varchar(10) DEFAULT NULL,
            `Pincode` varchar(20) DEFAULT NULL,
            `Country` varchar(100) DEFAULT 'India',
            `Phone` varchar(20) DEFAULT NULL,
            `Email` varchar(100) DEFAULT NULL,
            `Website` varchar(100) DEFAULT NULL,
            `GSTIN` varchar(20) DEFAULT NULL,
            `PAN` varchar(20) DEFAULT NULL,
            `BankName` varchar(100) DEFAULT NULL,
            `BankBranch` varchar(100) DEFAULT NULL,
            `BankAccountNo` varchar(50) DEFAULT NULL,
            `BankIFSC` varchar(20) DEFAULT NULL,
            `Logo` text DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'FinancialYears' => "CREATE TABLE IF NOT EXISTS `FinancialYears` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `YearCode` varchar(20) NOT NULL,
            `YearName` varchar(50) NOT NULL,
            `StartDate` datetime(6) NOT NULL,
            `EndDate` datetime(6) NOT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `IsCurrent` tinyint(1) NOT NULL DEFAULT '0',
            `IsClosed` tinyint(1) NOT NULL DEFAULT '0',
            `ClosedByUserId` int DEFAULT NULL,
            `ClosedAt` datetime(6) DEFAULT NULL,
            `ClosureRemarks` varchar(500) DEFAULT NULL,
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_FinancialYears_YearCode` (`YearCode`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Parties' => "CREATE TABLE IF NOT EXISTS `Parties` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `PartyCode` varchar(20) NOT NULL,
            `PartyName` varchar(200) NOT NULL,
            `PartyType` varchar(20) NOT NULL,
            `AddressLine1` varchar(200) DEFAULT NULL,
            `AddressLine2` varchar(200) DEFAULT NULL,
            `City` varchar(100) DEFAULT NULL,
            `State` varchar(100) DEFAULT NULL,
            `StateCode` varchar(10) DEFAULT NULL,
            `Pincode` varchar(20) DEFAULT NULL,
            `Country` varchar(100) DEFAULT 'India',
            `GSTIN` varchar(20) DEFAULT NULL,
            `PAN` varchar(20) DEFAULT NULL,
            `Phone` varchar(20) DEFAULT NULL,
            `Mobile` varchar(20) DEFAULT NULL,
            `Email` varchar(100) DEFAULT NULL,
            `ContactPerson` varchar(100) DEFAULT NULL,
            `OpeningBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
            `OpeningBalanceType` varchar(10) DEFAULT 'Dr',
            `CreditLimit` decimal(18,2) NOT NULL DEFAULT '0.00',
            `CreditDays` int NOT NULL DEFAULT '0',
            `IsBillToBill` tinyint(1) NOT NULL DEFAULT '0',
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Parties_PartyCode` (`PartyCode`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'YarnCounts' => "CREATE TABLE IF NOT EXISTS `YarnCounts` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `CountCode` varchar(20) NOT NULL,
            `CountDescription` varchar(100) DEFAULT NULL,
            `Ply` int NOT NULL DEFAULT '1',
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_YarnCounts_CountCode` (`CountCode`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'LoomTypes' => "CREATE TABLE IF NOT EXISTS `LoomTypes` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `LoomTypeCode` varchar(20) NOT NULL,
            `LoomTypeName` varchar(100) NOT NULL,
            `WidthInches` decimal(10,2) DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_LoomTypes_LoomTypeCode` (`LoomTypeCode`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Beams' => "CREATE TABLE IF NOT EXISTS `Beams` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `BeamNo` varchar(50) NOT NULL,
            `BeamType` varchar(20) NOT NULL DEFAULT 'Warp',
            `WidthInches` decimal(10,2) DEFAULT NULL,
            `MaxEnds` int DEFAULT NULL,
            `TareWeight` decimal(10,2) DEFAULT NULL,
            `Status` varchar(20) NOT NULL DEFAULT 'Available',
            `CurrentJobCardId` int DEFAULT NULL,
            `CurrentJobCardType` varchar(20) DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Beams_BeamNo` (`BeamNo`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'Vehicles' => "CREATE TABLE IF NOT EXISTS `Vehicles` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `VehicleNo` varchar(20) NOT NULL,
            `VehicleType` varchar(50) DEFAULT NULL,
            `DriverName` varchar(100) DEFAULT NULL,
            `DriverPhone` varchar(20) DEFAULT NULL,
            `OwnerName` varchar(100) DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            UNIQUE KEY `IX_Vehicles_VehicleNo` (`VehicleNo`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'DocumentNumberSeries' => "CREATE TABLE IF NOT EXISTS `DocumentNumberSeries` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'YarnReceipts' => "CREATE TABLE IF NOT EXISTS `YarnReceipts` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `ReceiptNo` varchar(50) NOT NULL,
            `ReceiptDate` datetime(6) NOT NULL,
            `PartyId` int NOT NULL,
            `VehicleId` int DEFAULT NULL,
            `ChallanNo` varchar(50) DEFAULT NULL,
            `ChallanDate` datetime(6) DEFAULT NULL,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'AuditLogs' => "CREATE TABLE IF NOT EXISTS `AuditLogs` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `TableName` varchar(100) DEFAULT NULL,
            `RecordId` int DEFAULT NULL,
            `Action` varchar(50) NOT NULL,
            `OldValues` text DEFAULT NULL,
            `NewValues` text DEFAULT NULL,
            `ChangedBy` varchar(100) NOT NULL,
            `ChangedAt` datetime(6) NOT NULL,
            `IpAddress` varchar(50) DEFAULT NULL,
            `UserAgent` varchar(500) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            KEY `IX_AuditLogs_ChangedAt` (`ChangedAt`),
            KEY `IX_AuditLogs_TableName` (`TableName`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'SystemConfigurations' => "CREATE TABLE IF NOT EXISTS `SystemConfigurations` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'NotificationSettings' => "CREATE TABLE IF NOT EXISTS `NotificationSettings` (
            `Id` int NOT NULL AUTO_INCREMENT,
            `NotificationType` varchar(50) NOT NULL,
            `EventType` varchar(100) NOT NULL,
            `DisplayName` varchar(200) NOT NULL,
            `IsEnabled` tinyint(1) NOT NULL DEFAULT '1',
            `ThresholdValue` decimal(18,2) DEFAULT NULL,
            `RecipientRoles` varchar(500) DEFAULT NULL,
            `IsActive` tinyint(1) NOT NULL DEFAULT '1',
            `CreatedBy` varchar(50) NOT NULL,
            `CreatedDate` datetime(6) NOT NULL,
            `ModifiedBy` varchar(50) DEFAULT NULL,
            `ModifiedDate` datetime(6) DEFAULT NULL,
            PRIMARY KEY (`Id`),
            KEY `IX_NotificationSettings_EventType` (`EventType`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'UserSessions' => "CREATE TABLE IF NOT EXISTS `UserSessions` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];
    
    $totalTables = count($sqlStatements);
    $currentTable = 0;
    
    echo '<div class="table-list">';
    
    foreach ($sqlStatements as $tableName => $sql) {
        $currentTable++;
        try {
            $pdo->exec($sql);
            $tables[] = $tableName;
            $successTables++;
            echo '<div class="table-item">';
            echo '<span>✓ ' . htmlspecialchars($tableName) . '</span>';
            echo '<span class="badge badge-success">Created</span>';
            echo '</div>';
        } catch (PDOException $e) {
            $errors[$tableName] = $e->getMessage();
            echo '<div class="table-item">';
            echo '<span>✗ ' . htmlspecialchars($tableName) . '</span>';
            echo '<span class="badge badge-error">Error</span>';
            echo '</div>';
        }
        
        // Update progress
        $progress = ($currentTable / $totalTables) * 100;
        echo '<script>document.getElementById("progress-bar").style.width="' . $progress . '%";document.getElementById("progress-text").innerText="' . round($progress) . '%";</script>';
        flush();
        ob_flush();
    }
    
    echo '</div>';
    
    // Summary
    echo '<div class="status success">';
    echo '<strong>✓ Setup Complete!</strong><br>';
    echo 'Successfully created ' . $successTables . ' out of ' . $totalTables . ' tables.';
    echo '</div>';
    
    if (count($errors) > 0) {
        echo '<div class="status warning">';
        echo '<strong>⚠ Some tables had errors:</strong><br>';
        foreach ($errors as $table => $error) {
            echo '<small>' . htmlspecialchars($table) . ': ' . htmlspecialchars($error) . '</small><br>';
        }
        echo '</div>';
    }
    
    echo '<div class="status info">';
    echo '<strong>Important Next Steps:</strong><br>';
    echo '1. Your ERP backend will automatically seed initial data (admin user, roles, etc.) on first run<br>';
    echo '2. Default Login: <strong>admin</strong> / <strong>Admin@123</strong><br>';
    echo '3. <strong style="color: #dc2626;">DELETE this setup-database.php file for security!</strong><br>';
    echo '4. Deploy your .NET backend to connect to this database';
    echo '</div>';
    
    echo '<div style="margin-top: 20px;">';
    echo '<a href="?" class="btn">← Back to Start</a>';
    echo '<a href="?delete=true" class="btn btn-danger" style="margin-left: 10px;" onclick="return confirm(\'Are you sure you want to delete this setup file?\')">🗑 Delete This File</a>';
    echo '</div>';
    
} elseif (isset($_GET['delete']) && $_GET['delete'] === 'true') {
    // Self-delete
    if (unlink(__FILE__)) {
        echo '<div class="status success">';
        echo '<strong>✓ Setup file deleted successfully!</strong><br>';
        echo 'This page will no longer be accessible.';
        echo '</div>';
    } else {
        echo '<div class="status error">';
        echo '<strong>✗ Could not delete file automatically.</strong><br>';
        echo 'Please manually delete: setup-database.php from your server.';
        echo '</div>';
    }
} else {
    // Initial page
    ?>
    <h2>Welcome to Database Setup</h2>
    <p>This script will create all necessary tables for your Sudhan Textile ERP system.</p>
    
    <div class="status info">
        <strong>Database Configuration:</strong><br>
        Host: <?php echo DB_HOST; ?><br>
        Database: <?php echo DB_NAME; ?><br>
        User: <?php echo DB_USER; ?><br>
        Status: Ready
    </div>
    
    <div class="status warning">
        <strong>⚠ Before You Begin:</strong><br>
        1. Make sure your database credentials are correct<br>
        2. Ensure you have CREATE TABLE permissions<br>
        3. This will create approximately 17+ core tables<br>
        4. Existing tables will not be affected (IF NOT EXISTS)<br>
        5. <strong>Remember to delete this file after setup!</strong>
    </div>
    
    <h3>Tables to be Created:</h3>
    <div class="table-list">
        <?php
        $tableNames = ['Roles', 'Users', 'Modules', 'Permissions', 'RolePermissions', 
                      'Companies', 'FinancialYears', 'Parties', 'YarnCounts', 'LoomTypes', 
                      'Beams', 'Vehicles', 'DocumentNumberSeries', 'YarnReceipts', 
                      'AuditLogs', 'SystemConfigurations', 'NotificationSettings', 'UserSessions'];
        foreach ($tableNames as $table) {
            echo '<div class="table-item"><span>' . $table . '</span></div>';
        }
        ?>
    </div>
    
    <div class="progress" style="display: none;" id="progress-container">
        <div class="progress-bar" id="progress-bar" style="width: 0%;">
            <span id="progress-text">0%</span>
        </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
        <a href="?run=setup" class="btn" onclick="document.getElementById('progress-container').style.display='block'; this.style.display='none'; return true;">
            🚀 Start Database Setup
        </a>
    </div>
    
    <script>
        // Show progress bar when starting
        document.querySelector('a[href="?run=setup"]').addEventListener('click', function() {
            document.getElementById('progress-container').style.display = 'block';
        });
    </script>
    <?php
}
?>
        </div>
        <div class="footer">
            <p>Sudhan Textile ERP v1.0 | Database Setup Utility</p>
            <p><small>For support, contact your system administrator</small></p>
        </div>
    </div>
</body>
</html>
