using Dapper;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;

namespace SudhanTextileERP.API.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(int? financialYearId = null);
    Task<ExecutiveDashboardDto> GetExecutiveStatsAsync(int? financialYearId = null);
    Task<List<YarnStockDto>> GetYarnStockAsync(int? partyId = null, int? yarnCountId = null);
}

public class DashboardService : IDashboardService
{
    private readonly IDapperContext _dapperContext;
    private readonly IDocumentNumberService _documentNumberService;

    public DashboardService(IDapperContext dapperContext, IDocumentNumberService documentNumberService)
    {
        _dapperContext = dapperContext;
        _documentNumberService = documentNumberService;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(int? financialYearId = null)
    {
        financialYearId ??= await _documentNumberService.GetCurrentFinancialYearIdAsync();

        using var connection = _dapperContext.CreateConnection();

        var sql = @"
            SELECT
                -- Today's Yarn Receipts
                (SELECT COUNT(*) FROM YarnReceipts WHERE DATE(ReceiptDate) = DATE('now') AND IsActive = 1) AS TodayYarnReceipts,
                (SELECT IFNULL(SUM(yrd.NetWeight), 0)
                 FROM YarnReceiptDetails yrd
                 INNER JOIN YarnReceipts yr ON yr.Id = yrd.YarnReceiptId
                 WHERE DATE(yr.ReceiptDate) = DATE('now') AND yr.IsActive = 1) AS TodayYarnReceiptKg,
                
                -- Today's Sizing Job Cards
                (SELECT COUNT(*) FROM SizingJobCards WHERE DATE(JobCardDate) = DATE('now') AND IsActive = 1) AS TodaySizingCards,
                (SELECT IFNULL(SUM(ActualLength), 0) FROM SizingJobCards 
                 WHERE DATE(SizingDate) = DATE('now') AND IsActive = 1) AS TodaySizingMeters,
                
                -- Pending Approvals
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status IN ('Draft', 'Prepared', 'Checked', 'Approved') AND IsActive = 1) AS PendingApprovals,
                
                -- Pending for Invoice
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Authorized' AND InvoiceId IS NULL AND IsActive = 1) AS PendingForInvoice,
                
                -- Month Stats
                (SELECT COUNT(*) FROM YarnReceipts 
                 WHERE FinancialYearId = @FinancialYearId 
                 AND strftime('%m', ReceiptDate) = strftime('%m', 'now') 
                 AND strftime('%Y', ReceiptDate) = strftime('%Y', 'now') AND IsActive = 1) AS MonthYarnReceipts,
                
                (SELECT IFNULL(SUM(ActualLength), 0) FROM SizingJobCards 
                 WHERE FinancialYearId = @FinancialYearId
                 AND strftime('%m', SizingDate) = strftime('%m', 'now') 
                 AND strftime('%Y', SizingDate) = strftime('%Y', 'now') AND IsActive = 1) AS MonthSizingMeters,
                
                (SELECT IFNULL(SUM(GrandTotal), 0) FROM TaxInvoices 
                 WHERE FinancialYearId = @FinancialYearId AND Status = 'Finalized'
                 AND strftime('%m', InvoiceDate) = strftime('%m', 'now') 
                 AND strftime('%Y', InvoiceDate) = strftime('%Y', 'now') AND IsActive = 1) AS MonthInvoiceValue,
                
                -- Available Beams
                (SELECT COUNT(*) FROM Beams WHERE Status = 'Available' AND BeamType = 'Sizing Beam' AND IsActive = 1) AS AvailableSizingBeams,
                (SELECT COUNT(*) FROM Beams WHERE Status = 'Available' AND BeamType = 'Warping Beam' AND IsActive = 1) AS AvailableWarpingBeams
        ";

        var stats = await connection.QuerySingleAsync<DashboardStatsDto>(sql, new { FinancialYearId = financialYearId });
        return stats;
    }

