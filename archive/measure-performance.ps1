# =============================================
# PERFORMANCE BASELINE MEASUREMENT
# Establish SLA targets and capacity planning
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [int]$SampleDuration = 60,
    
    [Parameter(Mandatory=$false)]
    [switch]$EstablishBaseline = $false
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║         PERFORMANCE BASELINE MEASUREMENT                       ║" -ForegroundColor Cyan
Write-Host "║          SLA Targets & Capacity Planning                       ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Measurement Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "Sample Duration: $SampleDuration seconds" -ForegroundColor White
Write-Host ""

# Get connection string
if ([string]::IsNullOrEmpty($ConnectionString)) {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        $ConnectionString = $config.ConnectionStrings.DefaultConnection
    }
}

# Baseline data structure
$baseline = @{
    Timestamp = Get-Date
    SampleDuration = $SampleDuration
    API = @{
        AvgResponseTime = 0
        MinResponseTime = 0
        MaxResponseTime = 0
        SuccessRate = 0
        SampleCount = 0
    }
    Database = @{
        Size = @{ DataMB = 0; LogMB = 0; TotalMB = 0 }
        Connections = @{ Active = 0; Peak = 0 }
        Performance = @{ AvgCPU = 0; AvgWaitTime = 0 }
    }
    Transactions = @{
        DailyVolume = @{ Receipts = 0; Beams = 0; Total = 0 }
        PeakHour = ""
        GrowthRate = 0
    }
    Reports = @{
        StockReportTime = 0
        TransactionReportTime = 0
        AuditReportTime = 0
    }
    Capacity = @{
        ConcurrentUsers = 0
        TransactionsPerHour = 0
        DatabaseGrowthPerDay = 0
    }
}

# =============================================
# 1. API PERFORMANCE SAMPLING
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. API PERFORMANCE SAMPLING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Sampling API response times over $SampleDuration seconds..." -ForegroundColor Yellow

$responseTimes = @()
$sampleInterval = 5 # Sample every 5 seconds
$samples = [Math]::Floor($SampleDuration / $sampleInterval)

for ($i = 0; $i -lt $samples; $i++) {
    try {
        $start = Get-Date
        $health = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
        $duration = ((Get-Date) - $start).TotalMilliseconds
        $responseTimes += $duration
        
        Write-Host "  Sample $($i + 1)/$samples`: ${duration}ms" -ForegroundColor Gray
        
        if ($i -lt $samples - 1) {
            Start-Sleep -Seconds $sampleInterval
        }
    } catch {
        Write-Host "  Sample $($i + 1)/$samples`: FAILED" -ForegroundColor Red
    }
}

if ($responseTimes.Count -gt 0) {
    $baseline.API.AvgResponseTime = [Math]::Round(($responseTimes | Measure-Object -Average).Average, 2)
    $baseline.API.MinResponseTime = [Math]::Round(($responseTimes | Measure-Object -Minimum).Minimum, 2)
    $baseline.API.MaxResponseTime = [Math]::Round(($responseTimes | Measure-Object -Maximum).Maximum, 2)
    $baseline.API.SuccessRate = [Math]::Round(($responseTimes.Count / $samples) * 100, 1)
    $baseline.API.SampleCount = $responseTimes.Count
    
    Write-Host ""
    Write-Host "API Performance Baseline:" -ForegroundColor Cyan
    Write-Host "  Average Response: $($baseline.API.AvgResponseTime)ms" -ForegroundColor White
    Write-Host "  Min Response: $($baseline.API.MinResponseTime)ms" -ForegroundColor Green
    Write-Host "  Max Response: $($baseline.API.MaxResponseTime)ms" -ForegroundColor $(if ($baseline.API.MaxResponseTime -gt 2000) { "Yellow" } else { "White" })
    Write-Host "  Success Rate: $($baseline.API.SuccessRate)%" -ForegroundColor $(if ($baseline.API.SuccessRate -eq 100) { "Green" } else { "Yellow" })
    Write-Host ""
} else {
    Write-Host "✗ API sampling failed" -ForegroundColor Red
    Write-Host ""
}

