using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Party> Parties => Set<Party>();
    public DbSet<FinancialYear> FinancialYears => Set<FinancialYear>();
    public DbSet<YarnCount> YarnCounts => Set<YarnCount>();
    public DbSet<LoomType> LoomTypes => Set<LoomType>();
    public DbSet<Beam> Beams => Set<Beam>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<DocumentNumberSeries> DocumentNumberSeries => Set<DocumentNumberSeries>();
    public DbSet<YarnReceipt> YarnReceipts => Set<YarnReceipt>();
    public DbSet<YarnReceiptDetail> YarnReceiptDetails => Set<YarnReceiptDetail>();
    public DbSet<WarpingJobCard> WarpingJobCards => Set<WarpingJobCard>();
    public DbSet<WarpingJobCardBeam> WarpingJobCardBeams => Set<WarpingJobCardBeam>();
    public DbSet<SizingJobCard> SizingJobCards => Set<SizingJobCard>();
    public DbSet<SizingJobCardBeam> SizingJobCardBeams => Set<SizingJobCardBeam>();
    public DbSet<TaxInvoice> TaxInvoices => Set<TaxInvoice>();
    public DbSet<TaxInvoiceDetail> TaxInvoiceDetails => Set<TaxInvoiceDetail>();
    public DbSet<YarnStock> YarnStocks => Set<YarnStock>();
    public DbSet<BabyCone> BabyCones => Set<BabyCone>();
    public DbSet<YarnReturn> YarnReturns => Set<YarnReturn>();
    public DbSet<YarnReturnDetail> YarnReturnDetails => Set<YarnReturnDetail>();
    public DbSet<YarnDelivery> YarnDeliveries => Set<YarnDelivery>();
    public DbSet<YarnDeliveryDetail> YarnDeliveryDetails => Set<YarnDeliveryDetail>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<StockLedger> StockLedgers => Set<StockLedger>();
    
    // Settings & Security entities
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<ApprovalMatrix> ApprovalMatrix => Set<ApprovalMatrix>();
    public DbSet<ApprovalHistory> ApprovalHistories => Set<ApprovalHistory>();
    public DbSet<SystemConfiguration> SystemConfigurations => Set<SystemConfiguration>();
    public DbSet<SecurityPolicy> SecurityPolicies => Set<SecurityPolicy>();
    public DbSet<BackupConfiguration> BackupConfigurations => Set<BackupConfiguration>();
    public DbSet<NotificationSetting> NotificationSettings => Set<NotificationSetting>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    
    // Phase-2: Security Audit Logs
    public DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Module
        modelBuilder.Entity<Module>(entity =>
        {
            entity.HasIndex(e => e.ModuleKey).IsUnique();
            entity.Property(e => e.ModuleKey).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ModuleName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ParentModule).HasMaxLength(50).IsRequired();
            entity.Property(e => e.RoutePath).HasMaxLength(200);
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
        });
        
        // Permission
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasIndex(e => e.PermissionCode).IsUnique();
            entity.Property(e => e.PermissionCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PermissionName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ModuleKey).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            
            entity.HasOne(e => e.Module)
                .WithMany(m => m.Permissions)
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // RolePermission
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasIndex(e => new { e.RoleId, e.PermissionId }).IsUnique();
            
            entity.HasOne(e => e.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.RoleName).IsUnique();
            entity.Property(e => e.RoleName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Permissions).HasMaxLength(2000);
        });

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();

            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Company
        modelBuilder.Entity<Company>(entity =>
        {
            entity.Property(e => e.CompanyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.ShortName).HasMaxLength(20).IsRequired();
            entity.Property(e => e.GSTIN).HasMaxLength(15);
            entity.Property(e => e.PAN).HasMaxLength(10);
            entity.Property(e => e.StateCode).HasMaxLength(2);
        });

        // Party
        modelBuilder.Entity<Party>(entity =>
        {
            entity.HasIndex(e => e.PartyCode).IsUnique();
            entity.Property(e => e.PartyCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.PartyName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PartyType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.GSTIN).HasMaxLength(15);
            entity.Property(e => e.PAN).HasMaxLength(10);
            entity.Property(e => e.StateCode).HasMaxLength(2);
            entity.Property(e => e.CreditLimit).HasPrecision(18, 2);
            entity.Property(e => e.OpeningBalance).HasPrecision(18, 2);
        });

        // Financial Year
        modelBuilder.Entity<FinancialYear>(entity =>
        {
            entity.HasIndex(e => e.YearCode).IsUnique();
            entity.Property(e => e.YearCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.YearName).HasMaxLength(50).IsRequired();
        });

        // Yarn Count
        modelBuilder.Entity<YarnCount>(entity =>
        {
            entity.HasIndex(e => e.CountCode).IsUnique();
            entity.Property(e => e.CountCode).HasMaxLength(30).IsRequired();
            entity.Property(e => e.CountDescription).HasMaxLength(100);
        });

        // Loom Type
        modelBuilder.Entity<LoomType>(entity =>
        {
            entity.HasIndex(e => e.LoomTypeCode).IsUnique();
            entity.Property(e => e.LoomTypeCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.LoomTypeName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.WidthInches).HasPrecision(10, 2);
        });

        // Beam
        modelBuilder.Entity<Beam>(entity =>
        {
            entity.HasIndex(e => e.BeamNo).IsUnique();
            entity.Property(e => e.BeamNo).HasMaxLength(20).IsRequired();
            entity.Property(e => e.BeamType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.TareWeight).HasPrecision(18, 3).IsRequired();
            entity.Property(e => e.WidthInches).HasPrecision(10, 2);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
        });

        // Vehicle
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(e => e.VehicleNo).IsUnique();
            entity.Property(e => e.VehicleNo).HasMaxLength(20).IsRequired();
            entity.Property(e => e.VehicleType).HasMaxLength(50);
            entity.Property(e => e.DriverName).HasMaxLength(100);
            entity.Property(e => e.DriverPhone).HasMaxLength(15);
        });

        // Document Number Series
        modelBuilder.Entity<DocumentNumberSeries>(entity =>
        {
            entity.HasIndex(e => new { e.DocumentType, e.FinancialYearId }).IsUnique();
            entity.Property(e => e.DocumentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Prefix).HasMaxLength(20).IsRequired();

            entity.HasOne(e => e.FinancialYear)
                .WithMany(fy => fy.DocumentNumberSeries)
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Yarn Receipt
        modelBuilder.Entity<YarnReceipt>(entity =>
        {
            entity.HasIndex(e => e.ReceiptNumber).IsUnique();
            entity.Property(e => e.ReceiptNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.VehicleNo).HasMaxLength(20);
            entity.Property(e => e.DriverName).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.Party)
                .WithMany(p => p.YarnReceipts)
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.YarnReceipts)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.FinancialYear)
                .WithMany(fy => fy.YarnReceipts)
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Yarn Receipt Detail
        modelBuilder.Entity<YarnReceiptDetail>(entity =>
        {
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.BagNo).HasMaxLength(20);
            entity.Property(e => e.GrossWeight).HasPrecision(18, 3);
            entity.Property(e => e.TareWeight).HasPrecision(18, 3);
            entity.Property(e => e.NetWeight).HasPrecision(18, 3);
            entity.Property(e => e.RatePerKg).HasPrecision(18, 2);

            entity.HasOne(e => e.YarnReceipt)
                .WithMany(yr => yr.Details)
                .HasForeignKey(e => e.YarnReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.YarnCount)
                .WithMany(yc => yc.YarnReceiptDetails)
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Warping Job Card
        modelBuilder.Entity<WarpingJobCard>(entity =>
        {
            entity.HasIndex(e => e.JobCardNumber).IsUnique();
            entity.Property(e => e.JobCardNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.SetNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.SetLength).HasPrecision(18, 2);
            entity.Property(e => e.ActualLength).HasPrecision(18, 2);
            entity.Property(e => e.WarpingMachineNo).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        // Warping Job Card Beam
        modelBuilder.Entity<WarpingJobCardBeam>(entity =>
        {
            entity.Property(e => e.BeamWeight).HasPrecision(18, 3);

            entity.HasOne(e => e.WarpingJobCard)
                .WithMany(wj => wj.Beams)
                .HasForeignKey(e => e.WarpingJobCardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Beam)
                .WithMany(b => b.WarpingJobCardBeams)
                .HasForeignKey(e => e.BeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Sizing Job Card
        modelBuilder.Entity<SizingJobCard>(entity =>
        {
            entity.HasIndex(e => e.JobCardNumber).IsUnique();
            entity.Property(e => e.JobCardNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.SetNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.SetLength).HasPrecision(18, 2);
            entity.Property(e => e.ActualLength).HasPrecision(18, 2);
            entity.Property(e => e.BeamWidth).HasPrecision(10, 2);
            entity.Property(e => e.SizingMachineNo).HasMaxLength(20);
            entity.Property(e => e.SizeRecipe).HasMaxLength(500);
            entity.Property(e => e.OutputWeight).HasPrecision(18, 3);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.Party)
                .WithMany(p => p.SizingJobCards)
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YarnCount)
                .WithMany(yc => yc.SizingJobCards)
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.LoomType)
                .WithMany(lt => lt.SizingJobCards)
                .HasForeignKey(e => e.LoomTypeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.FinancialYear)
                .WithMany(fy => fy.SizingJobCards)
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Invoice)
                .WithMany(i => i.SizingJobCards)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Sizing Job Card Beam
        modelBuilder.Entity<SizingJobCardBeam>(entity =>
        {
            entity.HasOne(e => e.SizingJobCard)
                .WithMany(sj => sj.SourceBeams)
                .HasForeignKey(e => e.SizingJobCardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Beam)
                .WithMany(b => b.SizingJobCardBeams)
                .HasForeignKey(e => e.BeamId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tax Invoice
        modelBuilder.Entity<TaxInvoice>(entity =>
        {
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.Property(e => e.InvoiceNumber).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PlaceOfSupply).HasMaxLength(100);
            entity.Property(e => e.TaxableAmount).HasPrecision(18, 2);
            entity.Property(e => e.CGSTAmount).HasPrecision(18, 2);
            entity.Property(e => e.SGSTAmount).HasPrecision(18, 2);
            entity.Property(e => e.IGSTAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.RoundOff).HasPrecision(18, 2);
            entity.Property(e => e.GrandTotal).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.TransportMode).HasMaxLength(50);
            entity.Property(e => e.VehicleNo).HasMaxLength(20);
            entity.Property(e => e.EwayBillNo).HasMaxLength(50);
            entity.Property(e => e.IRNNumber).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.Party)
                .WithMany(p => p.TaxInvoices)
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinancialYear)
                .WithMany(fy => fy.TaxInvoices)
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Tax Invoice Detail
        modelBuilder.Entity<TaxInvoiceDetail>(entity =>
        {
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
            entity.Property(e => e.HSNCode).HasMaxLength(8);
            entity.Property(e => e.Quantity).HasPrecision(18, 3);
            entity.Property(e => e.UOM).HasMaxLength(20);
            entity.Property(e => e.Rate).HasPrecision(18, 2);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.CGSTRate).HasPrecision(5, 2);
            entity.Property(e => e.CGSTAmount).HasPrecision(18, 2);
            entity.Property(e => e.SGSTRate).HasPrecision(5, 2);
            entity.Property(e => e.SGSTAmount).HasPrecision(18, 2);
            entity.Property(e => e.IGSTRate).HasPrecision(5, 2);
            entity.Property(e => e.IGSTAmount).HasPrecision(18, 2);

            entity.HasOne(e => e.TaxInvoice)
                .WithMany(i => i.Details)
                .HasForeignKey(e => e.TaxInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Yarn Stock
        modelBuilder.Entity<YarnStock>(entity =>
        {
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.TransactionType).HasMaxLength(50);
            entity.Property(e => e.InwardQtyKg).HasPrecision(18, 3);
            entity.Property(e => e.OutwardQtyKg).HasPrecision(18, 3);
            entity.Property(e => e.CurrentBalanceKg).HasPrecision(18, 3);

            entity.HasOne(e => e.YarnCount)
                .WithMany()
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Party)
                .WithMany()
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Baby Cone
        modelBuilder.Entity<BabyCone>(entity =>
        {
            entity.HasIndex(e => e.BabyConeNo).IsUnique();
            entity.Property(e => e.BabyConeNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.GrossWeight).HasPrecision(18, 3);
            entity.Property(e => e.TareWeight).HasPrecision(18, 3);
            entity.Property(e => e.NetWeight).HasPrecision(18, 3);
            entity.Property(e => e.WindingLoss).HasPrecision(18, 3);
            entity.Property(e => e.LeftoverWeight).HasPrecision(18, 3);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YarnReceipt)
                .WithMany()
                .HasForeignKey(e => e.YarnReceiptId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YarnReceiptDetail)
                .WithMany()
                .HasForeignKey(e => e.YarnReceiptDetailId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.YarnCount)
                .WithMany()
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Yarn Return
        modelBuilder.Entity<YarnReturn>(entity =>
        {
            entity.HasIndex(e => e.DCNo).IsUnique();
            entity.Property(e => e.DCNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReturnType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.DriverName).HasMaxLength(100);
            entity.Property(e => e.TotalWeight).HasPrecision(18, 3);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.ApprovedBy).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Party)
                .WithMany()
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SizingJobCard)
                .WithMany()
                .HasForeignKey(e => e.SizingJobCardId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Yarn Return Detail
        modelBuilder.Entity<YarnReturnDetail>(entity =>
        {
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.GrossWeight).HasPrecision(18, 3);
            entity.Property(e => e.TareWeight).HasPrecision(18, 3);
            entity.Property(e => e.NetWeight).HasPrecision(18, 3);

            entity.HasOne(e => e.YarnReturn)
                .WithMany(yr => yr.Details)
                .HasForeignKey(e => e.YarnReturnId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.YarnCount)
                .WithMany()
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Yarn Delivery
        modelBuilder.Entity<YarnDelivery>(entity =>
        {
            entity.HasIndex(e => e.DCNo).IsUnique();
            entity.Property(e => e.DCNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DriverName).HasMaxLength(100);
            entity.Property(e => e.DriverPhone).HasMaxLength(15);
            entity.Property(e => e.TotalWeight).HasPrecision(18, 3);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.ApprovedBy).HasMaxLength(100);
            entity.Property(e => e.DispatchedBy).HasMaxLength(100);
            entity.Property(e => e.ReceiverSignature).HasMaxLength(500);
            entity.Property(e => e.Remarks).HasMaxLength(500);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Party)
                .WithMany()
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Vehicle)
                .WithMany()
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Yarn Delivery Detail
        modelBuilder.Entity<YarnDeliveryDetail>(entity =>
        {
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.GrossWeight).HasPrecision(18, 3);
            entity.Property(e => e.TareWeight).HasPrecision(18, 3);
            entity.Property(e => e.NetWeight).HasPrecision(18, 3);
            entity.Property(e => e.RatePerKg).HasPrecision(18, 2);
            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity.HasOne(e => e.YarnDelivery)
                .WithMany(yd => yd.Details)
                .HasForeignKey(e => e.YarnDeliveryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.YarnCount)
                .WithMany()
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Audit Log
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.TableName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ChangedBy).HasMaxLength(100).IsRequired();
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.HasIndex(e => e.TableName);
            entity.HasIndex(e => e.RecordId);
            entity.HasIndex(e => e.ChangedAt);
        });

        // Stock Ledger - Single source of truth for all stock movements
        modelBuilder.Entity<StockLedger>(entity =>
        {
            entity.Property(e => e.Module).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReferenceNo).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LotNo).HasMaxLength(50);
            entity.Property(e => e.InwardQty).HasPrecision(18, 3);
            entity.Property(e => e.OutwardQty).HasPrecision(18, 3);
            entity.Property(e => e.BalanceQty).HasPrecision(18, 3);
            entity.Property(e => e.RatePerUnit).HasPrecision(18, 2);
            entity.Property(e => e.TransactionValue).HasPrecision(18, 2);
            entity.Property(e => e.TransactionType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Narration).HasMaxLength(500);
            
            entity.HasIndex(e => new { e.YarnCountId, e.PartyId, e.LotNo });
            entity.HasIndex(e => e.TransactionDate);
            entity.HasIndex(e => new { e.Module, e.ReferenceId });

            entity.HasOne(e => e.YarnCount)
                .WithMany()
                .HasForeignKey(e => e.YarnCountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Party)
                .WithMany()
                .HasForeignKey(e => e.PartyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.FinancialYear)
                .WithMany()
                .HasForeignKey(e => e.FinancialYearId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Permission
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasIndex(e => e.PermissionCode).IsUnique();
            entity.Property(e => e.PermissionCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PermissionName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.ModuleKey).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(50).IsRequired();
            entity.HasOne(e => e.Module)
                .WithMany(m => m.Permissions)
                .HasForeignKey(e => e.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Role Permission
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasIndex(e => new { e.RoleId, e.PermissionId }).IsUnique();
            entity.HasOne(e => e.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(e => e.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Approval Matrix
        modelBuilder.Entity<ApprovalMatrix>(entity =>
        {
            entity.HasIndex(e => new { e.DocumentType, e.ApprovalLevel }).IsUnique();
            entity.Property(e => e.DocumentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LevelName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.AutoApprovalThreshold).HasPrecision(18, 2);
            entity.HasOne(e => e.RequiredRole)
                .WithMany(r => r.ApprovalMatrixEntries)
                .HasForeignKey(e => e.RequiredRoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Approval History
        modelBuilder.Entity<ApprovalHistory>(entity =>
        {
            entity.Property(e => e.DocumentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.LevelName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Comments).HasMaxLength(500);
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.HasIndex(e => new { e.DocumentType, e.DocumentId });
            entity.HasOne(e => e.ApprovedByUser)
                .WithMany(u => u.ApprovalHistories)
                .HasForeignKey(e => e.ApprovedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // System Configuration
        modelBuilder.Entity<SystemConfiguration>(entity =>
        {
            entity.HasIndex(e => e.ConfigKey).IsUnique();
            entity.Property(e => e.ConfigKey).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ConfigValue).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.ConfigType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200).IsRequired();
        });

        // Security Policy
        modelBuilder.Entity<SecurityPolicy>(entity =>
        {
            entity.HasIndex(e => e.PolicyKey).IsUnique();
            entity.Property(e => e.PolicyKey).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PolicyValue).HasMaxLength(500).IsRequired();
            entity.Property(e => e.PolicyType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200).IsRequired();
        });

        // Backup Configuration
        modelBuilder.Entity<BackupConfiguration>(entity =>
        {
            entity.Property(e => e.BackupType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Frequency).HasMaxLength(50).IsRequired();
            entity.Property(e => e.BackupPath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.LastBackupStatus).HasMaxLength(50);
            entity.Property(e => e.LastBackupSize).HasMaxLength(50);
        });

        // Notification Setting
        modelBuilder.Entity<NotificationSetting>(entity =>
        {
            entity.HasIndex(e => new { e.NotificationType, e.EventType }).IsUnique();
            entity.Property(e => e.NotificationType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.RecipientRoles).HasMaxLength(500);
        });

        // Notification (Real-time user notifications)
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Message).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Priority).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Link).HasMaxLength(500);
            entity.Property(e => e.ReferenceType).HasMaxLength(100);
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedDate });
            entity.HasIndex(e => e.RoleId);
            entity.HasIndex(e => e.CreatedDate);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.TargetRole)
                .WithMany()
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // User Session
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.Property(e => e.SessionToken).HasMaxLength(500).IsRequired();
            entity.Property(e => e.IpAddress).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.DeviceInfo).HasMaxLength(200);
            entity.HasIndex(e => e.SessionToken);
            entity.HasIndex(e => new { e.UserId, e.IsActive });
            entity.HasOne(e => e.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateAuditFields();
        return base.SaveChanges();
    }

    private void UpdateAuditFields()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedDate = DateTime.UtcNow;
            }
        }
    }
}