    public async Task<ExecutiveDashboardDto> GetExecutiveStatsAsync(int? financialYearId = null)
    {
        financialYearId ??= await _documentNumberService.GetCurrentFinancialYearIdAsync();

        using var connection = _dapperContext.CreateConnection();

        // Main KPIs Query
        var kpiSql = @"
            SELECT
                -- Active Sizing Sets (Running status)
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Running' AND IsActive = 1) AS ActiveSets,

                -- Today's Production (Sizing meters)
                (SELECT IFNULL(SUM(ActualLength), 0) FROM SizingJobCards 
                 WHERE DATE(SizingDate) = DATE('now') AND IsActive = 1) AS TodayProduction,

                -- Total Yarn Stock (current balance)
                (SELECT IFNULL(SUM(InwardQtyKg - OutwardQtyKg), 0) FROM YarnStocks WHERE IsActive = 1) AS TotalYarnStock,

                -- Pending Invoices (Authorized but not invoiced)
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Authorized' AND InvoiceId IS NULL AND IsActive = 1) AS PendingInvoices,

                -- Today's Yarn Receipts
                (SELECT COUNT(*) FROM YarnReceipts WHERE DATE(ReceiptDate) = DATE('now') AND IsActive = 1) AS TodayReceipts,

                -- Active Parties (distinct parties with activity this month)
                (SELECT COUNT(DISTINCT PartyId) FROM YarnReceipts 
                 WHERE strftime('%m', ReceiptDate) = strftime('%m', 'now') 
                 AND strftime('%Y', ReceiptDate) = strftime('%Y', 'now') AND IsActive = 1) AS ActiveParties,

                -- Pending Deliveries
                (SELECT COUNT(*) FROM YarnDeliveries 
                 WHERE Status != 'Delivered' AND IsActive = 1) AS PendingDeliveries,

                -- Average Set Time (hours) - approximation based on recent completed sets
                (SELECT IFNULL(AVG(CAST((JulianDay(SizingDate) - JulianDay(JobCardDate)) * 24 AS REAL)), 0)
                 FROM SizingJobCards WHERE Status = 'Completed' AND IsActive = 1
                 AND SizingDate IS NOT NULL AND JobCardDate IS NOT NULL) AS AvgSetTime,

                -- Today's Invoice Value
                (SELECT IFNULL(SUM(GrandTotal), 0) FROM TaxInvoices 
                 WHERE DATE(InvoiceDate) = DATE('now') AND Status = 'Finalized' AND IsActive = 1) AS TodayInvoiceValue,

                -- MTD Invoice Value
                (SELECT IFNULL(SUM(GrandTotal), 0) FROM TaxInvoices 
                 WHERE FinancialYearId = @FinancialYearId AND Status = 'Finalized'
                 AND strftime('%m', InvoiceDate) = strftime('%m', 'now') 
                 AND strftime('%Y', InvoiceDate) = strftime('%Y', 'now') AND IsActive = 1) AS MTDInvoiceValue,

                -- Monthly Production
                (SELECT IFNULL(SUM(ActualLength), 0) FROM SizingJobCards 
                 WHERE FinancialYearId = @FinancialYearId
                 AND strftime('%m', SizingDate) = strftime('%m', 'now') 
                 AND strftime('%Y', SizingDate) = strftime('%Y', 'now') AND IsActive = 1) AS MonthlyProduction,

                -- Beam Summary
                (SELECT COUNT(*) FROM Beams WHERE IsActive = 1) AS TotalBeams,
                (SELECT COUNT(*) FROM Beams WHERE Status = 'Available' AND IsActive = 1) AS AvailableBeams,
                (SELECT COUNT(*) FROM Beams WHERE Status = 'In Use' AND IsActive = 1) AS InUseBeams,
                (SELECT COUNT(*) FROM Beams WHERE Status = 'Maintenance' AND IsActive = 1) AS MaintenanceBeams,

                -- Pending Approvals breakdown
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Draft' AND IsActive = 1) AS DraftCards,
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Prepared' AND IsActive = 1) AS PreparedCards,
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Checked' AND IsActive = 1) AS CheckedCards,
                (SELECT COUNT(*) FROM SizingJobCards WHERE Status = 'Approved' AND IsActive = 1) AS ApprovedCards
        ";

        var kpis = await connection.QuerySingleAsync<dynamic>(kpiSql, new { FinancialYearId = financialYearId });

        // Recent Sizing Sets
        var recentSetsSql = @"
            SELECT 
                sjc.SetNo,
                sjc.JobCardDate AS Date,
                p.PartyName AS Party,
                yc.CountCode AS Count,
                IFNULL(sjc.ActualLength, sjc.SetLength) AS Meters,
                sjc.Status
            FROM SizingJobCards sjc
            INNER JOIN Parties p ON sjc.PartyId = p.Id
            INNER JOIN YarnCounts yc ON sjc.YarnCountId = yc.Id
            WHERE sjc.IsActive = 1
            ORDER BY sjc.JobCardDate DESC, sjc.Id DESC
            LIMIT 10
        ";

        var recentSets = await connection.QueryAsync<RecentSizingSetDto>(recentSetsSql);

        // Low Stock Items
        var lowStockSql = @"
            SELECT 
                yc.CountCode AS Count,
                ys.LotNo,
                SUM(ys.InwardQtyKg - ys.OutwardQtyKg) AS Balance,
                100 AS MinStock
            FROM YarnStocks ys
            INNER JOIN YarnCounts yc ON ys.YarnCountId = yc.Id
            WHERE ys.IsActive = 1
            GROUP BY yc.CountCode, ys.LotNo
            HAVING SUM(ys.InwardQtyKg - ys.OutwardQtyKg) > 0 AND SUM(ys.InwardQtyKg - ys.OutwardQtyKg) < 100
            ORDER BY Balance ASC
            LIMIT 5
        ";

        var lowStockItems = await connection.QueryAsync<LowStockItemDto>(lowStockSql);

        // Calculate efficiency (actual vs target)
        decimal efficiency = 0;
        if ((decimal)(kpis.MonthlyProduction ?? 0) > 0)
        {
            // Assume target is 150,000 meters per month
            efficiency = Math.Min(100, ((decimal)(kpis.MonthlyProduction ?? 0) / 150000m) * 100);
        }

        return new ExecutiveDashboardDto
        {
            // Primary KPIs
            ActiveSets = (int)(kpis.ActiveSets ?? 0),
            TodayProduction = (decimal)(kpis.TodayProduction ?? 0),
            TotalYarnStock = (decimal)(kpis.TotalYarnStock ?? 0),
            PendingInvoices = (int)(kpis.PendingInvoices ?? 0),

            // Secondary KPIs
            TodayReceipts = (int)(kpis.TodayReceipts ?? 0),
            ActiveParties = (int)(kpis.ActiveParties ?? 0),
            PendingDeliveries = (int)(kpis.PendingDeliveries ?? 0),
            AvgSetTime = Math.Round((decimal)(kpis.AvgSetTime ?? 0), 1),
            TodayInvoiceValue = (decimal)(kpis.TodayInvoiceValue ?? 0),
            MTDInvoiceValue = (decimal)(kpis.MTDInvoiceValue ?? 0),
            MonthlyProduction = (decimal)(kpis.MonthlyProduction ?? 0),
            Efficiency = Math.Round(efficiency, 1),

            // Beam Summary
            BeamSummary = new BeamSummaryDto
            {
                Total = (int)(kpis.TotalBeams ?? 0),
                Available = (int)(kpis.AvailableBeams ?? 0),
                InUse = (int)(kpis.InUseBeams ?? 0),
                Maintenance = (int)(kpis.MaintenanceBeams ?? 0)
            },

            // Pending Approvals
            PendingApprovals = new List<PendingApprovalDto>
            {
                new PendingApprovalDto { Type = "Draft", Count = (int)(kpis.DraftCards ?? 0), Urgent = 0 },
                new PendingApprovalDto { Type = "Prepared", Count = (int)(kpis.PreparedCards ?? 0), Urgent = 0 },
                new PendingApprovalDto { Type = "Checked", Count = (int)(kpis.CheckedCards ?? 0), Urgent = 0 },
                new PendingApprovalDto { Type = "Approved", Count = (int)(kpis.ApprovedCards ?? 0), Urgent = 0 }
            },

            // Lists
            RecentSizingSets = recentSets.ToList(),
            LowStockItems = lowStockItems.ToList()
        };
    }

