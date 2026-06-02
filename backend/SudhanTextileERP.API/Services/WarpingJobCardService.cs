using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IWarpingJobCardService
{
    Task<PagedResult<WarpingJobCardListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null);
    Task<WarpingJobCardDto?> GetByIdAsync(int id);
    Task<WarpingJobCardDto> CreateAsync(CreateWarpingJobCardRequest request, string createdBy);
    Task<WarpingJobCardDto?> UpdateAsync(int id, UpdateWarpingJobCardRequest request, string modifiedBy);
    Task<WarpingJobCardDto?> CompleteAsync(int id, decimal actualLength, string completedBy);
}

public class WarpingJobCardService : IWarpingJobCardService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IBeamService _beamService;

    public WarpingJobCardService(ApplicationDbContext context, IDocumentNumberService documentNumberService, IBeamService beamService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _beamService = beamService;
    }

    public async Task<PagedResult<WarpingJobCardListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null)
    {
        var query = _context.WarpingJobCards
            .Include(w => w.Party)
            .Include(w => w.YarnCount)
            .Include(w => w.Beams)
                .ThenInclude(b => b.Beam)
            .Where(w => w.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(w => w.PartyId == partyId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(w => w.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(w =>
                w.JobCardNumber.ToLower().Contains(search) ||
                w.SetNo.ToLower().Contains(search) ||
                w.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(w => w.JobCardDate)
            .ThenByDescending(w => w.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(w => new WarpingJobCardListDto
            {
                Id = w.Id,
                JobCardNo = w.JobCardNumber,
                JobCardDate = w.JobCardDate,
                WarpingDate = w.WarpingDate,
                PartyId = w.PartyId,
                PartyName = w.Party.PartyName,
                YarnCountId = w.YarnCountId,
                CountCode = w.YarnCount.CountCode,
                YarnCount = w.YarnCount.CountDescription ?? w.YarnCount.CountCode,
                LoomType = null, // WarpingJobCard doesn't have LoomType
                LotNo = w.LotNo ?? string.Empty,
                TotalEnds = w.TotalEnds,
                TotalMeters = w.SetLength,
                BeamCount = w.Beams.Count,
                ApprovalStatus = w.Status,
                PreparedBy = w.CreatedBy,
                PreparedAt = w.CreatedDate,
                IsKarlMayer = false // Set based on your business logic
            })
            .ToListAsync();

        return new PagedResult<WarpingJobCardListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<WarpingJobCardDto?> GetByIdAsync(int id)
    {
        var jobCard = await _context.WarpingJobCards
            .Include(w => w.Party)
            .Include(w => w.YarnCount)
            .Include(w => w.Beams)
                .ThenInclude(b => b.Beam)
            .FirstOrDefaultAsync(w => w.Id == id);

        return jobCard == null ? null : MapToDto(jobCard);
    }

    private async Task<string> GenerateSetIdAsync()
    {
        var today = DateTime.Today;
        var datePart = today.ToString("yyyyMMdd");
        var prefix = $"SET-{datePart}-";

        // Find the highest sequence for today
        var todayCards = await _context.WarpingJobCards
            .Where(w => w.SetNo != null && w.SetNo.StartsWith(prefix))
            .Select(w => w.SetNo)
            .ToListAsync();

        var maxSeq = 0;
        foreach (var setNo in todayCards)
        {
            var seqPart = setNo.Substring(prefix.Length);
            if (int.TryParse(seqPart, out var seq) && seq > maxSeq)
                maxSeq = seq;
        }

        return $"{prefix}{(maxSeq + 1).ToString().PadLeft(3, '0')}";
    }

    public async Task<WarpingJobCardDto> CreateAsync(CreateWarpingJobCardRequest request, string createdBy)
    {
        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var jobCardNumber = await _documentNumberService.GetNextDocumentNumberAsync("WarpingJobCard", financialYearId);

        // Auto-generate SET_ID if not provided
        var setId = !string.IsNullOrWhiteSpace(request.SetNo) ? request.SetNo : await GenerateSetIdAsync();

        var jobCard = new WarpingJobCard
        {
            JobCardNumber = jobCardNumber,
            SetNo = setId,
            JobCardDate = request.JobCardDate,
            PartyId = request.PartyId,
            YarnCountId = request.YarnCountId,
            LotNo = request.LotNo,
            TotalEnds = request.TotalEnds,
            EndsPerBeam = request.EndsPerBeam,
            SetLength = request.SetLength,
            NumberOfBeams = request.NumberOfBeams,
            WarpingMachineNo = request.WarpingMachineNo,
            Status = "Draft",
            FinancialYearId = financialYearId,
            Remarks = request.Remarks,
            CreatedBy = createdBy
        };

        int sequence = 1;
        foreach (var beamId in request.BeamIds)
        {
            jobCard.Beams.Add(new WarpingJobCardBeam
            {
                BeamId = beamId,
                BeamSequence = sequence++,
                EndsOnBeam = request.EndsPerBeam,
                CreatedBy = createdBy
            });
        }

        _context.WarpingJobCards.Add(jobCard);
        await _context.SaveChangesAsync();

        // Update beam statuses
        foreach (var beamId in request.BeamIds)
        {
            await _beamService.UpdateStatusAsync(beamId, "InUse", jobCard.Id, "Warping", createdBy);
        }

        return (await GetByIdAsync(jobCard.Id))!;
    }

    public async Task<WarpingJobCardDto?> UpdateAsync(int id, UpdateWarpingJobCardRequest request, string modifiedBy)
    {
        var jobCard = await _context.WarpingJobCards
            .Include(w => w.Beams)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (jobCard == null || jobCard.Status == "Authorized")
            return null;

        // Release old beams
        foreach (var beam in jobCard.Beams)
        {
            await _beamService.UpdateStatusAsync(beam.BeamId, "Available", null, null, modifiedBy);
        }

        jobCard.PartyId = request.PartyId;
        jobCard.YarnCountId = request.YarnCountId;
        jobCard.LotNo = request.LotNo;
        jobCard.TotalEnds = request.TotalEnds;
        jobCard.EndsPerBeam = request.EndsPerBeam;
        jobCard.SetLength = request.SetLength;
        jobCard.NumberOfBeams = request.NumberOfBeams;
        jobCard.WarpingMachineNo = request.WarpingMachineNo;
        jobCard.Remarks = request.Remarks;
        jobCard.ModifiedBy = modifiedBy;
        jobCard.ModifiedDate = DateTime.UtcNow;

        // Replace beams
        _context.Set<WarpingJobCardBeam>().RemoveRange(jobCard.Beams);
        int sequence = 1;
        foreach (var beamId in request.BeamIds)
        {
            jobCard.Beams.Add(new WarpingJobCardBeam
            {
                BeamId = beamId,
                BeamSequence = sequence++,
                EndsOnBeam = request.EndsPerBeam,
                CreatedBy = modifiedBy
            });
        }

        await _context.SaveChangesAsync();

        // Update new beam statuses
        foreach (var beamId in request.BeamIds)
        {
            await _beamService.UpdateStatusAsync(beamId, "InUse", jobCard.Id, "Warping", modifiedBy);
        }

        return await GetByIdAsync(id);
    }

    public async Task<WarpingJobCardDto?> CompleteAsync(int id, decimal actualLength, string completedBy)
    {
        var jobCard = await _context.WarpingJobCards
            .Include(w => w.Beams)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (jobCard == null)
            return null;

        jobCard.ActualLength = actualLength;
        jobCard.Status = "Completed";
        jobCard.WarpingDate = DateTime.Today;
        jobCard.ModifiedBy = completedBy;
        jobCard.ModifiedDate = DateTime.UtcNow;

        // Update beam dates
        foreach (var beam in jobCard.Beams)
        {
            beam.WarpingDate = DateTime.Today;
        }

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    private static WarpingJobCardDto MapToDto(WarpingJobCard w)
    {
        return new WarpingJobCardDto
        {
            Id = w.Id,
            JobCardNumber = w.JobCardNumber,
            SetNo = w.SetNo,
            JobCardDate = w.JobCardDate,
            PartyId = w.PartyId,
            PartyCode = w.Party.PartyCode,
            PartyName = w.Party.PartyName,
            YarnCountId = w.YarnCountId,
            CountCode = w.YarnCount.CountCode,
            LotNo = w.LotNo,
            TotalEnds = w.TotalEnds,
            EndsPerBeam = w.EndsPerBeam,
            SetLength = w.SetLength,
            ActualLength = w.ActualLength,
            NumberOfBeams = w.NumberOfBeams,
            WarpingMachineNo = w.WarpingMachineNo,
            Status = w.Status,
            WarpingDate = w.WarpingDate,
            Remarks = w.Remarks,
            Beams = w.Beams.OrderBy(b => b.BeamSequence).Select(b => new WarpingJobCardBeamDto
            {
                Id = b.Id,
                BeamId = b.BeamId,
                BeamNo = b.Beam.BeamNo,
                BeamSequence = b.BeamSequence,
                WarpingDate = b.WarpingDate,
                EndsOnBeam = b.EndsOnBeam,
                BeamWeight = b.BeamWeight
            }).ToList()
        };
    }
}
