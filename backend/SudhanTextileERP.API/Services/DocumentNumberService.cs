using Dapper;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IDocumentNumberService
{
    Task<int> GetCurrentFinancialYearIdAsync();
    Task<string> GetNextDocumentNumberAsync(string documentType, int? financialYearId = null);
}

public class DocumentNumberService : IDocumentNumberService
{
    private readonly ApplicationDbContext _context;
    private readonly IDapperContext _dapperContext;

    public DocumentNumberService(ApplicationDbContext context, IDapperContext dapperContext)
    {
        _context = context;
        _dapperContext = dapperContext;
    }

    public async Task<int> GetCurrentFinancialYearIdAsync()
    {
        var today = DateTime.Today;
        var fy = await _context.FinancialYears
            .FirstOrDefaultAsync(f => f.IsActive && f.StartDate <= today && f.EndDate >= today);

        if (fy == null)
            throw new InvalidOperationException("No active financial year found for current date");

        return fy.Id;
    }

    public async Task<string> GetNextDocumentNumberAsync(string documentType, int? financialYearId = null)
    {
        if (financialYearId == null)
            financialYearId = await GetCurrentFinancialYearIdAsync();

        // SQLite-compatible implementation (no stored procedures)
        // Find or create document number series for this type and financial year
        var series = await _context.DocumentNumberSeries
            .FirstOrDefaultAsync(s => 
                s.DocumentType == documentType && 
                s.FinancialYearId == financialYearId);

        if (series == null)
        {
            // Create new series for this document type and financial year
            var fy = await _context.FinancialYears.FindAsync(financialYearId);
            var yearCode = fy?.YearCode ?? DateTime.Now.Year.ToString().Substring(2);
            
            series = new DocumentNumberSeries
            {
                DocumentType = documentType,
                DisplayName = documentType,
                FinancialYearId = financialYearId.Value,
                Prefix = GetDocumentPrefix(documentType),
                CurrentNumber = 0,
                Suffix = yearCode,
                PadLength = 4
            };
            _context.DocumentNumberSeries.Add(series);
        }

        // Increment and get next number
        series.CurrentNumber++;
        await _context.SaveChangesAsync();

        // Format: PREFIX + NUMBER + SUFFIX
        var numberPart = series.CurrentNumber.ToString().PadLeft(series.PadLength, '0');
        return $"{series.Prefix}{numberPart}/{series.Suffix}";
    }

    private string GetDocumentPrefix(string documentType)
    {
        return documentType switch
        {
            "YarnReceipt" => "YR",
            "BabyCone" => "BC",
            "YarnReturn" => "YRET",
            "YarnDelivery" => "YD",
            "WarpingJobCard" => "WJC",
            "SizingJobCard" => "SJC",
            "TaxInvoice" => "INV",
            _ => "DOC"
        };
    }
}
