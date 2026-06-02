using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IDapperContext _dapperContext;

    public ReportsController(IDapperContext dapperContext)
    {
        _dapperContext = dapperContext;
    }

    [HttpGet("yarn-stock-register")]
    public async Task<ActionResult<ApiResponse<List<YarnStockRegisterDto>>>> GetYarnStockRegister(
        [FromQuery] int? yarnCountId = null,
        [FromQuery] string? lotNo = null,
        [FromQuery] string? financialYear = null)
    {
        using var connection = _dapperContext.CreateConnection();
        
        var sql = @"
            SELECT 
                yc.Id AS YarnCountId,
                yc.CountCode,
                yc.CountDescription,
                ys.LotNo,
                fy.YearCode AS FinancialYear,
                SUM(ys.InwardQtyKg) AS TotalInWeight,
                SUM(ys.OutwardQtyKg) AS TotalOutWeight,
                SUM(ys.InwardQtyKg) - SUM(ys.OutwardQtyKg) AS BalanceWeight,
                0 AS TotalInQty,
                0 AS TotalOutQty,
                0 AS BalanceQty
            FROM YarnStocks ys
            INNER JOIN YarnCounts yc ON ys.YarnCountId = yc.Id
            INNER JOIN FinancialYears fy ON ys.FinancialYearId = fy.Id
            WHERE ys.IsActive = 1
        ";

        if (yarnCountId.HasValue)
            sql += " AND ys.YarnCountId = @YarnCountId";
        
        if (!string.IsNullOrEmpty(lotNo))
            sql += " AND ys.LotNo = @LotNo";
        
        if (!string.IsNullOrEmpty(financialYear))
            sql += " AND fy.YearCode = @FinancialYear";

        sql += " GROUP BY yc.Id, yc.CountCode, yc.CountDescription, ys.LotNo, fy.YearCode ORDER BY yc.CountCode, ys.LotNo";

        var result = await connection.QueryAsync<YarnStockRegisterDto>(sql, new { YarnCountId = yarnCountId, LotNo = lotNo, FinancialYear = financialYear });
        
        return Ok(ApiResponse<List<YarnStockRegisterDto>>.Ok(result.ToList()));
    }

    [HttpGet("sizing-job-cards")]
    public async Task<ActionResult<ApiResponse<List<SizingJobCardReportDto>>>> GetSizingJobCards(
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        using var connection = _dapperContext.CreateConnection();
        
        var sql = @"
            SELECT 
                sjc.Id,
                sjc.SetNo,
                sjc.JobCardDate AS SetDate,
                p.PartyName,
                yc.CountCode AS YarnCount,
                IFNULL(lt.LoomTypeName, 'N/A') AS LoomType,
                sjc.TotalEnds,
                sjc.SetLength AS WarpingMeters,
                IFNULL(sjc.ActualLength, 0) AS SizingMeters,
                0 AS PickupPercent,
                0 AS ElongationPercent,
                0 AS BeamCount,
                sjc.Status AS ApprovalStatus
            FROM SizingJobCards sjc
            INNER JOIN Parties p ON sjc.PartyId = p.Id
            INNER JOIN YarnCounts yc ON sjc.YarnCountId = yc.Id
            LEFT JOIN LoomTypes lt ON sjc.LoomTypeId = lt.Id
            WHERE sjc.IsActive = 1
        ";

        if (partyId.HasValue)
            sql += " AND sjc.PartyId = @PartyId";
        
        if (!string.IsNullOrEmpty(status))
            sql += " AND sjc.Status = @Status";
        
        if (fromDate.HasValue)
            sql += " AND sjc.JobCardDate >= @FromDate";
        
        if (toDate.HasValue)
            sql += " AND sjc.JobCardDate <= @ToDate";

        sql += " ORDER BY sjc.JobCardDate DESC, sjc.Id DESC";

        var result = await connection.QueryAsync<SizingJobCardReportDto>(sql, new { PartyId = partyId, Status = status, FromDate = fromDate, ToDate = toDate });
        
        return Ok(ApiResponse<List<SizingJobCardReportDto>>.Ok(result.ToList()));
    }

    [HttpGet("beam-utilization")]
    public async Task<ActionResult<ApiResponse<List<BeamUtilizationReportDto>>>> GetBeamUtilization(
        [FromQuery] string? beamType = null,
        [FromQuery] string? status = null)
    {
        using var connection = _dapperContext.CreateConnection();
        
        var sql = @"
            SELECT 
                b.Id AS BeamId,
                b.BeamNo,
                b.BeamType,
                b.TareWeight,
                b.Status,
                '' AS CurrentLocation,
                COUNT(DISTINCT sjcb.SizingJobCardId) AS TotalSizingUsage,
                COUNT(DISTINCT wjcb.WarpingJobCardId) AS TotalWarpingUsage,
                MAX(sjc.JobCardDate) AS LastUsedDate,
                MAX(sjc.SetNo) AS LastUsedInSet
            FROM Beams b
            LEFT JOIN SizingJobCardBeams sjcb ON b.Id = sjcb.BeamId
            LEFT JOIN SizingJobCards sjc ON sjcb.SizingJobCardId = sjc.Id
            LEFT JOIN WarpingJobCardBeams wjcb ON b.Id = wjcb.BeamId
            LEFT JOIN WarpingJobCards wjc ON wjcb.WarpingJobCardId = wjc.Id
            WHERE b.IsActive = 1
        ";

        if (!string.IsNullOrEmpty(beamType))
            sql += " AND b.BeamType = @BeamType";
        
        if (!string.IsNullOrEmpty(status))
            sql += " AND b.Status = @Status";

        sql += " GROUP BY b.Id, b.BeamNo, b.BeamType, b.TareWeight, b.Status ORDER BY b.BeamNo";

        var result = await connection.QueryAsync<BeamUtilizationReportDto>(sql, new { BeamType = beamType, Status = status });
        
        return Ok(ApiResponse<List<BeamUtilizationReportDto>>.Ok(result.ToList()));
    }

    [HttpGet("invoice-register")]
    public async Task<ActionResult<ApiResponse<List<InvoiceRegisterReportDto>>>> GetInvoiceRegister(
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        using var connection = _dapperContext.CreateConnection();
        
        var sql = @"
            SELECT 
                ti.Id,
                ti.InvoiceNumber AS InvoiceNo,
                ti.InvoiceDate,
                p.PartyName,
                p.GSTIN AS PartyGSTIN,
                ti.PlaceOfSupply,
                ti.IsInterState,
                ti.TaxableAmount,
                ti.CGSTAmount,
                ti.SGSTAmount,
                ti.IGSTAmount,
                (ti.CGSTAmount + ti.SGSTAmount + ti.IGSTAmount) AS TotalTaxAmount,
                ti.GrandTotal AS TotalAmount,
                ti.DueDate,
                ti.Status,
                ti.IsLocked,
                ti.IsPrinted,
                CASE 
                    WHEN ti.Status = 'Paid' THEN 0
                    WHEN ti.DueDate IS NULL THEN 0
                    ELSE CAST(julianday('now') - julianday(ti.DueDate) AS INTEGER)
                END AS DaysOverdue
            FROM TaxInvoices ti
            INNER JOIN Parties p ON ti.PartyId = p.Id
            WHERE 1=1
        ";

        if (partyId.HasValue)
            sql += " AND ti.PartyId = @PartyId";
        
        if (!string.IsNullOrEmpty(status))
            sql += " AND ti.Status = @Status";
        
        if (fromDate.HasValue)
            sql += " AND ti.InvoiceDate >= @FromDate";
        
        if (toDate.HasValue)
            sql += " AND ti.InvoiceDate <= @ToDate";

        sql += " ORDER BY ti.InvoiceDate DESC, ti.Id DESC";

        var result = await connection.QueryAsync<InvoiceRegisterReportDto>(sql, new { PartyId = partyId, Status = status, FromDate = fromDate, ToDate = toDate });
        
        return Ok(ApiResponse<List<InvoiceRegisterReportDto>>.Ok(result.ToList()));
    }

    [HttpGet("party-ledger")]
    public async Task<ActionResult<ApiResponse<List<PartyLedgerReportDto>>>> GetPartyLedger(
        [FromQuery] int partyId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        using var connection = _dapperContext.CreateConnection();
        
        var sql = @"
            SELECT 
                TransDate,
                DocumentType,
                DocumentNo,
                Particulars,
                DebitAmount,
                CreditAmount,
                SUM(DebitAmount - CreditAmount) OVER (ORDER BY TransDate, Id) AS RunningBalance
            FROM (
                -- Yarn Receipts (Credit - We owe them)
                SELECT 
                    yr.Id,
                    yr.ReceiptDate AS TransDate,
                    'Yarn Receipt' AS DocumentType,
                    yr.ReceiptNumber AS DocumentNo,
                    'Yarn Received' AS Particulars,
                    0 AS DebitAmount,
                    (SELECT IFNULL(SUM(NetWeight * RatePerKg), 0) FROM YarnReceiptDetails WHERE YarnReceiptId = yr.Id) AS CreditAmount
                FROM YarnReceipts yr WHERE yr.PartyId = @PartyId AND yr.IsActive = 1
                
                UNION ALL
                
                -- Tax Invoices (Debit - They owe us)
                SELECT 
                    ti.Id,
                    ti.InvoiceDate AS TransDate,
                    'Tax Invoice' AS DocumentType,
                    ti.InvoiceNumber AS DocumentNo,
                    'Sizing Charges' AS Particulars,
                    ti.GrandTotal AS DebitAmount,
                    0 AS CreditAmount
                FROM TaxInvoices ti WHERE ti.PartyId = @PartyId AND ti.Status <> 'Cancelled'
            ) AS Ledger
            WHERE 1=1
        ";

        if (fromDate.HasValue)
            sql += " AND TransDate >= @FromDate";
        
        if (toDate.HasValue)
            sql += " AND TransDate <= @ToDate";

        sql += " ORDER BY TransDate, Id";

        var result = await connection.QueryAsync<PartyLedgerReportDto>(sql, new { PartyId = partyId, FromDate = fromDate, ToDate = toDate });
        
        return Ok(ApiResponse<List<PartyLedgerReportDto>>.Ok(result.ToList()));
    }

    [HttpGet("daily-production")]
    public async Task<ActionResult<ApiResponse<DailyProductionReportDto>>> GetDailyProduction([FromQuery] DateTime? date = null)
    {
        var reportDate = date ?? DateTime.Today;
        using var connection = _dapperContext.CreateConnection();
        
        var result = new DailyProductionReportDto { ReportDate = reportDate };

        // Yarn Receipts
        result.YarnReceiptsCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM YarnReceipts WHERE ReceiptDate = @Date AND IsActive = 1", new { Date = reportDate });
        
                result.YarnReceiptsKg = await connection.ExecuteScalarAsync<decimal>(
                        @"SELECT IFNULL(SUM(d.NetWeight), 0) 
                            FROM YarnReceipts yr 
                            INNER JOIN YarnReceiptDetails d ON yr.Id = d.YarnReceiptId 
                            WHERE yr.ReceiptDate = @Date AND yr.IsActive = 1", new { Date = reportDate });

        // Warping
        result.WarpingJobCardsCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM WarpingJobCards WHERE JobCardDate = @Date AND IsActive = 1", new { Date = reportDate });
        
        result.WarpingMeters = await connection.ExecuteScalarAsync<decimal>(
            "SELECT IFNULL(SUM(ActualLength), 0) FROM WarpingJobCards WHERE JobCardDate = @Date AND IsActive = 1 AND Status = 'Completed'", new { Date = reportDate });

        // Sizing
        result.SizingJobCardsCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM SizingJobCards WHERE JobCardDate = @Date AND IsActive = 1", new { Date = reportDate });
        
        result.SizingMeters = await connection.ExecuteScalarAsync<decimal>(
            "SELECT IFNULL(SUM(ActualLength), 0) FROM SizingJobCards WHERE JobCardDate = @Date AND IsActive = 1 AND Status = 'Completed'", new { Date = reportDate });

        // Tax Invoices
        result.InvoicesCount = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM TaxInvoices WHERE InvoiceDate = @Date AND Status <> 'Cancelled'", new { Date = reportDate });
        
        result.InvoiceAmount = await connection.ExecuteScalarAsync<decimal>(
            "SELECT IFNULL(SUM(GrandTotal), 0) FROM TaxInvoices WHERE InvoiceDate = @Date AND Status <> 'Cancelled'", new { Date = reportDate });

        return Ok(ApiResponse<DailyProductionReportDto>.Ok(result));
    }
}

public class PartyLedgerReportDto
{
    public DateTime TransDate { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNo { get; set; } = string.Empty;
    public string Particulars { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    public decimal RunningBalance { get; set; }
}

public class DailyProductionReportDto
{
    public DateTime ReportDate { get; set; }
    public int YarnReceiptsCount { get; set; }
    public decimal YarnReceiptsKg { get; set; }
    public int WarpingJobCardsCount { get; set; }
    public decimal WarpingMeters { get; set; }
    public int SizingJobCardsCount { get; set; }
    public decimal SizingMeters { get; set; }
    public int InvoicesCount { get; set; }
    public decimal InvoiceAmount { get; set; }
}
