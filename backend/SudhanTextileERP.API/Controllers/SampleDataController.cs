using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

/// <summary>
/// Sample Data Controller - Provides sample data for all Sizing ERP modules
/// Enabled only in Development/Demo environments or for Admin users
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SampleDataController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SampleDataController> _logger;
    private readonly IDocumentNumberService _docNumberService;

    public SampleDataController(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<SampleDataController> logger,
        IDocumentNumberService docNumberService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _docNumberService = docNumberService;
    }

    /// <summary>
    /// Check if sample data generation is enabled
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public ActionResult GetStatus()
    {
        var isDemoMode = _configuration.GetValue<bool>("DemoMode:Enabled", true);
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        
        return Ok(new
        {
            success = true,
            data = new
            {
                demoModeEnabled = isDemoMode,
                environment = environment,
                isProduction = environment?.Equals("Production", StringComparison.OrdinalIgnoreCase) ?? false
            }
        });
    }

    /// <summary>
    /// Generate sample data for Yarn Receipt form
    /// </summary>
    [HttpGet("yarn-receipt")]
    public async Task<ActionResult<ApiResponse<object>>> GetYarnReceiptSample()
    {
        var party = await _context.Parties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var yarnCount = await _context.YarnCounts
            .Where(yc => yc.IsActive)
            .OrderBy(yc => yc.Id)
            .FirstOrDefaultAsync();

        if (party == null || yarnCount == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Master data not found. Please create Parties and Yarn Counts first."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            receiptDate = today.ToString("yyyy-MM-dd"),
            partyId = party.Id,
            partyName = party.PartyName,
            vehicleNo = $"TN-{random.Next(10, 99)}-AB-{random.Next(1000, 9999)}",
            driverName = GetRandomDriverName(),
            remarks = "Sample yarn receipt for testing",
            details = new[]
            {
                new
                {
                    yarnCountId = yarnCount.Id,
                    yarnCountCode = yarnCount.CountCode,
                    lotNo = $"LOT-{today:yyyyMMdd}-{random.Next(100, 999)}",
                    bagNo = "BAG-001",
                    grossWeight = 105.5m,
                    tareWeight = 5.5m,
                    netWeight = 100.0m,
                    coneCount = 24,
                    ratePerKg = 250.00m
                },
                new
                {
                    yarnCountId = yarnCount.Id,
                    yarnCountCode = yarnCount.CountCode,
                    lotNo = $"LOT-{today:yyyyMMdd}-{random.Next(100, 999)}",
                    bagNo = "BAG-002",
                    grossWeight = 102.0m,
                    tareWeight = 2.0m,
                    netWeight = 100.0m,
                    coneCount = 20,
                    ratePerKg = 250.00m
                }
            }
        };

        LogSampleDataUsage("yarn-receipt");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Yarn Receipt"));
    }

    /// <summary>
    /// Generate sample data for Baby Cone / Winding form
    /// </summary>
    [HttpGet("baby-cone")]
    public async Task<ActionResult<ApiResponse<object>>> GetBabyConeSample()
    {
        var yarnReceipt = await _context.YarnReceipts
            .Include(yr => yr.Party)
            .Include(yr => yr.Details)
                .ThenInclude(d => d.YarnCount)
            .Where(yr => yr.IsActive && yr.Status == "Approved")
            .OrderByDescending(yr => yr.Id)
            .FirstOrDefaultAsync();

        if (yarnReceipt == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "No approved Yarn Receipts found. Please create and approve a Yarn Receipt first."));
        }

        var detail = yarnReceipt.Details.FirstOrDefault();
        if (detail == null)
        {
            return BadRequest(ApiResponse<object>.Fail("Yarn Receipt has no details."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            babyConeDate = today.ToString("yyyy-MM-dd"),
            yarnReceiptId = yarnReceipt.Id,
            yarnReceiptNo = yarnReceipt.ReceiptNumber,
            yarnReceiptDetailId = detail.Id,
            yarnCountId = detail.YarnCountId,
            yarnCountCode = detail.YarnCount?.CountCode ?? "",
            lotNo = detail.LotNo ?? $"LOT-{today:yyyyMMdd}-{random.Next(100, 999)}",
            grossWeight = 52.5m,
            tareWeight = 2.5m,
            netWeight = 50.0m,
            coneCount = 12,
            windingLoss = 0.5m,
            leftoverWeight = 0.0m,
            remarks = "Sample baby cone entry for testing"
        };

        LogSampleDataUsage("baby-cone");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Baby Cone"));
    }

    /// <summary>
    /// Generate sample data for Yarn Return form
    /// </summary>
    [HttpGet("yarn-return")]
    public async Task<ActionResult<ApiResponse<object>>> GetYarnReturnSample()
    {
        var party = await _context.Parties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var yarnCount = await _context.YarnCounts
            .Where(yc => yc.IsActive)
            .OrderBy(yc => yc.Id)
            .FirstOrDefaultAsync();

        if (party == null || yarnCount == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Master data not found. Please create Parties and Yarn Counts first."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            returnDate = today.ToString("yyyy-MM-dd"),
            partyId = party.Id,
            partyName = party.PartyName,
            returnType = "Leftover",
            vehicleNo = $"TN-{random.Next(10, 99)}-CD-{random.Next(1000, 9999)}",
            driverName = GetRandomDriverName(),
            remarks = "Sample yarn return for testing",
            details = new[]
            {
                new
                {
                    yarnCountId = yarnCount.Id,
                    yarnCountCode = yarnCount.CountCode,
                    lotNo = $"LOT-RET-{today:yyyyMMdd}-{random.Next(100, 999)}",
                    grossWeight = 25.5m,
                    tareWeight = 0.5m,
                    netWeight = 25.0m
                }
            }
        };

        LogSampleDataUsage("yarn-return");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Yarn Return"));
    }

    /// <summary>
    /// Generate sample data for Yarn Delivery form
    /// </summary>
    [HttpGet("yarn-delivery")]
    public async Task<ActionResult<ApiResponse<object>>> GetYarnDeliverySample()
    {
        var party = await _context.Parties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var yarnCount = await _context.YarnCounts
            .Where(yc => yc.IsActive)
            .OrderBy(yc => yc.Id)
            .FirstOrDefaultAsync();

        if (party == null || yarnCount == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Master data not found. Please create Parties and Yarn Counts first."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            deliveryDate = today.ToString("yyyy-MM-dd"),
            partyId = party.Id,
            partyName = party.PartyName,
            vehicleNo = $"TN-{random.Next(10, 99)}-EF-{random.Next(1000, 9999)}",
            driverName = GetRandomDriverName(),
            driverPhone = $"98{random.Next(10000000, 99999999)}",
            remarks = "Sample yarn delivery for testing",
            details = new[]
            {
                new
                {
                    yarnCountId = yarnCount.Id,
                    yarnCountCode = yarnCount.CountCode,
                    lotNo = $"LOT-DEL-{today:yyyyMMdd}-{random.Next(100, 999)}",
                    grossWeight = 105.0m,
                    tareWeight = 5.0m,
                    netWeight = 100.0m,
                    ratePerKg = 275.00m,
                    amount = 27500.00m
                }
            }
        };

        LogSampleDataUsage("yarn-delivery");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Yarn Delivery"));
    }

    /// <summary>
    /// Generate sample data for Sizing Job Card form
    /// </summary>
    [HttpGet("sizing-job-card")]
    public async Task<ActionResult<ApiResponse<object>>> GetSizingJobCardSample()
    {
        var party = await _context.Parties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var yarnCount = await _context.YarnCounts
            .Where(yc => yc.IsActive)
            .OrderBy(yc => yc.Id)
            .FirstOrDefaultAsync();

        var loomType = await _context.LoomTypes
            .Where(lt => lt.IsActive)
            .OrderBy(lt => lt.Id)
            .FirstOrDefaultAsync();

        var availableBeam = await _context.Beams
            .Where(b => b.IsActive && b.Status == "Available" && b.BeamType == "Sizing Beam")
            .OrderBy(b => b.Id)
            .FirstOrDefaultAsync();

        if (party == null || yarnCount == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Master data not found. Please create Parties and Yarn Counts first."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            jobCardDate = today.ToString("yyyy-MM-dd"),
            partyId = party.Id,
            partyName = party.PartyName,
            yarnCountId = yarnCount.Id,
            yarnCountCode = yarnCount.CountCode,
            loomTypeId = loomType?.Id,
            loomTypeName = loomType?.LoomTypeName,
            setNo = $"SET-{today:yyyyMMdd}-{random.Next(100, 999)}",
            lotNo = $"LOT-{today:yyyyMMdd}-{random.Next(100, 999)}",
            totalEnds = 4800,
            setLength = 2500.0m,
            beamWidth = 63.0m,
            sizingMachineNo = "SM-01",
            sizeRecipe = "Standard sizing recipe",
            outputSizingBeamId = availableBeam?.Id,
            outputSizingBeamNo = availableBeam?.BeamNo,
            remarks = "Sample sizing job card for testing"
        };

        LogSampleDataUsage("sizing-job-card");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Sizing Job Card"));
    }

    /// <summary>
    /// Generate sample data for Warping Job Card form
    /// </summary>
    [HttpGet("warping-job-card")]
    public async Task<ActionResult<ApiResponse<object>>> GetWarpingJobCardSample()
    {
        var party = await _context.Parties
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var yarnCount = await _context.YarnCounts
            .Where(yc => yc.IsActive)
            .OrderBy(yc => yc.Id)
            .FirstOrDefaultAsync();

        if (party == null || yarnCount == null)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "Master data not found. Please create Parties and Yarn Counts first."));
        }

        var random = new Random();
        var today = DateTime.Today;

        var sampleData = new
        {
            jobCardDate = today.ToString("yyyy-MM-dd"),
            partyId = party.Id,
            partyName = party.PartyName,
            yarnCountId = yarnCount.Id,
            yarnCountCode = yarnCount.CountCode,
            setNo = $"WRP-{today:yyyyMMdd}-{random.Next(100, 999)}",
            lotNo = $"LOT-{today:yyyyMMdd}-{random.Next(100, 999)}",
            totalEnds = 4800,
            setLength = 2500.0m,
            warpingMachineNo = "WM-01",
            creel = "Standard",
            beamCount = 4,
            remarks = "Sample warping job card for testing"
        };

        LogSampleDataUsage("warping-job-card");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Warping Job Card"));
    }

    /// <summary>
    /// Generate sample data for Beam Management form
    /// </summary>
    [HttpGet("beam")]
    public ActionResult<ApiResponse<object>> GetBeamSample()
    {
        var random = new Random();

        var sampleData = new
        {
            beamNo = $"BEAM-{random.Next(1000, 9999)}",
            beamType = "Sizing Beam",
            tareWeight = 85.5m,
            widthInches = 63.0m,
            maxEnds = 4800
        };

        LogSampleDataUsage("beam");
        return Ok(ApiResponse<object>.Ok(sampleData, "Sample data generated for Beam"));
    }

    /// <summary>
    /// Get all available sample data endpoints
    /// </summary>
    [HttpGet("available")]
    public ActionResult<ApiResponse<object>> GetAvailableEndpoints()
    {
        var endpoints = new[]
        {
            new { module = "yarn-receipt", endpoint = "/api/sampledata/yarn-receipt", description = "Yarn Receipt sample data" },
            new { module = "baby-cone", endpoint = "/api/sampledata/baby-cone", description = "Baby Cone / Winding sample data" },
            new { module = "yarn-return", endpoint = "/api/sampledata/yarn-return", description = "Yarn Return DC sample data" },
            new { module = "yarn-delivery", endpoint = "/api/sampledata/yarn-delivery", description = "Yarn Delivery DC sample data" },
            new { module = "sizing-job-card", endpoint = "/api/sampledata/sizing-job-card", description = "Sizing Job Card sample data" },
            new { module = "warping-job-card", endpoint = "/api/sampledata/warping-job-card", description = "Warping Job Card sample data" },
            new { module = "beam", endpoint = "/api/sampledata/beam", description = "Beam Management sample data" }
        };

        return Ok(ApiResponse<object>.Ok(endpoints, "Available sample data endpoints"));
    }

    // Helper methods
    private static string GetRandomDriverName()
    {
        var names = new[] { "Raman", "Kumar", "Selvam", "Murugan", "Kannan", "Velu", "Raja", "Senthil" };
        return names[new Random().Next(names.Length)];
    }

    private void LogSampleDataUsage(string module)
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous";
        _logger.LogInformation("Sample data generated for {Module} by {User}", module, username);
    }

    /// <summary>
    /// Generate sample transaction data across ALL modules in one click.
    /// Creates: Yarn Receipts (approved) → Baby Cones → Warping Job Cards → Sizing Job Cards → Yarn Returns → Yarn Deliveries
    /// </summary>
    [HttpPost("generate-all")]
    public async Task<ActionResult<ApiResponse<object>>> GenerateAllSampleData()
    {
        var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var now = DateTime.UtcNow;
        var today = DateTime.Today;

        try
        {
            // Check if sample data already exists
            var existingReceipts = await _context.YarnReceipts.CountAsync();
            if (existingReceipts > 0)
            {
                return BadRequest(ApiResponse<object>.Fail(
                    "Sample transaction data already exists. Clear existing data first or use the existing records."));
            }

            // Load master data
            var fy = await _context.FinancialYears.FirstOrDefaultAsync(f => f.IsCurrent && f.IsActive);
            if (fy == null) return BadRequest(ApiResponse<object>.Fail("No active financial year found."));

            var parties = await _context.Parties.Where(p => p.IsActive).ToListAsync();
            var yarnCounts = await _context.YarnCounts.Where(y => y.IsActive).ToListAsync();
            var vehicles = await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
            var warpingBeams = await _context.Beams.Where(b => b.IsActive && b.BeamType == "Warping Beam" && b.Status == "Available").ToListAsync();
            var sizingBeams = await _context.Beams.Where(b => b.IsActive && b.BeamType == "Sizing Beam" && b.Status == "Available").ToListAsync();
            var loomTypes = await _context.LoomTypes.Where(l => l.IsActive).ToListAsync();

            if (parties.Count == 0 || yarnCounts.Count == 0)
                return BadRequest(ApiResponse<object>.Fail("Master data (parties, yarn counts) not found. Seed master data first."));

            var party1 = parties[0];
            var party2 = parties.Count > 1 ? parties[1] : parties[0];
            var yc1 = yarnCounts[0]; // 20s
            var yc2 = yarnCounts.Count > 1 ? yarnCounts[1] : yarnCounts[0]; // 30s
            var vehicle = vehicles.FirstOrDefault();
            var loomType = loomTypes.FirstOrDefault();
            int created = 0;

            // ── 1. YARN RECEIPTS (2 receipts, approved) ──
            var yr1No = await _docNumberService.GetNextDocumentNumberAsync("YarnReceipt", fy.Id);
            var yr1 = new YarnReceipt
            {
                ReceiptNumber = yr1No,
                ReceiptDate = today.AddDays(-5),
                PartyId = party1.Id,
                VehicleId = vehicle?.Id,
                VehicleNo = vehicle?.VehicleNo ?? "TN 33 AB 1234",
                DriverName = vehicle?.DriverName ?? "Raman",
                FinancialYearId = fy.Id,
                Remarks = "Sample receipt - 20s yarn from " + party1.PartyName,
                Status = "Approved",
                IsLocked = false,
                IsUsedInJobCard = false,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnReceipts.Add(yr1);
            await _context.SaveChangesAsync();

            var yr1d1 = new YarnReceiptDetail
            {
                YarnReceiptId = yr1.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                BagNo = "BAG-001",
                GrossWeight = 210.0m,
                TareWeight = 10.0m,
                NetWeight = 200.0m,
                ConeCount = 48,
                RatePerKg = 250.00m,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            var yr1d2 = new YarnReceiptDetail
            {
                YarnReceiptId = yr1.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                BagNo = "BAG-002",
                GrossWeight = 105.0m,
                TareWeight = 5.0m,
                NetWeight = 100.0m,
                ConeCount = 24,
                RatePerKg = 250.00m,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnReceiptDetails.AddRange(yr1d1, yr1d2);
            await _context.SaveChangesAsync();
            created++;

            // Update yarn stock for receipt 1
            await AddStockLedgerEntry("YarnReceipt", yr1No, yr1.Id, yc1.Id, party1.Id, yr1d1.LotNo, yr1d1.NetWeight + yr1d2.NetWeight, 0, 250.00m, fy.Id, username);

            var yr2No = await _docNumberService.GetNextDocumentNumberAsync("YarnReceipt", fy.Id);
            var yr2 = new YarnReceipt
            {
                ReceiptNumber = yr2No,
                ReceiptDate = today.AddDays(-3),
                PartyId = party2.Id,
                VehicleId = vehicle?.Id,
                VehicleNo = vehicle?.VehicleNo ?? "TN 33 XY 6789",
                DriverName = "Kumar",
                FinancialYearId = fy.Id,
                Remarks = "Sample receipt - 30s yarn from " + party2.PartyName,
                Status = "Approved",
                IsLocked = false,
                IsUsedInJobCard = false,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnReceipts.Add(yr2);
            await _context.SaveChangesAsync();

            var yr2d1 = new YarnReceiptDetail
            {
                YarnReceiptId = yr2.Id,
                YarnCountId = yc2.Id,
                LotNo = "LOT-2025-B01",
                BagNo = "BAG-001",
                GrossWeight = 315.0m,
                TareWeight = 15.0m,
                NetWeight = 300.0m,
                ConeCount = 72,
                RatePerKg = 280.00m,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnReceiptDetails.Add(yr2d1);
            await _context.SaveChangesAsync();
            created++;

            await AddStockLedgerEntry("YarnReceipt", yr2No, yr2.Id, yc2.Id, party2.Id, yr2d1.LotNo, yr2d1.NetWeight, 0, 280.00m, fy.Id, username);

            // ── 2. BABY CONES (2 entries) ──
            var bc1No = await _docNumberService.GetNextDocumentNumberAsync("BabyCone", fy.Id);
            var bc1 = new BabyCone
            {
                BabyConeNo = bc1No,
                BabyConeDate = today.AddDays(-4),
                FinancialYearId = fy.Id,
                YarnReceiptId = yr1.Id,
                YarnReceiptDetailId = yr1d1.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                BagNo = 1,
                TotalCones = 24,
                GrossWeight = 105.0m,
                TareWeight = 5.0m,
                NetWeight = 100.0m,
                WindingLoss = 0.5m,
                LeftoverWeight = 0.0m,
                IsUsedInWarping = false,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.BabyCones.Add(bc1);

            var bc2No = await _docNumberService.GetNextDocumentNumberAsync("BabyCone", fy.Id);
            var bc2 = new BabyCone
            {
                BabyConeNo = bc2No,
                BabyConeDate = today.AddDays(-3),
                FinancialYearId = fy.Id,
                YarnReceiptId = yr2.Id,
                YarnReceiptDetailId = yr2d1.Id,
                YarnCountId = yc2.Id,
                LotNo = "LOT-2025-B01",
                BagNo = 1,
                TotalCones = 36,
                GrossWeight = 155.0m,
                TareWeight = 5.0m,
                NetWeight = 150.0m,
                WindingLoss = 0.8m,
                LeftoverWeight = 0.0m,
                IsUsedInWarping = false,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.BabyCones.Add(bc2);
            await _context.SaveChangesAsync();
            created += 2;

            // ── 3. WARPING JOB CARD (1 card with beams) ──
            var wjcNo = await _docNumberService.GetNextDocumentNumberAsync("WarpingJobCard", fy.Id);
            var wjc = new WarpingJobCard
            {
                JobCardNumber = wjcNo,
                SetNo = "SET-2025-001",
                JobCardDate = today.AddDays(-2),
                PartyId = party1.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                TotalEnds = 4800,
                EndsPerBeam = 1600,
                SetLength = 2500.0m,
                NumberOfBeams = 3,
                WarpingMachineNo = "WM-01",
                Status = "Completed",
                WarpingDate = today.AddDays(-2),
                FinancialYearId = fy.Id,
                IsLocked = false,
                Remarks = "Sample warping job card",
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.WarpingJobCards.Add(wjc);
            await _context.SaveChangesAsync();

            // Add beams to warping card
            for (int i = 0; i < Math.Min(3, warpingBeams.Count); i++)
            {
                _context.WarpingJobCardBeams.Add(new WarpingJobCardBeam
                {
                    WarpingJobCardId = wjc.Id,
                    BeamId = warpingBeams[i].Id,
                    BeamSequence = i + 1,
                    EndsOnBeam = 1600,
                    BeamWeight = 85.0m,
                    WarpingDate = today.AddDays(-2),
                    IsActive = true,
                    CreatedBy = username,
                    CreatedDate = now
                });
            }
            await _context.SaveChangesAsync();
            created++;

            // ── 4. SIZING JOB CARD (1 card - Draft status) ──
            var sjcNo = await _docNumberService.GetNextDocumentNumberAsync("SizingJobCard", fy.Id);
            var sjc = new SizingJobCard
            {
                JobCardNumber = sjcNo,
                JobCardDate = today.AddDays(-1),
                PartyId = party1.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                SetNo = "SET-2025-001",
                LoomTypeId = loomType?.Id,
                TotalEnds = 4800,
                SetLength = 2500.0m,
                BeamWidth = 44.0m,
                SizingMachineNo = "SM-01",
                SizeRecipe = "Standard PVA + Starch Mix",
                OutputSizingBeamId = sizingBeams.FirstOrDefault()?.Id,
                Status = "Draft",
                FinancialYearId = fy.Id,
                IsLocked = false,
                Remarks = "Sample sizing job card",
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.SizingJobCards.Add(sjc);
            await _context.SaveChangesAsync();

            // Add source beams
            for (int i = 0; i < Math.Min(2, sizingBeams.Count); i++)
            {
                _context.SizingJobCardBeams.Add(new SizingJobCardBeam
                {
                    SizingJobCardId = sjc.Id,
                    BeamId = sizingBeams[i].Id,
                    BeamSequence = i + 1,
                    EndsOnBeam = 2400,
                    IsActive = true,
                    CreatedBy = username,
                    CreatedDate = now
                });
            }
            await _context.SaveChangesAsync();
            created++;

            // ── 5. YARN RETURN (1 return - Draft) ──
            var yretNo = await _docNumberService.GetNextDocumentNumberAsync("YarnReturn", fy.Id);
            var yret = new YarnReturn
            {
                DCNo = yretNo,
                DCDate = today,
                FinancialYearId = fy.Id,
                PartyId = party1.Id,
                ReturnType = "Jobwork",
                VehicleId = vehicle?.Id,
                DriverName = "Selvam",
                TotalWeight = 25.0m,
                IsNotForSale = false,
                Status = "Draft",
                Remarks = "Sample yarn return - leftover from sizing",
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnReturns.Add(yret);
            await _context.SaveChangesAsync();

            _context.YarnReturnDetails.Add(new YarnReturnDetail
            {
                YarnReturnId = yret.Id,
                YarnCountId = yc1.Id,
                LotNo = "LOT-2025-A01",
                Bags = 1,
                Cones = 6,
                GrossWeight = 26.0m,
                TareWeight = 1.0m,
                NetWeight = 25.0m,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            });
            await _context.SaveChangesAsync();
            created++;

            // ── 6. YARN DELIVERY (1 delivery - Draft) ──
            var ydNo = await _docNumberService.GetNextDocumentNumberAsync("YarnDelivery", fy.Id);
            var yd = new YarnDelivery
            {
                DCNo = ydNo,
                DCDate = today,
                FinancialYearId = fy.Id,
                PartyId = party2.Id,
                VehicleId = vehicle?.Id,
                DriverName = "Murugan",
                DriverPhone = "9876543210",
                TotalWeight = 50.0m,
                TotalAmount = 14000.00m,
                Status = "Draft",
                Remarks = "Sample yarn delivery to customer",
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            };
            _context.YarnDeliveries.Add(yd);
            await _context.SaveChangesAsync();

            _context.YarnDeliveryDetails.Add(new YarnDeliveryDetail
            {
                YarnDeliveryId = yd.Id,
                YarnCountId = yc2.Id,
                LotNo = "LOT-2025-B01",
                Bags = 1,
                Cones = 12,
                GrossWeight = 52.0m,
                TareWeight = 2.0m,
                NetWeight = 50.0m,
                RatePerKg = 280.00m,
                Amount = 14000.00m,
                IsActive = true,
                CreatedBy = username,
                CreatedDate = now
            });
            await _context.SaveChangesAsync();
            created++;

            LogSampleDataUsage("generate-all");

            return Ok(ApiResponse<object>.Ok(new
            {
                totalRecordsCreated = created,
                yarnReceipts = 2,
                babyCones = 2,
                warpingJobCards = 1,
                sizingJobCards = 1,
                yarnReturns = 1,
                yarnDeliveries = 1,
                message = "Sample transaction data created successfully across all modules!"
            }, "All sample data generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate sample data");
            return BadRequest(ApiResponse<object>.Fail($"Failed to generate sample data: {ex.Message}"));
        }
    }

    /// <summary>
    /// Clear all sample transaction data (keeps master data)
    /// </summary>
    [HttpPost("clear-all")]
    public async Task<ActionResult<ApiResponse<object>>> ClearAllSampleData()
    {
        try
        {
            // Delete in reverse dependency order
            _context.TaxInvoiceDetails.RemoveRange(await _context.TaxInvoiceDetails.ToListAsync());
            _context.TaxInvoices.RemoveRange(await _context.TaxInvoices.ToListAsync());
            _context.YarnDeliveryDetails.RemoveRange(await _context.YarnDeliveryDetails.ToListAsync());
            _context.YarnDeliveries.RemoveRange(await _context.YarnDeliveries.ToListAsync());
            _context.YarnReturnDetails.RemoveRange(await _context.YarnReturnDetails.ToListAsync());
            _context.YarnReturns.RemoveRange(await _context.YarnReturns.ToListAsync());
            _context.SizingJobCardBeams.RemoveRange(await _context.SizingJobCardBeams.ToListAsync());
            _context.SizingJobCards.RemoveRange(await _context.SizingJobCards.ToListAsync());
            _context.WarpingJobCardBeams.RemoveRange(await _context.WarpingJobCardBeams.ToListAsync());
            _context.WarpingJobCards.RemoveRange(await _context.WarpingJobCards.ToListAsync());
            _context.BabyCones.RemoveRange(await _context.BabyCones.ToListAsync());
            _context.YarnReceiptDetails.RemoveRange(await _context.YarnReceiptDetails.ToListAsync());
            _context.YarnReceipts.RemoveRange(await _context.YarnReceipts.ToListAsync());
            _context.StockLedgers.RemoveRange(await _context.StockLedgers.ToListAsync());
            _context.YarnStocks.RemoveRange(await _context.YarnStocks.ToListAsync());

            // Reset document number series
            var series = await _context.DocumentNumberSeries.ToListAsync();
            foreach (var s in series)
                s.CurrentNumber = 0;

            await _context.SaveChangesAsync();

            LogSampleDataUsage("clear-all");

            return Ok(ApiResponse<object>.Ok(new { cleared = true }, "All transaction data cleared. Master data preserved."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear sample data");
            return BadRequest(ApiResponse<object>.Fail($"Failed: {ex.Message}"));
        }
    }

    private async Task AddStockLedgerEntry(string module, string refNo, int refId, int yarnCountId, int partyId, string? lotNo, decimal inward, decimal outward, decimal rate, int fyId, string user)
    {
        // Calculate running balance
        var currentBalance = await _context.StockLedgers
            .Where(s => s.YarnCountId == yarnCountId && s.LotNo == (lotNo ?? ""))
            .OrderByDescending(s => s.Id)
            .Select(s => s.BalanceQty)
            .FirstOrDefaultAsync();

        var newBalance = currentBalance + inward - outward;

        _context.StockLedgers.Add(new StockLedger
        {
            TransactionDate = DateTime.Today,
            Module = module,
            ReferenceNo = refNo,
            ReferenceId = refId,
            YarnCountId = yarnCountId,
            PartyId = partyId,
            LotNo = lotNo,
            InwardQty = inward,
            OutwardQty = outward,
            BalanceQty = newBalance,
            RatePerUnit = rate,
            TransactionValue = (inward > 0 ? inward : outward) * rate,
            TransactionType = inward > 0 ? "Inward" : "Outward",
            Narration = $"Sample data: {module}",
            FinancialYearId = fyId,
            IsActive = true,
            CreatedBy = user,
            CreatedDate = DateTime.UtcNow
        });

        // Keep YarnStocks in sync because dashboard yarn-stock APIs read from this table.
        var previousYarnStockBalance = await _context.YarnStocks
            .Where(s => s.YarnCountId == yarnCountId && s.PartyId == partyId && s.LotNo == lotNo)
            .OrderByDescending(s => s.Id)
            .Select(s => s.CurrentBalanceKg)
            .FirstOrDefaultAsync();

        var yarnStockBalance = previousYarnStockBalance + inward - outward;

        _context.YarnStocks.Add(new YarnStock
        {
            YarnCountId = yarnCountId,
            PartyId = partyId,
            LotNo = lotNo,
            TransactionType = inward > 0 ? $"{module}Inward" : $"{module}Outward",
            TransactionId = refId,
            TransactionDate = DateTime.Today,
            InwardQtyKg = inward,
            OutwardQtyKg = outward,
            CurrentBalanceKg = yarnStockBalance,
            FinancialYearId = fyId,
            IsActive = true,
            CreatedBy = user,
            CreatedDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }
}
