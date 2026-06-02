using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface ISizingJobCardService
{
    Task<PagedResult<SizingJobCardListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null);
    Task<SizingJobCardDto?> GetByIdAsync(int id);
    Task<SizingJobCardDto> CreateAsync(CreateSizingJobCardRequest request, string createdBy);
    Task<SizingJobCardDto?> UpdateAsync(int id, UpdateSizingJobCardRequest request, string modifiedBy);
    Task<SizingJobCardDto?> CompleteAsync(int id, CompleteSizingJobCardRequest request, string completedBy);
    Task<SizingJobCardDto?> ApproveAsync(int id, ApproveJobCardRequest request, string approvedBy);
    Task<List<SizingJobCardDto>> GetPendingForInvoiceAsync(int? partyId = null);
    Task<ProductionSetDto?> GetProductionSetAsync(string setId);
    Task<List<ProductionSetDto>> GetAllProductionSetsAsync();
}

public class SizingJobCardService : ISizingJobCardService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IBeamService _beamService;

    public SizingJobCardService(ApplicationDbContext context, IDocumentNumberService documentNumberService, IBeamService beamService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _beamService = beamService;
    }

    public async Task<PagedResult<SizingJobCardListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null)
    {
        var query = _context.SizingJobCards
            .Include(s => s.Party)
            .Include(s => s.YarnCount)
            .Include(s => s.LoomType)
            .Include(s => s.SourceBeams)
            .Include(s => s.Invoice)
            .Where(s => s.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(s => s.PartyId == partyId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(s =>
                s.JobCardNumber.ToLower().Contains(search) ||
                s.SetNo.ToLower().Contains(search) ||
                s.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.JobCardDate)
            .ThenByDescending(s => s.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(s => new SizingJobCardListDto
            {
                Id = s.Id,
                JobCardNo = s.JobCardNumber,
                JobCardDate = s.JobCardDate,
                SizingDate = s.SizingDate,
                PartyId = s.PartyId,
                PartyName = s.Party.PartyName,
                CountCode = s.YarnCount.CountCode,
                SetNo = s.SetNo,
                LoomTypeName = s.LoomType != null ? s.LoomType.LoomTypeName : null,
                TotalEnds = s.TotalEnds,
                SetLength = s.SetLength,
                ActualLength = s.ActualLength,
                Status = s.Status,
                InvoiceId = s.InvoiceId,
                InvoiceNumber = s.Invoice != null ? s.Invoice.InvoiceNumber : null,
                IsLocked = s.IsLocked,
                BeamCount = s.SourceBeams.Count
            })
            .ToListAsync();

        return new PagedResult<SizingJobCardListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<SizingJobCardDto?> GetByIdAsync(int id)
    {
        var jobCard = await _context.SizingJobCards
            .Include(s => s.Party)
            .Include(s => s.YarnCount)
            .Include(s => s.LoomType)
            .Include(s => s.OutputSizingBeam)
            .Include(s => s.Invoice)
            .Include(s => s.SourceBeams)
                .ThenInclude(sb => sb.Beam)
            .FirstOrDefaultAsync(s => s.Id == id);

        return jobCard == null ? null : MapToDto(jobCard);
    }

    public async Task<SizingJobCardDto> CreateAsync(CreateSizingJobCardRequest request, string createdBy)
    {
        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var jobCardNumber = await _documentNumberService.GetNextDocumentNumberAsync("SizingJobCard", financialYearId);

        var jobCard = new SizingJobCard
        {
            JobCardNumber = jobCardNumber,
            JobCardDate = request.JobCardDate,
            PartyId = request.PartyId,
            YarnCountId = request.YarnCountId,
            LotNo = request.LotNo,
            SetNo = request.SetNo,
            LoomTypeId = request.LoomTypeId,
            TotalEnds = request.TotalEnds,
            SetLength = request.SetLength,
            BeamWidth = request.BeamWidth,
            SizingMachineNo = request.SizingMachineNo,
            SizeRecipe = request.SizeRecipe,
            OutputSizingBeamId = request.OutputSizingBeamId,
            Status = "Draft",
            FinancialYearId = financialYearId,
            Remarks = request.Remarks,
            CreatedBy = createdBy
        };

        int sequence = 1;
        foreach (var beamId in request.SourceBeamIds)
        {
            jobCard.SourceBeams.Add(new SizingJobCardBeam
            {
                BeamId = beamId,
                BeamSequence = sequence++,
                CreatedBy = createdBy
            });
        }

        _context.SizingJobCards.Add(jobCard);
        await _context.SaveChangesAsync();

        // Update source beam statuses
        foreach (var beamId in request.SourceBeamIds)
        {
            await _beamService.UpdateStatusAsync(beamId, "InUse", jobCard.Id, "Sizing", createdBy);
        }

        // Update output beam status
        if (request.OutputSizingBeamId.HasValue)
        {
            await _beamService.UpdateStatusAsync(request.OutputSizingBeamId.Value, "InUse", jobCard.Id, "SizingOutput", createdBy);
        }

        return (await GetByIdAsync(jobCard.Id))!;
    }

    public async Task<SizingJobCardDto?> UpdateAsync(int id, UpdateSizingJobCardRequest request, string modifiedBy)
    {
        var jobCard = await _context.SizingJobCards
            .Include(s => s.SourceBeams)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (jobCard == null || jobCard.Status == "Authorized")
            return null;

        // Release old source beams
        foreach (var beam in jobCard.SourceBeams)
        {
            await _beamService.UpdateStatusAsync(beam.BeamId, "Available", null, null, modifiedBy);
        }

        jobCard.PartyId = request.PartyId;
        jobCard.YarnCountId = request.YarnCountId;
        jobCard.LotNo = request.LotNo;
        jobCard.LoomTypeId = request.LoomTypeId;
        jobCard.TotalEnds = request.TotalEnds;
        jobCard.SetLength = request.SetLength;
        jobCard.BeamWidth = request.BeamWidth;
        jobCard.SizingMachineNo = request.SizingMachineNo;
        jobCard.SizeRecipe = request.SizeRecipe;
        jobCard.OutputSizingBeamId = request.OutputSizingBeamId;
        jobCard.Remarks = request.Remarks;
        jobCard.ModifiedBy = modifiedBy;
        jobCard.ModifiedDate = DateTime.UtcNow;

        // Replace source beams
        _context.Set<SizingJobCardBeam>().RemoveRange(jobCard.SourceBeams);
        int sequence = 1;
        foreach (var beamId in request.SourceBeamIds)
        {
            jobCard.SourceBeams.Add(new SizingJobCardBeam
            {
                BeamId = beamId,
                BeamSequence = sequence++,
                CreatedBy = modifiedBy
            });
        }

        await _context.SaveChangesAsync();

        // Update new beam statuses
        foreach (var beamId in request.SourceBeamIds)
        {
            await _beamService.UpdateStatusAsync(beamId, "InUse", jobCard.Id, "Sizing", modifiedBy);
        }

        if (request.OutputSizingBeamId.HasValue)
        {
            await _beamService.UpdateStatusAsync(request.OutputSizingBeamId.Value, "InUse", jobCard.Id, "SizingOutput", modifiedBy);
        }

        return await GetByIdAsync(id);
    }

    public async Task<ProductionSetDto?> GetProductionSetAsync(string setId)
    {
        // Search for the set in warping or sizing job cards by SetNo
        var sizingCard = await _context.SizingJobCards
            .Include(s => s.Party)
            .Include(s => s.YarnCount)
            .Include(s => s.LoomType)
            .Include(s => s.SourceBeams)
            .Where(s => s.SetNo == setId && s.IsActive)
            .OrderByDescending(s => s.Id)
            .FirstOrDefaultAsync();

        if (sizingCard != null)
        {
            return new ProductionSetDto
            {
                SetId = sizingCard.SetNo,
                PartyId = sizingCard.PartyId,
                Party = sizingCard.Party.PartyName,
                YarnCount = sizingCard.YarnCount.CountCode,
                LoomType = sizingCard.LoomType?.LoomTypeName,
                TotalEnds = sizingCard.TotalEnds,
                SizingMeters = sizingCard.ActualLength ?? sizingCard.SetLength,
                Beams = sizingCard.SourceBeams.Count
            };
        }

        // Fallback: check warping cards
        var warpingCard = await _context.WarpingJobCards
            .Include(w => w.Party)
            .Include(w => w.YarnCount)
            .Include(w => w.Beams)
            .Where(w => w.SetNo == setId && w.IsActive)
            .OrderByDescending(w => w.Id)
            .FirstOrDefaultAsync();

        if (warpingCard != null)
        {
            return new ProductionSetDto
            {
                SetId = warpingCard.SetNo,
                PartyId = warpingCard.PartyId,
                Party = warpingCard.Party.PartyName,
                YarnCount = warpingCard.YarnCount.CountCode,
                LoomType = null,
                TotalEnds = warpingCard.TotalEnds,
                SizingMeters = warpingCard.ActualLength ?? warpingCard.SetLength,
                Beams = warpingCard.Beams.Count
            };
        }

        return null;
    }

    public async Task<List<ProductionSetDto>> GetAllProductionSetsAsync()
    {
        // Get unique SetNos from sizing job cards
        var sizingSets = await _context.SizingJobCards
            .Include(s => s.Party)
            .Include(s => s.YarnCount)
            .Include(s => s.LoomType)
            .Include(s => s.SourceBeams)
            .Where(s => s.IsActive && !string.IsNullOrEmpty(s.SetNo))
            .GroupBy(s => s.SetNo)
            .Select(g => g.OrderByDescending(s => s.Id).First())
            .ToListAsync();

        var sizingSetNos = sizingSets.Select(s => s.SetNo).ToHashSet();

        // Get unique SetNos from warping that don't exist in sizing
        var warpingSets = await _context.WarpingJobCards
            .Include(w => w.Party)
            .Include(w => w.YarnCount)
            .Include(w => w.Beams)
            .Where(w => w.IsActive && !string.IsNullOrEmpty(w.SetNo) && !sizingSetNos.Contains(w.SetNo))
            .GroupBy(w => w.SetNo)
            .Select(g => g.OrderByDescending(w => w.Id).First())
            .ToListAsync();

        var result = new List<ProductionSetDto>();

        foreach (var s in sizingSets)
        {
            result.Add(new ProductionSetDto
            {
                SetId = s.SetNo,
                PartyId = s.PartyId,
                Party = s.Party.PartyName,
                YarnCount = s.YarnCount.CountCode,
                LoomType = s.LoomType?.LoomTypeName,
                TotalEnds = s.TotalEnds,
                SizingMeters = s.ActualLength ?? s.SetLength,
                Beams = s.SourceBeams.Count
            });
        }

        foreach (var w in warpingSets)
        {
            result.Add(new ProductionSetDto
            {
                SetId = w.SetNo,
                PartyId = w.PartyId,
                Party = w.Party.PartyName,
                YarnCount = w.YarnCount.CountCode,
                LoomType = null,
                TotalEnds = w.TotalEnds,
                SizingMeters = w.ActualLength ?? w.SetLength,
                Beams = w.Beams.Count
            });
        }

        return result.OrderByDescending(r => r.SetId).ToList();
    }

    public async Task<SizingJobCardDto?> CompleteAsync(int id, CompleteSizingJobCardRequest request, string completedBy)
    {
        var jobCard = await _context.SizingJobCards
            .Include(s => s.SourceBeams)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (jobCard == null)
            return null;

        jobCard.ActualLength = request.ActualLength;
        jobCard.OutputWeight = request.OutputWeight;
        jobCard.SizingDate = request.SizingDate;
        jobCard.Status = "Completed";
        jobCard.ModifiedBy = completedBy;
        jobCard.ModifiedDate = DateTime.UtcNow;

        // Release source beams
        foreach (var beam in jobCard.SourceBeams)
        {
            await _beamService.UpdateStatusAsync(beam.BeamId, "Available", null, null, completedBy);
        }

        // Mark output beam as sizing complete
        if (jobCard.OutputSizingBeamId.HasValue)
        {
            await _beamService.UpdateStatusAsync(jobCard.OutputSizingBeamId.Value, "SizingComplete", jobCard.Id, "SizingOutput", completedBy);
        }

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<SizingJobCardDto?> ApproveAsync(int id, ApproveJobCardRequest request, string approvedBy)
    {
        var jobCard = await _context.SizingJobCards.FindAsync(id);
        if (jobCard == null)
            return null;

        // Validate approval sequence
        var (isValid, errorMessage) = ValidateApprovalSequence(jobCard.Status, request.ApprovalLevel);
        if (!isValid)
            throw new InvalidOperationException(errorMessage);

        var newStatus = request.ApprovalLevel switch
        {
            "Prepare" => "Prepared",
            "Check" => "Checked",
            "Approve" => "Approved",
            "Authorize" => "Authorized",
            _ => throw new ArgumentException("Invalid approval level")
        };

        jobCard.Status = newStatus;
        jobCard.ModifiedBy = approvedBy;
        jobCard.ModifiedDate = DateTime.UtcNow;

        switch (request.ApprovalLevel)
        {
            case "Prepare":
                jobCard.PreparedBy = approvedBy;
                jobCard.PreparedDate = DateTime.UtcNow;
                break;
            case "Check":
                jobCard.CheckedBy = approvedBy;
                jobCard.CheckedDate = DateTime.UtcNow;
                break;
            case "Approve":
                jobCard.ApprovedBy = approvedBy;
                jobCard.ApprovedDate = DateTime.UtcNow;
                break;
            case "Authorize":
                jobCard.AuthorizedBy = approvedBy;
                jobCard.AuthorizedDate = DateTime.UtcNow;
                break;
        }

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<List<SizingJobCardDto>> GetPendingForInvoiceAsync(int? partyId = null)
    {
        var query = _context.SizingJobCards
            .Include(s => s.Party)
            .Include(s => s.YarnCount)
            .Where(s => s.Status == "Authorized" && s.InvoiceId == null);

        if (partyId.HasValue)
            query = query.Where(s => s.PartyId == partyId);

        return await query
            .OrderBy(s => s.JobCardDate)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    private static (bool IsValid, string ErrorMessage) ValidateApprovalSequence(string currentStatus, string approvalLevel)
    {
        return (currentStatus, approvalLevel) switch
        {
            ("Draft", "Prepare") or ("Completed", "Prepare") => (true, string.Empty),
            ("Prepared", "Check") => (true, string.Empty),
            ("Checked", "Approve") => (true, string.Empty),
            ("Approved", "Authorize") => (true, string.Empty),
            ("Draft", _) => (false, $"Cannot {approvalLevel} from Draft status. Must Prepare first."),
            ("Prepared", _) => (false, $"Cannot {approvalLevel} from Prepared status. Must Check first."),
            ("Checked", _) => (false, $"Cannot {approvalLevel} from Checked status. Must Approve first."),
            ("Approved", _) => (false, $"Cannot {approvalLevel} from Approved status. Must Authorize."),
            _ => (false, $"Invalid status transition from {currentStatus} using {approvalLevel}")
        };
    }

    private static SizingJobCardDto MapToDto(SizingJobCard s)
    {
        return new SizingJobCardDto
        {
            Id = s.Id,
            JobCardNumber = s.JobCardNumber,
            JobCardDate = s.JobCardDate,
            PartyId = s.PartyId,
            PartyCode = s.Party.PartyCode,
            PartyName = s.Party.PartyName,
            YarnCountId = s.YarnCountId,
            CountCode = s.YarnCount.CountCode,
            LotNo = s.LotNo,
            SetNo = s.SetNo,
            LoomTypeId = s.LoomTypeId,
            LoomTypeName = s.LoomType?.LoomTypeName,
            TotalEnds = s.TotalEnds,
            SetLength = s.SetLength,
            ActualLength = s.ActualLength,
            BeamWidth = s.BeamWidth,
            SizingMachineNo = s.SizingMachineNo,
            SizeRecipe = s.SizeRecipe,
            OutputSizingBeamId = s.OutputSizingBeamId,
            OutputBeamNo = s.OutputSizingBeam?.BeamNo,
            OutputWeight = s.OutputWeight,
            SizingDate = s.SizingDate,
            Status = s.Status,
            InvoiceId = s.InvoiceId,
            InvoiceNumber = s.Invoice?.InvoiceNumber,
            PreparedBy = s.PreparedBy,
            PreparedDate = s.PreparedDate,
            CheckedBy = s.CheckedBy,
            CheckedDate = s.CheckedDate,
            ApprovedBy = s.ApprovedBy,
            ApprovedDate = s.ApprovedDate,
            AuthorizedBy = s.AuthorizedBy,
            AuthorizedDate = s.AuthorizedDate,
            Remarks = s.Remarks,
            SourceBeams = s.SourceBeams.OrderBy(b => b.BeamSequence).Select(b => new SizingJobCardBeamDto
            {
                Id = b.Id,
                BeamId = b.BeamId,
                BeamNo = b.Beam.BeamNo,
                BeamSequence = b.BeamSequence,
                EndsOnBeam = b.EndsOnBeam
            }).ToList()
        };
    }
}