    public async Task<List<YarnStockDto>> GetYarnStockAsync(int? partyId = null, int? yarnCountId = null)
    {
        using var connection = _dapperContext.CreateConnection();

        var sql = @"
            SELECT 
                p.PartyCode,
                p.PartyName,
                yc.CountCode,
                sl.LotNo,
                SUM(sl.InwardQty) AS TotalInward,
                SUM(sl.OutwardQty) AS TotalOutward,
                SUM(sl.InwardQty) - SUM(sl.OutwardQty) AS BalanceQtyKg
            FROM StockLedgers sl
            INNER JOIN Parties p ON sl.PartyId = p.Id
            INNER JOIN YarnCounts yc ON sl.YarnCountId = yc.Id
            WHERE sl.IsActive = 1
            AND (@PartyId IS NULL OR sl.PartyId = @PartyId)
            AND (@YarnCountId IS NULL OR sl.YarnCountId = @YarnCountId)
            GROUP BY p.PartyCode, p.PartyName, yc.CountCode, sl.LotNo
            HAVING SUM(sl.InwardQty) - SUM(sl.OutwardQty) > 0
            ORDER BY p.PartyName, yc.CountCode, sl.LotNo
        ";

        var result = await connection.QueryAsync<YarnStockDto>(sql, new { PartyId = partyId, YarnCountId = yarnCountId });
        return result.ToList();
    }
}
