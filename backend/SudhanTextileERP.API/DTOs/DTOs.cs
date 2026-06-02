using System.Text.Json.Serialization;

namespace SudhanTextileERP.API.DTOs;

// ============================================
// COMMON DTOs
// ============================================
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Success")
    {
        return new ApiResponse<T> { Success = true, Message = message, Data = data };
    }

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
    {
        return new ApiResponse<T> { Success = false, Message = message, Errors = errors };
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;
}

public class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;
    
    public int PageNumber { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool SortDesc { get; set; }
}

// ============================================
// LOOM TYPE DTOs
// ============================================
public class LoomTypeDto
{
    public int Id { get; set; }
    public string LoomTypeCode { get; set; } = string.Empty;
    public string LoomTypeName { get; set; } = string.Empty;
    public decimal? WidthInches { get; set; }
    public bool IsActive { get; set; }
}

public class CreateLoomTypeRequest
{
    public string LoomTypeCode { get; set; } = string.Empty;
    public string LoomTypeName { get; set; } = string.Empty;
    public decimal? WidthInches { get; set; }
}

public class UpdateLoomTypeRequest : CreateLoomTypeRequest
{
    public bool IsActive { get; set; } = true;
}

// ============================================
// COMPANY DTOs
// ============================================
public class CompanyDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    [JsonPropertyName("gstin")]
    public string GSTIN { get; set; } = string.Empty;
    [JsonPropertyName("pan")]
    public string PAN { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BankBranch { get; set; }
    public string? BankAccountNo { get; set; }
    [JsonPropertyName("bankIfsc")]
    public string? BankIFSC { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCompanyRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    [JsonPropertyName("gstin")]
    public string GSTIN { get; set; } = string.Empty;
    [JsonPropertyName("pan")]
    public string PAN { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BankBranch { get; set; }
    public string? BankAccountNo { get; set; }
    [JsonPropertyName("bankIfsc")]
    public string? BankIFSC { get; set; }
}

public class UpdateCompanyRequest : CreateCompanyRequest
{
}

// ============================================
// AUTH DTOs
// ============================================
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime Expiry { get; set; }
    public UserDto User { get; set; } = null!;
    
    /// <summary>
    /// Indicates user must change password before accessing other features
    /// </summary>
    public bool RequiresPasswordChange { get; set; }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public List<string> Permissions { get; set; } = new();
    public List<ModulePermissionDto> ModulePermissions { get; set; } = new();
}

// ============================================
// MODULE & PERMISSION DTOs
// ============================================
public class ModuleDto
{
    public int Id { get; set; }
    public string ModuleKey { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string ParentModule { get; set; } = string.Empty;
    public string? RoutePath { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class ModulePermissionDto
{
    public string ModuleKey { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public string ParentModule { get; set; } = string.Empty;
    public string RoutePath { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<PermissionActionDto> Actions { get; set; } = new();
}

public class PermissionActionDto
{
    public int PermissionId { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsGranted { get; set; }
}

public class PermissionDto
{
    public int Id { get; set; }
    public string PermissionCode { get; set; } = string.Empty;
    public string PermissionName { get; set; } = string.Empty;
    public string ModuleKey { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty; // Alias for compatibility
    public string Action { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // Alias for Action
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsGranted { get; set; }
}

public class RoleWithPermissionsDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string RoleDescription { get; set; } = string.Empty;
    public bool IsSystemRole { get; set; }
    public bool IsActive { get; set; }
    public List<ModulePermissionDto> ModulePermissions { get; set; } = new();
}

public class UpdateRolePermissionsRequest
{
    public int RoleId { get; set; }
    public List<int> GrantedPermissionIds { get; set; } = new();
}

/// <summary>
/// DTO for grouping permissions by module (used in role permission management)
/// </summary>
public class PermissionModuleDto
{
    public string Module { get; set; } = string.Empty; // Parent module group (Masters, Sizing ERP, etc.)
    public string ModuleKey { get; set; } = string.Empty; // Individual module key
    public string ModuleName { get; set; } = string.Empty; // Display name
    public string RoutePath { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<PermissionDto> Permissions { get; set; } = new();
}

// ============================================
// PARTY DTOs
// ============================================
public class PartyDto
{
    public int Id { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string PartyType { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? ContactPerson { get; set; }
    [JsonPropertyName("gstin")]
    public string? GSTIN { get; set; }
    [JsonPropertyName("pan")]
    public string? PAN { get; set; }
    public int CreditDays { get; set; }
    public decimal CreditLimit { get; set; }
    public bool IsBillToBill { get; set; }
    public bool IsActive { get; set; }
}

public class CreatePartyRequest
{
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string PartyType { get; set; } = "Customer";
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? ContactPerson { get; set; }
    [JsonPropertyName("gstin")]
    public string? GSTIN { get; set; }
    [JsonPropertyName("pan")]
    public string? PAN { get; set; }
    public int CreditDays { get; set; }
    public decimal CreditLimit { get; set; }
    public bool IsBillToBill { get; set; }
}

public class UpdatePartyRequest : CreatePartyRequest
{
    public int Id { get; set; }
    public bool IsActive { get; set; } = true;
}

// ============================================
// YARN COUNT DTOs
// ============================================
public class YarnCountDto
{
    public int Id { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? CountDescription { get; set; }
    public int Ply { get; set; }
    public bool IsActive { get; set; }
}

public class CreateYarnCountRequest
{
    public string CountCode { get; set; } = string.Empty;
    public string? CountDescription { get; set; }
    public int Ply { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

// ============================================
// BEAM DTOs
// ============================================
public class BeamDto
{
    public int Id { get; set; }
    public string BeamNo { get; set; } = string.Empty;
    public string BeamType { get; set; } = string.Empty;
    public decimal TareWeight { get; set; }
    public decimal? WidthInches { get; set; }
    public int? MaxEnds { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? CurrentJobCardId { get; set; }
    public string? CurrentJobCardType { get; set; }
    public bool IsActive { get; set; }
}

public class CreateBeamRequest
{
    public string BeamNo { get; set; } = string.Empty;
    public string BeamType { get; set; } = "Sizing Beam";
    public decimal TareWeight { get; set; }
    public decimal? WidthInches { get; set; }
    public int? MaxEnds { get; set; }
}

// ============================================
// VEHICLE DTOs
// ============================================
public class VehicleDto
{
    public int Id { get; set; }
    public string VehicleNo { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? OwnerName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateVehicleRequest
{
    public string VehicleNo { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? OwnerName { get; set; }
}

// ============================================
// YARN RECEIPT DTOs
// ============================================
public class YarnReceiptDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public int? VehicleId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = "Draft";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public bool IsLocked { get; set; }
    public decimal TotalNetWeight { get; set; }
    public int TotalBags { get; set; }
    public List<YarnReceiptDetailDto> Details { get; set; } = new();
}

public class YarnReceiptDetailDto
{
    public int Id { get; set; }
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public string? BagNo { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
    public int? ConeCount { get; set; }
    public decimal RatePerKg { get; set; }
}

public class CreateYarnReceiptRequest
{
    public DateTime ReceiptDate { get; set; }
    public int PartyId { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? Remarks { get; set; }
    public List<CreateYarnReceiptDetailRequest> Details { get; set; } = new();
}

public class CreateYarnReceiptDetailRequest
{
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public string? BagNo { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public int? ConeCount { get; set; }
    public decimal RatePerKg { get; set; }
}

public class YarnReceiptListDto
{
    public int Id { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; }
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PdcNo { get; set; }
    public DateTime? PdcDate { get; set; }
    public string? MillName { get; set; }
    public string? VehicleNo { get; set; }
    public string? LotNo { get; set; }
    public string? YarnCount { get; set; }
    public int TotalBags { get; set; }
    public int TotalCones { get; set; }
    public decimal TotalNetWeight { get; set; }
    public string Status { get; set; } = "Draft";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public bool IsUsedInJobCard { get; set; }
    public bool IsLocked { get; set; }
}

// ============================================
// WARPING JOB CARD DTOs
// ============================================
public class WarpingJobCardDto
{
    public int Id { get; set; }
    public string JobCardNumber { get; set; } = string.Empty;
    public string SetNo { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public int TotalEnds { get; set; }
    public int EndsPerBeam { get; set; }
    public decimal SetLength { get; set; }
    public decimal? ActualLength { get; set; }
    public int NumberOfBeams { get; set; }
    public string? WarpingMachineNo { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? WarpingDate { get; set; }
    public string? Remarks { get; set; }
    public List<WarpingJobCardBeamDto> Beams { get; set; } = new();
}

public class WarpingJobCardBeamDto
{
    public int Id { get; set; }
    public int BeamId { get; set; }
    public string BeamNo { get; set; } = string.Empty;
    public int BeamSequence { get; set; }
    public DateTime? WarpingDate { get; set; }
    public int? EndsOnBeam { get; set; }
    public decimal? BeamWeight { get; set; }
}

public class WarpingJobCardListDto
{
    public int Id { get; set; }
    public string JobCardNo { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public DateTime? WarpingDate { get; set; }
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string YarnCount { get; set; } = string.Empty;
    public string? LoomType { get; set; }
    public string LotNo { get; set; } = string.Empty;
    public int TotalEnds { get; set; }
    public decimal TotalMeters { get; set; }
    public int BeamCount { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public string? PreparedBy { get; set; }
    public DateTime? PreparedAt { get; set; }
    public bool IsKarlMayer { get; set; }
}

public class CreateWarpingJobCardRequest
{
    public string SetNo { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int TotalEnds { get; set; }
    public int EndsPerBeam { get; set; }
    public decimal SetLength { get; set; }
    public int NumberOfBeams { get; set; }
    public string? WarpingMachineNo { get; set; }
    public string? Remarks { get; set; }
    public List<int> BeamIds { get; set; } = new();
}

// ============================================
// SIZING JOB CARD DTOs
// ============================================
public class SizingJobCardDto
{
    public int Id { get; set; }
    public string JobCardNumber { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public string SetNo { get; set; } = string.Empty;
    public int? LoomTypeId { get; set; }
    public string? LoomTypeName { get; set; }
    public int TotalEnds { get; set; }
    public decimal SetLength { get; set; }
    public decimal? ActualLength { get; set; }
    public decimal? BeamWidth { get; set; }
    public string? SizingMachineNo { get; set; }
    public string? SizeRecipe { get; set; }
    public int? OutputSizingBeamId { get; set; }
    public string? OutputBeamNo { get; set; }
    public decimal? OutputWeight { get; set; }
    public DateTime? SizingDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? PreparedBy { get; set; }
    public DateTime? PreparedDate { get; set; }
    public string? CheckedBy { get; set; }
    public DateTime? CheckedDate { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? AuthorizedBy { get; set; }
    public DateTime? AuthorizedDate { get; set; }
    public string? Remarks { get; set; }
    public List<SizingJobCardBeamDto> SourceBeams { get; set; } = new();
}

public class SizingJobCardBeamDto
{
    public int Id { get; set; }
    public int BeamId { get; set; }
    public string BeamNo { get; set; } = string.Empty;
    public int BeamSequence { get; set; }
    public int? EndsOnBeam { get; set; }
}

public class SizingJobCardListDto
{
    public int Id { get; set; }
    public string JobCardNo { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public DateTime? SizingDate { get; set; }
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string CountCode { get; set; } = string.Empty;
    public string SetNo { get; set; } = string.Empty;
    public string? LoomTypeName { get; set; }
    public int TotalEnds { get; set; }
    public decimal SetLength { get; set; }
    public decimal? ActualLength { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? InvoiceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public bool IsLocked { get; set; }
    public int BeamCount { get; set; }
}

public class CreateSizingJobCardRequest
{
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public string SetNo { get; set; } = string.Empty;
    public int? LoomTypeId { get; set; }
    public int TotalEnds { get; set; }
    public decimal SetLength { get; set; }
    public decimal? BeamWidth { get; set; }
    public string? SizingMachineNo { get; set; }
    public string? SizeRecipe { get; set; }
    public int? OutputSizingBeamId { get; set; }
    public string? Remarks { get; set; }
    public List<int> SourceBeamIds { get; set; } = new();
}

public class CompleteSizingJobCardRequest
{
    public decimal ActualLength { get; set; }
    public decimal? OutputWeight { get; set; }
    public DateTime SizingDate { get; set; }
}

public class ApproveJobCardRequest
{
    public string ApprovalLevel { get; set; } = string.Empty; // Prepare, Check, Approve, Authorize
    public string? Remarks { get; set; }
}

public class UpdateWarpingJobCardRequest
{
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int TotalEnds { get; set; }
    public int EndsPerBeam { get; set; }
    public decimal SetLength { get; set; }
    public int NumberOfBeams { get; set; }
    public string? WarpingMachineNo { get; set; }
    public string? Remarks { get; set; }
    public List<int> BeamIds { get; set; } = new();
}

public class UpdateSizingJobCardRequest
{
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int? LoomTypeId { get; set; }
    public int TotalEnds { get; set; }
    public decimal SetLength { get; set; }
    public decimal? BeamWidth { get; set; }
    public string? SizingMachineNo { get; set; }
    public string? SizeRecipe { get; set; }
    public int? OutputSizingBeamId { get; set; }
    public string? Remarks { get; set; }
    public List<int> SourceBeamIds { get; set; } = new();
}

public class ProductionSetDto
{
    public string SetId { get; set; } = string.Empty;
    public int PartyId { get; set; }
    public string Party { get; set; } = string.Empty;
    public string YarnCount { get; set; } = string.Empty;
    public string? LoomType { get; set; }
    public int TotalEnds { get; set; }
    public decimal SizingMeters { get; set; }
    public int Beams { get; set; }
}

// ============================================
// TAX INVOICE DTOs
// ============================================
public class TaxInvoiceDto
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    [JsonPropertyName("gstin")]
    public string? GSTIN { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public bool IsInterState { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal RoundOff { get; set; }
    public decimal GrandTotal { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public string? TransportMode { get; set; }
    public string? VehicleNo { get; set; }
    public string? EwayBillNo { get; set; }
    public string? IRNNumber { get; set; }
    public string? Remarks { get; set; }
    public bool IsLocked { get; set; }
    public bool IsPrinted { get; set; }
    public DateTime? PrintedAt { get; set; }
    public List<TaxInvoiceDetailDto> Details { get; set; } = new();
}

public class TaxInvoiceListDto
{
    public int Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PartyGSTIN { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public bool IsInterState { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTAmount { get; set; }
    public decimal TotalTaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsPaid { get; set; }
    public int DaysOverdue { get; set; }
}

public class TaxInvoiceDetailDto
{
    public int Id { get; set; }
    public int? SizingJobCardId { get; set; }
    public string? JobCardNumber { get; set; }
    public string Description { get; set; } = string.Empty;
    public string HSNCode { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string UOM { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
    public decimal CGSTRate { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTRate { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTRate { get; set; }
    public decimal IGSTAmount { get; set; }
}

public class CreateTaxInvoiceRequest
{
    public DateTime InvoiceDate { get; set; }
    public int PartyId { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public bool IsInterState { get; set; }
    public DateTime? DueDate { get; set; }
    public string? TransportMode { get; set; }
    public string? VehicleNo { get; set; }
    public string? EwayBillNo { get; set; }
    public string? Remarks { get; set; }
    public List<CreateTaxInvoiceDetailRequest> Details { get; set; } = new();
}

public class CreateTaxInvoiceDetailRequest
{
    public int? SizingJobCardId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string HSNCode { get; set; } = "998821"; // Default HSN for sizing services
    public decimal Quantity { get; set; }
    public string UOM { get; set; } = "MTR";
    public decimal Rate { get; set; }
    public decimal CGSTRate { get; set; } = 9; // Default 9%
    public decimal SGSTRate { get; set; } = 9; // Default 9%
    public decimal IGSTRate { get; set; } = 18; // Default 18%
}

public class UpdateTaxInvoiceRequest
{
    public string? PlaceOfSupply { get; set; }
    public DateTime? DueDate { get; set; }
    public string? TransportMode { get; set; }
    public string? VehicleNo { get; set; }
    public string? EwayBillNo { get; set; }
    public string? Remarks { get; set; }
}

// ============================================
// DASHBOARD DTOs
// ============================================
public class DashboardStatsDto
{
    public int TodayYarnReceipts { get; set; }
    public decimal TodayYarnReceiptKg { get; set; }
    public int TodaySizingCards { get; set; }
    public decimal TodaySizingMeters { get; set; }
    public int PendingApprovals { get; set; }
    public int PendingForInvoice { get; set; }
    public int MonthYarnReceipts { get; set; }
    public decimal MonthSizingMeters { get; set; }
    public decimal MonthInvoiceValue { get; set; }
    public int AvailableSizingBeams { get; set; }
    public int AvailableWarpingBeams { get; set; }
}

/// <summary>
/// Executive Dashboard DTO with comprehensive KPIs for management view
/// </summary>
public class ExecutiveDashboardDto
{
    // Primary KPIs (large cards)
    public int ActiveSets { get; set; }
    public decimal TodayProduction { get; set; }
    public decimal TotalYarnStock { get; set; }
    public int PendingInvoices { get; set; }

    // Secondary KPIs (smaller cards)
    public int TodayReceipts { get; set; }
    public int ActiveParties { get; set; }
    public int PendingDeliveries { get; set; }
    public decimal AvgSetTime { get; set; }
    public decimal TodayInvoiceValue { get; set; }
    public decimal MTDInvoiceValue { get; set; }
    public decimal MonthlyProduction { get; set; }
    public decimal Efficiency { get; set; }

    // Beam Summary
    public BeamSummaryDto BeamSummary { get; set; } = new();

    // Pending Approvals
    public List<PendingApprovalDto> PendingApprovals { get; set; } = new();

    // Recent Sizing Sets
    public List<RecentSizingSetDto> RecentSizingSets { get; set; } = new();

    // Low Stock Items
    public List<LowStockItemDto> LowStockItems { get; set; } = new();
}

public class BeamSummaryDto
{
    public int Total { get; set; }
    public int Available { get; set; }
    public int InUse { get; set; }
    public int Maintenance { get; set; }
}

public class PendingApprovalDto
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Urgent { get; set; }
}

public class RecentSizingSetDto
{
    public string SetNo { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Party { get; set; } = string.Empty;
    public string Count { get; set; } = string.Empty;
    public decimal Meters { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class LowStockItemDto
{
    public string Count { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public decimal Balance { get; set; }
    public decimal MinStock { get; set; }
}

public class YarnStockDto
{
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public decimal TotalInward { get; set; }
    public decimal TotalOutward { get; set; }
    public decimal BalanceQtyKg { get; set; }
}

// ============================================
// BABY CONE DTOs
// ============================================
public class BabyConeDto
{
    public int Id { get; set; }
    public string BabyConeNo { get; set; } = string.Empty;
    public DateTime BabyConeDate { get; set; }
    public int YarnReceiptId { get; set; }
    public string YarnReceiptNo { get; set; } = string.Empty;
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public int BagNo { get; set; }
    public int TotalCones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
    public decimal WindingLoss { get; set; }
    public decimal LeftoverWeight { get; set; }
    public bool IsUsedInWarping { get; set; }
    public string? Remarks { get; set; }
}

public class BabyConeListDto
{
    public int Id { get; set; }
    public string BabyConeNo { get; set; } = string.Empty;
    public DateTime BabyConeDate { get; set; }
    public string YarnReceiptNo { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public int BagNo { get; set; }
    public int TotalCones { get; set; }
    public decimal NetWeight { get; set; }
    public decimal WindingLoss { get; set; }
    public bool IsUsedInWarping { get; set; }
}

public class BabyConeSummaryDto
{
    public int TotalBabyCones { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal AvailableForWarping { get; set; }
}

public class CreateBabyConeRequest
{
    public DateTime BabyConeDate { get; set; }
    public int YarnReceiptDetailId { get; set; }
    public string? LotNo { get; set; }
    public int BagNo { get; set; }
    public int TotalCones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal WindingLoss { get; set; }
    public decimal LeftoverWeight { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateBabyConeRequest
{
    public decimal WindingLoss { get; set; }
    public decimal LeftoverWeight { get; set; }
    public string? Remarks { get; set; }
}

// ============================================
// YARN RETURN DTOs
// ============================================
public class YarnReturnDto
{
    public int Id { get; set; }
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string ReturnType { get; set; } = string.Empty;
    public int? SizingJobCardId { get; set; }
    public string? SizingJobCardNo { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public decimal TotalWeight { get; set; }
    public bool IsNotForSale { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? Remarks { get; set; }
    public List<YarnReturnDetailDto> Details { get; set; } = new();
}

public class YarnReturnListDto
{
    public int Id { get; set; }
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string ReturnType { get; set; } = string.Empty;
    public string? SizingJobCardNo { get; set; }
    public decimal TotalWeight { get; set; }
    public int TotalBags { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsNotForSale { get; set; }
}

public class YarnReturnDetailDto
{
    public int Id { get; set; }
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
}

public class CreateYarnReturnRequest
{
    public DateTime DCDate { get; set; }
    public int PartyId { get; set; }
    public string ReturnType { get; set; } = "Jobwork";
    public int? SizingJobCardId { get; set; }
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? Remarks { get; set; }
    public List<CreateYarnReturnDetailRequest> Details { get; set; } = new();
}

public class CreateYarnReturnDetailRequest
{
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
}

public class UpdateYarnReturnRequest
{
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? Remarks { get; set; }
    public List<CreateYarnReturnDetailRequest> Details { get; set; } = new();
}

// ============================================
// YARN DELIVERY DTOs
// ============================================
public class YarnDeliveryDto
{
    public int Id { get; set; }
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public int PartyId { get; set; }
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public int? VehicleId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? DispatchedBy { get; set; }
    public DateTime? DispatchedDate { get; set; }
    public string? Remarks { get; set; }
    public List<YarnDeliveryDetailDto> Details { get; set; } = new();
}

public class YarnDeliveryListDto
{
    public int Id { get; set; }
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public decimal TotalWeight { get; set; }
    public decimal TotalAmount { get; set; }
    public int TotalBags { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DispatchedBy { get; set; }
    public DateTime? DispatchedDate { get; set; }
}

public class YarnDeliveryDetailDto
{
    public int Id { get; set; }
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
    public decimal RatePerKg { get; set; }
    public decimal Amount { get; set; }
}

public class CreateYarnDeliveryRequest
{
    public DateTime DCDate { get; set; }
    public int PartyId { get; set; }
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? Remarks { get; set; }
    public List<CreateYarnDeliveryDetailRequest> Details { get; set; } = new();
}

public class CreateYarnDeliveryDetailRequest
{
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal RatePerKg { get; set; }
}

public class UpdateYarnDeliveryRequest
{
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? Remarks { get; set; }
    public List<CreateYarnDeliveryDetailRequest> Details { get; set; } = new();
}

// ============================================
// REPORT DTOs
// ============================================
public class YarnStockRegisterDto
{
    public int YarnCountId { get; set; }
    public string CountCode { get; set; } = string.Empty;
    public string CountDescription { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public decimal TotalInWeight { get; set; }
    public decimal TotalOutWeight { get; set; }
    public decimal BalanceWeight { get; set; }
    public int TotalInQty { get; set; }
    public int TotalOutQty { get; set; }
    public int BalanceQty { get; set; }
}

public class SizingJobCardReportDto
{
    public int Id { get; set; }
    public string SetNo { get; set; } = string.Empty;
    public DateTime SetDate { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string YarnCount { get; set; } = string.Empty;
    public string LoomType { get; set; } = string.Empty;
    public int TotalEnds { get; set; }
    public decimal WarpingMeters { get; set; }
    public decimal SizingMeters { get; set; }
    public decimal PickupPercent { get; set; }
    public decimal ElongationPercent { get; set; }
    public int BeamCount { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
}

public class BeamUtilizationReportDto
{
    public int BeamId { get; set; }
    public string BeamNo { get; set; } = string.Empty;
    public string BeamType { get; set; } = string.Empty;
    public decimal TareWeight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CurrentLocation { get; set; }
    public int TotalSizingUsage { get; set; }
    public int TotalWarpingUsage { get; set; }
    public DateTime? LastUsedDate { get; set; }
    public string? LastUsedInSet { get; set; }
}

public class InvoiceRegisterReportDto
{
    public int Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PartyGSTIN { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public bool IsInterState { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTAmount { get; set; }
    public decimal TotalTaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPaid { get; set; }
    public int DaysOverdue { get; set; }
}

// ============================================
// SETTINGS & SECURITY DTOs
// ============================================

// User Management DTOs
public class UserListDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public string? Department { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public string? LastLoginIp { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public string? Department { get; set; }
    public string? DefaultLocation { get; set; }
    public int RoleId { get; set; }
}

public class UpdateUserRequest
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public string? Department { get; set; }
    public string? DefaultLocation { get; set; }
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
}

public class LockUserRequest
{
    public int UserId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public int UserId { get; set; }
    public string NewPassword { get; set; } = string.Empty;
    public bool ForceChangeOnLogin { get; set; } = true;
}

// Role & Permission DTOs
public class RoleDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public bool IsSystemRole { get; set; }
    public int UserCount { get; set; }
    public bool IsActive { get; set; }
    public List<PermissionDto> Permissions { get; set; } = new();
}

public class CreateRoleRequest
{
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public List<int> PermissionIds { get; set; } = new();
}

public class UpdateRoleRequest
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public List<int> PermissionIds { get; set; } = new();
}

// Extended User DTOs for User Management
public class UserDetailDto : UserListDto
{
    public string? DefaultLocation { get; set; }
    public string? LockReason { get; set; }
    public DateTime? LockedAt { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? PasswordExpiresAt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<string> PermissionCodes { get; set; } = new();
}

// Extended Role DTOs for Role Management  
public class RoleListDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleDescription { get; set; }
    public bool IsSystemRole { get; set; }
    public int UserCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RoleDetailDto : RoleListDto
{
    public int SortOrder { get; set; }
    public List<string> PermissionCodes { get; set; } = new();
    public List<PermissionDto> Permissions { get; set; } = new();
    public DateTime? UpdatedAt { get; set; }
}

// Approval Matrix DTOs
public class ApprovalMatrixDto
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentDisplayName { get; set; } = string.Empty;
    public int ApprovalLevel { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public int RequiredRoleId { get; set; }
    public string RequiredRoleName { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public decimal? AutoApprovalThreshold { get; set; }
}

public class SaveApprovalMatrixRequest
{
    public string DocumentType { get; set; } = string.Empty;
    public List<ApprovalLevelRequest> Levels { get; set; } = new();
}

public class ApprovalLevelRequest
{
    public int ApprovalLevel { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public int RequiredRoleId { get; set; }
    public bool IsRequired { get; set; }
    public decimal? AutoApprovalThreshold { get; set; }
}

public class ApprovalHistoryDto
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public int DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public int ApprovalLevel { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ApprovedByName { get; set; } = string.Empty;
    public DateTime ApprovalDate { get; set; }
    public string? Comments { get; set; }
}

// Financial Year DTOs
public class FinancialYearDto
{
    public int Id { get; set; }
    public string YearCode { get; set; } = string.Empty;
    public string YearName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsClosed { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ClosedByName { get; set; }
    public bool IsActive { get; set; }
    public int DocumentCount { get; set; }
}

public class CreateFinancialYearRequest
{
    public string YearCode { get; set; } = string.Empty;
    public string YearName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class CloseFinancialYearRequest
{
    public int YearId { get; set; }
    public string? Remarks { get; set; }
    public bool ConfirmPendingDocuments { get; set; }
}

// Document Number Settings DTOs
public class DocumentNumberSettingDto
{
    public int Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int FinancialYearId { get; set; }
    public string FinancialYearName { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public int CurrentNumber { get; set; }
    public int PadLength { get; set; }
    public bool ResetOnFYChange { get; set; }
    public bool AllowManualOverride { get; set; }
    public bool LockAfterPrint { get; set; }
    public bool LockAfterApproval { get; set; }
    public string SampleNumber { get; set; } = string.Empty;
}

public class UpdateDocumentNumberSettingRequest
{
    public int Id { get; set; }
    public string Prefix { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public int PadLength { get; set; }
    public bool ResetOnFYChange { get; set; }
    public bool AllowManualOverride { get; set; }
    public bool LockAfterPrint { get; set; }
    public bool LockAfterApproval { get; set; }
}

// System Configuration DTOs
public class SystemConfigDto
{
    public int Id { get; set; }
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public string ConfigType { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsEditable { get; set; }
}

public class UpdateSystemConfigRequest
{
    public int Id { get; set; }
    public string ConfigValue { get; set; } = string.Empty;
}

public class SystemConfigCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public List<SystemConfigDto> Configs { get; set; } = new();
}

// Security Policy DTOs
public class SecurityPolicyDto
{
    public int Id { get; set; }
    public string PolicyKey { get; set; } = string.Empty;
    public string PolicyValue { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateSecurityPolicyRequest
{
    public int Id { get; set; }
    public string PolicyValue { get; set; } = string.Empty;
}

// Backup Configuration DTOs
public class BackupConfigDto
{
    public int Id { get; set; }
    public string BackupType { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int RetentionDays { get; set; }
    public string BackupPath { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public DateTime? LastBackupTime { get; set; }
    public string? LastBackupStatus { get; set; }
    public string? LastBackupSize { get; set; }
    public DateTime? NextScheduledBackup { get; set; }
}

public class UpdateBackupConfigRequest
{
    public int Id { get; set; }
    public string BackupType { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int RetentionDays { get; set; }
    public string BackupPath { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
}

// Notification Settings DTOs
public class NotificationSettingDto
{
    public int Id { get; set; }
    public string NotificationType { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public int? ThresholdValue { get; set; }
    public List<int> RecipientRoleIds { get; set; } = new();
}

public class UpdateNotificationSettingRequest
{
    public int Id { get; set; }
    public bool IsEnabled { get; set; }
    public int? ThresholdValue { get; set; }
    public List<int> RecipientRoleIds { get; set; } = new();
}

// Audit Log DTOs
public class AuditLogDto
{
    public long Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public class AuditLogFilterRequest
{
    public string? TableName { get; set; }
    public string? Action { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

// User Session DTOs
public class UserSessionDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DeviceInfo { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public bool IsActive { get; set; }
}

// Real-time Notification DTOs
public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // approval, invoice, stock, document, system
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Priority { get; set; } = "normal"; // low, normal, high, urgent
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class NotificationListResponse
{
    public List<NotificationDto> Notifications { get; set; } = new();
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

public class CreateNotificationRequest
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Priority { get; set; } = "normal";
    public string? Link { get; set; }
    public int? UserId { get; set; }
    public int? RoleId { get; set; }
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
}