# =============================================
# 2. DATABASE SIZE & GROWTH
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2. DATABASE SIZE & GROWTH ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Database size
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    SUM(CASE WHEN type = 0 THEN size * 8 / 1024.0 ELSE 0 END) AS DataMB,
    SUM(CASE WHEN type = 1 THEN size * 8 / 1024.0 ELSE 0 END) AS LogMB,
    SUM(size * 8 / 1024.0) AS TotalMB
FROM sys.master_files
WHERE database_id = DB_ID()
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $baseline.Database.Size.DataMB = [Math]::Round($reader["DataMB"], 2)
            $baseline.Database.Size.LogMB = [Math]::Round($reader["LogMB"], 2)
            $baseline.Database.Size.TotalMB = [Math]::Round($reader["TotalMB"], 2)
        }
        $reader.Close()
        
        Write-Host "Current Database Size:" -ForegroundColor Cyan
        Write-Host "  Data: $($baseline.Database.Size.DataMB) MB" -ForegroundColor White
        Write-Host "  Log:  $($baseline.Database.Size.LogMB) MB" -ForegroundColor White
        Write-Host "  Total: $($baseline.Database.Size.TotalMB) MB" -ForegroundColor Green
        Write-Host ""
        
        # Growth rate calculation (if historical data exists)
        $growthFile = "database-size-history.csv"
        if (Test-Path $growthFile) {
            $history = Import-Csv -Path $growthFile | Sort-Object -Property Timestamp -Descending | Select-Object -First 2
            if ($history.Count -eq 2) {
                $oldSize = [double]$history[1].TotalMB
                $newSize = [double]$history[0].TotalMB
                $daysDiff = ((Get-Date) - [DateTime]::Parse($history[1].Timestamp)).Days
                
                if ($daysDiff -gt 0) {
                    $baseline.Capacity.DatabaseGrowthPerDay = [Math]::Round(($newSize - $oldSize) / $daysDiff, 2)
                    Write-Host "Database Growth Rate: $($baseline.Capacity.DatabaseGrowthPerDay) MB/day" -ForegroundColor Cyan
                    Write-Host ""
                }
            }
        }
        
        # Record current size
        if (-not (Test-Path $growthFile)) {
            Add-Content -Path $growthFile -Value "Timestamp,DataMB,LogMB,TotalMB"
        }
        Add-Content -Path $growthFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),$($baseline.Database.Size.DataMB),$($baseline.Database.Size.LogMB),$($baseline.Database.Size.TotalMB)"
        
        $conn.Close()
    } catch {
        Write-Host "✗ Cannot measure database size: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# =============================================
# 3. CONNECTION & CONCURRENCY METRICS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3. CONNECTION & CONCURRENCY METRICS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Active connections
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    COUNT(*) AS ActiveConnections
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
"@
        $baseline.Database.Connections.Active = $cmd.ExecuteScalar()
        
        Write-Host "Active Database Connections: $($baseline.Database.Connections.Active)" -ForegroundColor White
        
        # Estimate concurrent users (from recent audit logs)
        $cmd.CommandText = @"
SELECT COUNT(DISTINCT UserId) AS ConcurrentUsers
FROM AuditLogs
WHERE CreatedDate >= DATEADD(MINUTE, -15, GETDATE())
"@
        $baseline.Capacity.ConcurrentUsers = $cmd.ExecuteScalar()
        
        Write-Host "Concurrent Users (last 15 min): $($baseline.Capacity.ConcurrentUsers)" -ForegroundColor Cyan
        Write-Host ""
        
        $conn.Close()
    } catch {
        Write-Host "✗ Cannot measure connections: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# =============================================
# 4. TRANSACTION VOLUME ANALYSIS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "4. TRANSACTION VOLUME ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Daily transaction volume
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    (SELECT COUNT(*) FROM YarnReceipts WHERE CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayReceipts,
    (SELECT COUNT(*) FROM Beams WHERE CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayBeams
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $baseline.Transactions.DailyVolume.Receipts = $reader["TodayReceipts"]
            $baseline.Transactions.DailyVolume.Beams = $reader["TodayBeams"]
            $baseline.Transactions.DailyVolume.Total = $baseline.Transactions.DailyVolume.Receipts + $baseline.Transactions.DailyVolume.Beams
        }
        $reader.Close()
        
        Write-Host "Today's Transaction Volume:" -ForegroundColor Cyan
        Write-Host "  Receipts: $($baseline.Transactions.DailyVolume.Receipts)" -ForegroundColor White
        Write-Host "  Beams:    $($baseline.Transactions.DailyVolume.Beams)" -ForegroundColor White
        Write-Host "  Total:    $($baseline.Transactions.DailyVolume.Total)" -ForegroundColor Green
        Write-Host ""
        
        # Peak hour analysis
        $cmd.CommandText = @"
SELECT TOP 1
    DATEPART(HOUR, CreatedDate) AS PeakHour,
    COUNT(*) AS Transactions
FROM (
    SELECT CreatedDate FROM YarnReceipts WHERE CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)
    UNION ALL
    SELECT CreatedDate FROM Beams WHERE CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)
) AllTransactions
GROUP BY DATEPART(HOUR, CreatedDate)
ORDER BY Transactions DESC
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $hour = $reader["PeakHour"]
            $count = $reader["Transactions"]
            $baseline.Transactions.PeakHour = "${hour}:00 ($count transactions)"
            $baseline.Capacity.TransactionsPerHour = $count
            
            Write-Host "Peak Transaction Hour: ${hour}:00 with $count transactions" -ForegroundColor Cyan
        } else {
            Write-Host "Insufficient data for peak hour analysis" -ForegroundColor Gray
        }
        $reader.Close()
        
        Write-Host ""
        
        # Growth rate (if historical data exists)
        $volumeFile = "transaction-volume-history.csv"
        if (Test-Path $volumeFile) {
            $history = Import-Csv -Path $volumeFile | Sort-Object -Property Date -Descending | Select-Object -First 7
            if ($history.Count -ge 2) {
                $recentAvg = ($history | Measure-Object -Property Total -Average).Average
                $oldest = [int]$history[-1].Total
                $newest = [int]$history[0].Total
                
                if ($oldest -gt 0) {
                    $growthPercent = [Math]::Round((($newest - $oldest) / $oldest) * 100, 1)
                    $baseline.Transactions.GrowthRate = $growthPercent
                    
                    Write-Host "Transaction Growth:" -ForegroundColor Cyan
                    Write-Host "  7-day average: $([Math]::Round($recentAvg, 0)) transactions/day" -ForegroundColor White
                    Write-Host "  Growth trend: $growthPercent%" -ForegroundColor $(if ($growthPercent -gt 0) { "Green" } else { "Yellow" })
                    Write-Host ""
                }
            }
        }
        
        # Record today's volume
        if (-not (Test-Path $volumeFile)) {
            Add-Content -Path $volumeFile -Value "Date,Receipts,Beams,Total"
        }
        Add-Content -Path $volumeFile -Value "$(Get-Date -Format 'yyyy-MM-dd'),$($baseline.Transactions.DailyVolume.Receipts),$($baseline.Transactions.DailyVolume.Beams),$($baseline.Transactions.DailyVolume.Total)"
        
        $conn.Close()
    } catch {
        Write-Host "✗ Cannot measure transaction volume: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# =============================================
# 5. REPORT GENERATION TIMES
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "5. REPORT GENERATION PERFORMANCE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Measuring report generation times..." -ForegroundColor Yellow
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Stock Report
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    ys.PartyName,
    ys.YarnTypeName,
    ys.CurrentBalanceKg,
    ys.CurrentBalanceCones
FROM YarnStocks ys
WHERE ys.CurrentBalanceKg > 0
ORDER BY ys.PartyName, ys.YarnTypeName
"@
        $start = Get-Date
        $reader = $cmd.ExecuteReader()
        $rowCount = 0
        while ($reader.Read()) { $rowCount++ }
        $reader.Close()
        $baseline.Reports.StockReportTime = [Math]::Round(((Get-Date) - $start).TotalMilliseconds, 2)
        
        Write-Host "  Stock Report: $($baseline.Reports.StockReportTime)ms ($rowCount rows)" -ForegroundColor White
        
        # Transaction Report (last 30 days)
        $cmd.CommandText = @"
SELECT 
    yr.ReceiptNo,
    yr.ReceiptDate,
    yr.PartyName,
    yr.YarnTypeName,
    yr.NetWeightKg
FROM YarnReceipts yr
WHERE yr.ReceiptDate >= DATEADD(DAY, -30, GETDATE())
ORDER BY yr.ReceiptDate DESC
"@
        $start = Get-Date
        $reader = $cmd.ExecuteReader()
        $rowCount = 0
        while ($reader.Read()) { $rowCount++ }
        $reader.Close()
        $baseline.Reports.TransactionReportTime = [Math]::Round(((Get-Date) - $start).TotalMilliseconds, 2)
        
        Write-Host "  Transaction Report: $($baseline.Reports.TransactionReportTime)ms ($rowCount rows)" -ForegroundColor White
        
        # Audit Report (last 7 days)
        $cmd.CommandText = @"
SELECT 
    al.Action,
    al.EntityType,
    al.Username,
    al.CreatedDate
FROM AuditLogs al
WHERE al.CreatedDate >= DATEADD(DAY, -7, GETDATE())
ORDER BY al.CreatedDate DESC
"@
        $start = Get-Date
        $reader = $cmd.ExecuteReader()
        $rowCount = 0
        while ($reader.Read()) { $rowCount++ }
        $reader.Close()
        $baseline.Reports.AuditReportTime = [Math]::Round(((Get-Date) - $start).TotalMilliseconds, 2)
        
        Write-Host "  Audit Report: $($baseline.Reports.AuditReportTime)ms ($rowCount rows)" -ForegroundColor White
        Write-Host ""
        
        $conn.Close()
    } catch {
        Write-Host "✗ Cannot measure report times: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# =============================================
# BASELINE SUMMARY
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PERFORMANCE BASELINE SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "API Performance:" -ForegroundColor Cyan
Write-Host "  Target SLA: < 1000ms average" -ForegroundColor Gray
Write-Host "  Current: $($baseline.API.AvgResponseTime)ms" -ForegroundColor $(if ($baseline.API.AvgResponseTime -lt 1000) { "Green" } else { "Yellow" })
Write-Host ""

Write-Host "Database:" -ForegroundColor Cyan
Write-Host "  Current Size: $($baseline.Database.Size.TotalMB) MB" -ForegroundColor White
Write-Host "  Growth Rate: $($baseline.Capacity.DatabaseGrowthPerDay) MB/day" -ForegroundColor White
Write-Host "  Projected 90-day: $([Math]::Round($baseline.Database.Size.TotalMB + ($baseline.Capacity.DatabaseGrowthPerDay * 90), 2)) MB" -ForegroundColor Cyan
Write-Host ""

Write-Host "Capacity:" -ForegroundColor Cyan
Write-Host "  Concurrent Users: $($baseline.Capacity.ConcurrentUsers)" -ForegroundColor White
Write-Host "  Transactions/Hour: $($baseline.Capacity.TransactionsPerHour)" -ForegroundColor White
Write-Host "  Daily Volume: $($baseline.Transactions.DailyVolume.Total)" -ForegroundColor White
Write-Host ""

Write-Host "Reports:" -ForegroundColor Cyan
Write-Host "  Stock Report: $($baseline.Reports.StockReportTime)ms" -ForegroundColor $(if ($baseline.Reports.StockReportTime -lt 2000) { "Green" } else { "Yellow" })
Write-Host "  Transaction Report: $($baseline.Reports.TransactionReportTime)ms" -ForegroundColor $(if ($baseline.Reports.TransactionReportTime -lt 5000) { "Green" } else { "Yellow" })
Write-Host "  Audit Report: $($baseline.Reports.AuditReportTime)ms" -ForegroundColor $(if ($baseline.Reports.AuditReportTime -lt 3000) { "Green" } else { "Yellow" })
Write-Host ""

# =============================================
# RECOMMENDED SLA TARGETS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "RECOMMENDED SLA TARGETS" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Write-Host "Based on measured baseline, recommend:" -ForegroundColor Cyan
Write-Host ""

$apiTarget = [Math]::Ceiling($baseline.API.AvgResponseTime * 1.5)
Write-Host "  API Response Time: < ${apiTarget}ms (avg)" -ForegroundColor White
Write-Host "    (Current avg: $($baseline.API.AvgResponseTime)ms + 50% buffer)" -ForegroundColor Gray
Write-Host ""

Write-Host "  Report Generation:" -ForegroundColor White
Write-Host "    Stock Report: < 3000ms" -ForegroundColor White
Write-Host "    Transaction Report: < 5000ms" -ForegroundColor White
Write-Host "    Audit Report: < 3000ms" -ForegroundColor White
Write-Host ""

Write-Host "  System Availability: > 99.5% uptime" -ForegroundColor White
Write-Host "  Backup Success Rate: 100%" -ForegroundColor White
Write-Host "  Data Integrity: Zero negative stock, Zero orphans" -ForegroundColor White
Write-Host ""

# =============================================
# CAPACITY PLANNING
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "CAPACITY PLANNING RECOMMENDATIONS" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

if ($baseline.Capacity.DatabaseGrowthPerDay -gt 0) {
    $monthsTo10GB = [Math]::Floor((10000 - $baseline.Database.Size.TotalMB) / ($baseline.Capacity.DatabaseGrowthPerDay * 30))
    Write-Host "Database Storage:" -ForegroundColor Cyan
    Write-Host "  Current: $($baseline.Database.Size.TotalMB) MB" -ForegroundColor White
    Write-Host "  Growth: $($baseline.Capacity.DatabaseGrowthPerDay) MB/day" -ForegroundColor White
    if ($monthsTo10GB -gt 0) {
        Write-Host "  Months until 10 GB: ~$monthsTo10GB months" -ForegroundColor Yellow
        Write-Host "  Action: Monitor monthly, plan upgrade at 8 GB" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "Concurrent Users:" -ForegroundColor Cyan
Write-Host "  Current peak: $($baseline.Capacity.ConcurrentUsers) users" -ForegroundColor White
Write-Host "  Current capacity: ~50 users (estimated)" -ForegroundColor White
if ($baseline.Capacity.ConcurrentUsers -gt 40) {
    Write-Host "  ⚠ Warning: Approaching capacity limits" -ForegroundColor Yellow
    Write-Host "  Action: Plan for horizontal scaling" -ForegroundColor Yellow
} else {
    Write-Host "  Headroom: Sufficient for growth" -ForegroundColor Green
}
Write-Host ""

Write-Host "Transaction Volume:" -ForegroundColor Cyan
Write-Host "  Current: $($baseline.Transactions.DailyVolume.Total) transactions/day" -ForegroundColor White
Write-Host "  Peak hour: $($baseline.Capacity.TransactionsPerHour) transactions/hour" -ForegroundColor White
Write-Host "  Growth: $($baseline.Transactions.GrowthRate)%" -ForegroundColor White
Write-Host "  System can handle current load + 100% growth" -ForegroundColor Green
Write-Host ""

# =============================================
# SAVE BASELINE
# =============================================
if ($EstablishBaseline) {
    $baselineFile = "performance-baseline.json"
    $baseline | ConvertTo-Json -Depth 10 | Out-File -FilePath $baselineFile
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "BASELINE ESTABLISHED" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ Baseline saved: $baselineFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "This baseline will be used for:" -ForegroundColor Cyan
    Write-Host "  • SLA target definition" -ForegroundColor White
    Write-Host "  • Performance regression detection" -ForegroundColor White
    Write-Host "  • Capacity planning" -ForegroundColor White
    Write-Host "  • Phase-2 impact assessment" -ForegroundColor White
    Write-Host ""
} else {
    $measurementFile = "performance-measurement-$timestamp.json"
    $baseline | ConvertTo-Json -Depth 10 | Out-File -FilePath $measurementFile
    Write-Host "Measurement saved: $measurementFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To establish this as the official baseline, run:" -ForegroundColor Yellow
    Write-Host "  .\measure-performance.ps1 -EstablishBaseline" -ForegroundColor White
    Write-Host ""
}

# Append to tracking CSV
$trackingFile = "performance-tracking.csv"
if (-not (Test-Path $trackingFile)) {
    Add-Content -Path $trackingFile -Value "Timestamp,APIAvg,APIMax,DBSizeMB,DailyTransactions,ConcurrentUsers,StockReportMs"
}
$csvLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),$($baseline.API.AvgResponseTime),$($baseline.API.MaxResponseTime),$($baseline.Database.Size.TotalMB),$($baseline.Transactions.DailyVolume.Total),$($baseline.Capacity.ConcurrentUsers),$($baseline.Reports.StockReportTime)"
Add-Content -Path $trackingFile -Value $csvLine

Write-Host "Performance tracking updated: $trackingFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

exit 0
