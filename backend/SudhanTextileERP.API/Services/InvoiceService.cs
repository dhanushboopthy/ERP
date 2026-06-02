using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IInvoiceService
{
    Task<PagedResult<TaxInvoiceListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null);
    Task<TaxInvoiceDto?> GetByIdAsync(int id);
    Task<TaxInvoiceDto> CreateAsync(CreateTaxInvoiceRequest request, string createdBy);
    Task<TaxInvoiceDto?> UpdateAsync(int id, UpdateTaxInvoiceRequest request, string modifiedBy);
    Task<TaxInvoiceDto?> FinalizeAsync(int id, string finalizedBy);
    Task<TaxInvoiceDto?> PrintAndLockAsync(int id, string printedBy);
    Task<TaxInvoiceDto?> CancelAsync(int id, string cancelledBy, string reason);
}

public class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IAuditLogService _auditLogService;

    public InvoiceService(
        ApplicationDbContext context, 
        IDocumentNumberService documentNumberService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<TaxInvoiceListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null)
    {
        var query = _context.TaxInvoices
            .Include(i => i.Party)
            .Where(i => i.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(i => i.PartyId == partyId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(search) ||
                i.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(i => i.InvoiceDate)
            .ThenByDescending(i => i.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(i => new TaxInvoiceListDto
            {
                Id = i.Id,
                InvoiceNo = i.InvoiceNumber,
                InvoiceDate = i.InvoiceDate,
                PartyName = i.Party.PartyName,
                PartyGSTIN = i.Party.GSTIN,
                PlaceOfSupply = i.PlaceOfSupply,
                IsInterState = i.IsInterState,
                TaxableAmount = i.TaxableAmount,
                CGSTAmount = i.CGSTAmount,
                SGSTAmount = i.SGSTAmount,
                IGSTAmount = i.IGSTAmount,
                TotalTaxAmount = i.CGSTAmount + i.SGSTAmount + i.IGSTAmount,
                TotalAmount = i.TotalAmount,
                DueDate = i.DueDate,
                IsPaid = i.Status == "Paid",
                DaysOverdue = i.DueDate.HasValue && i.Status != "Paid" ? (int)(DateTime.Today - i.DueDate.Value).TotalDays : 0
            })
            .ToListAsync();

        return new PagedResult<TaxInvoiceListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<TaxInvoiceDto?> GetByIdAsync(int id)
    {
        var invoice = await _context.TaxInvoices
            .Include(i => i.Party)
            .Include(i => i.Details)
            .FirstOrDefaultAsync(i => i.Id == id);

        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<TaxInvoiceDto> CreateAsync(CreateTaxInvoiceRequest request, string createdBy)
    {
        // CRITICAL: Validate HSN/SAC code for sizing services
        const string REQUIRED_HSN = "998821";
        
        foreach (var item in request.Details)
        {
            if (item.HSNCode != REQUIRED_HSN)
                throw new InvalidOperationException($"Invalid HSN/SAC code '{item.HSNCode}'. Sizing services must use HSN/SAC: {REQUIRED_HSN}");
            
            if (item.Rate <= 0)
                throw new InvalidOperationException("Rate per unit cannot be zero or negative. Please provide valid sizing rate.");
        }
        
        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var invoiceNumber = await _documentNumberService.GetNextDocumentNumberAsync("TaxInvoice", financialYearId);

        // Calculate totals
        decimal taxableAmount = 0;
        decimal cgstAmount = 0;
        decimal sgstAmount = 0;
        decimal igstAmount = 0;

        var details = new List<TaxInvoiceDetail>();

        foreach (var item in request.Details)
        {
            var amount = item.Quantity * item.Rate;
            taxableAmount += amount;

            decimal itemCgst = 0, itemSgst = 0, itemIgst = 0;

            if (request.IsInterState)
            {
                itemIgst = amount * item.IGSTRate / 100;
                igstAmount += itemIgst;
            }
            else
            {
                itemCgst = amount * item.CGSTRate / 100;
                itemSgst = amount * item.SGSTRate / 100;
                cgstAmount += itemCgst;
                sgstAmount += itemSgst;
            }

            details.Add(new TaxInvoiceDetail
            {
                SizingJobCardId = item.SizingJobCardId,
                Description = item.Description,
                HSNCode = item.HSNCode,
                Quantity = item.Quantity,
                UOM = item.UOM,
                Rate = item.Rate,
                Amount = amount,
                CGSTRate = request.IsInterState ? 0 : item.CGSTRate,
                CGSTAmount = itemCgst,
                SGSTRate = request.IsInterState ? 0 : item.SGSTRate,
                SGSTAmount = itemSgst,
                IGSTRate = request.IsInterState ? item.IGSTRate : 0,
                IGSTAmount = itemIgst,
                CreatedBy = createdBy
            });
        }

        var totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;
        var roundOff = Math.Round(totalAmount) - totalAmount;
        var grandTotal = Math.Round(totalAmount);

        var invoice = new TaxInvoice
        {
            InvoiceNumber = invoiceNumber,
            InvoiceDate = request.InvoiceDate,
            PartyId = request.PartyId,
            PlaceOfSupply = request.PlaceOfSupply,
            IsInterState = request.IsInterState,
            TaxableAmount = taxableAmount,
            CGSTAmount = cgstAmount,
            SGSTAmount = sgstAmount,
            IGSTAmount = igstAmount,
            TotalAmount = totalAmount,
            RoundOff = roundOff,
            GrandTotal = grandTotal,
            Status = "Draft",
            FinancialYearId = financialYearId,
            DueDate = request.DueDate,
            TransportMode = request.TransportMode,
            VehicleNo = request.VehicleNo,
            EwayBillNo = request.EwayBillNo,
            Remarks = request.Remarks,
            CreatedBy = createdBy,
            Details = details
        };

        _context.TaxInvoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Audit log
        await _auditLogService.LogAsync("TaxInvoices", invoice.Id, "INSERT", null, invoice, createdBy);

        // Link sizing job cards to invoice
        var sizingJobCardIds = request.Details
            .Where(d => d.SizingJobCardId.HasValue)
            .Select(d => d.SizingJobCardId!.Value)
            .ToList();

        if (sizingJobCardIds.Any())
        {
            var sizingJobCards = await _context.SizingJobCards
                .Where(s => sizingJobCardIds.Contains(s.Id))
                .ToListAsync();

            foreach (var sjc in sizingJobCards)
            {
                sjc.InvoiceId = invoice.Id;
                sjc.ModifiedBy = createdBy;
                sjc.ModifiedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        return (await GetByIdAsync(invoice.Id))!;
    }

    public async Task<TaxInvoiceDto?> FinalizeAsync(int id, string finalizedBy)
    {
        var invoice = await _context.TaxInvoices.FindAsync(id);
        if (invoice == null)
            return null;

        if (invoice.Status != "Draft")
            throw new InvalidOperationException("Only draft invoices can be finalized");

        var oldValues = new { invoice.Status };
        
        invoice.Status = "Finalized";
        invoice.ModifiedBy = finalizedBy;
        invoice.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("TaxInvoices", invoice.Id, "UPDATE", oldValues, new { invoice.Status }, finalizedBy);

        return await GetByIdAsync(id);
    }

    public async Task<TaxInvoiceDto?> UpdateAsync(int id, UpdateTaxInvoiceRequest request, string modifiedBy)
    {
        var invoice = await _context.TaxInvoices.FindAsync(id);
        if (invoice == null)
            return null;

        if (invoice.IsLocked)
            throw new InvalidOperationException("Cannot modify a locked invoice");

        if (invoice.Status != "Draft")
            throw new InvalidOperationException("Only draft invoices can be modified");

        // Update allowed fields
        invoice.PlaceOfSupply = request.PlaceOfSupply ?? invoice.PlaceOfSupply;
        invoice.TransportMode = request.TransportMode;
        invoice.VehicleNo = request.VehicleNo;
        invoice.EwayBillNo = request.EwayBillNo;
        invoice.Remarks = request.Remarks;
        invoice.DueDate = request.DueDate ?? invoice.DueDate;
        invoice.ModifiedBy = modifiedBy;
        invoice.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("TaxInvoices", invoice.Id, "UPDATE", null, invoice, modifiedBy);

        return await GetByIdAsync(id);
    }

    public async Task<TaxInvoiceDto?> PrintAndLockAsync(int id, string printedBy)
    {
        var invoice = await _context.TaxInvoices.FindAsync(id);
        if (invoice == null)
            return null;

        if (invoice.Status != "Finalized")
            throw new InvalidOperationException("Only finalized invoices can be printed");

        // Lock the invoice after first print
        invoice.IsPrinted = true;
        invoice.PrintedAt = DateTime.UtcNow;
        invoice.IsLocked = true;
        invoice.ModifiedBy = printedBy;
        invoice.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("TaxInvoices", invoice.Id, "PRINT", null, new { invoice.IsPrinted, invoice.IsLocked, invoice.PrintedAt }, printedBy);

        return await GetByIdAsync(id);
    }

    public async Task<TaxInvoiceDto?> CancelAsync(int id, string cancelledBy, string reason)
    {
        var invoice = await _context.TaxInvoices
            .Include(i => i.SizingJobCards)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return null;

        invoice.Status = "Cancelled";
        invoice.Remarks = $"{invoice.Remarks} | Cancelled: {reason}";
        invoice.ModifiedBy = cancelledBy;
        invoice.ModifiedDate = DateTime.UtcNow;

        // Unlink sizing job cards
        foreach (var sjc in invoice.SizingJobCards)
        {
            sjc.InvoiceId = null;
            sjc.ModifiedBy = cancelledBy;
            sjc.ModifiedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("TaxInvoices", invoice.Id, "DELETE", null, new { invoice.Status, Reason = reason }, cancelledBy);

        return await GetByIdAsync(id);
    }

    private static TaxInvoiceDto MapToDto(TaxInvoice i)
    {
        return new TaxInvoiceDto
        {
            Id = i.Id,
            InvoiceNumber = i.InvoiceNumber,
            InvoiceDate = i.InvoiceDate,
            PartyId = i.PartyId,
            PartyCode = i.Party.PartyCode,
            PartyName = i.Party.PartyName,
            GSTIN = i.Party.GSTIN,
            PlaceOfSupply = i.PlaceOfSupply,
            IsInterState = i.IsInterState,
            TaxableAmount = i.TaxableAmount,
            CGSTAmount = i.CGSTAmount,
            SGSTAmount = i.SGSTAmount,
            IGSTAmount = i.IGSTAmount,
            TotalAmount = i.TotalAmount,
            RoundOff = i.RoundOff,
            GrandTotal = i.GrandTotal,
            Status = i.Status,
            DueDate = i.DueDate,
            TransportMode = i.TransportMode,
            VehicleNo = i.VehicleNo,
            EwayBillNo = i.EwayBillNo,
            IRNNumber = i.IRNNumber,
            Remarks = i.Remarks,
            IsLocked = i.IsLocked,
            IsPrinted = i.IsPrinted,
            PrintedAt = i.PrintedAt,
            Details = i.Details.Select(d => new TaxInvoiceDetailDto
            {
                Id = d.Id,
                SizingJobCardId = d.SizingJobCardId,
                Description = d.Description,
                HSNCode = d.HSNCode,
                Quantity = d.Quantity,
                UOM = d.UOM,
                Rate = d.Rate,
                Amount = d.Amount,
                CGSTRate = d.CGSTRate,
                CGSTAmount = d.CGSTAmount,
                SGSTRate = d.SGSTRate,
                SGSTAmount = d.SGSTAmount,
                IGSTRate = d.IGSTRate,
                IGSTAmount = d.IGSTAmount
            }).ToList()
        };
    }
}
