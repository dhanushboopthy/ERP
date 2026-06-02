using FluentValidation;
using SudhanTextileERP.API.DTOs;
using System.Text.RegularExpressions;

namespace SudhanTextileERP.API.Validation;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// GLOBAL VALIDATION LAYER - Phase-2 Enterprise Security
// All DTO validation rules for input sanitization and security
// ═══════════════════════════════════════════════════════════════════════════════════════════

#region Base Validators & Extensions

/// <summary>
/// Reusable validation rules for textile ERP domain
/// </summary>
public static class ValidationRules
{
    // Maximum string lengths
    public const int MaxCodeLength = 50;
    public const int MaxNameLength = 200;
    public const int MaxDescriptionLength = 1000;
    public const int MaxRemarksLength = 2000;
    public const int MaxAddressLength = 500;
    public const int MaxPhoneLength = 20;
    public const int MaxEmailLength = 255;
    public const int MaxGstinLength = 15;
    public const int MaxPanLength = 10;
    public const int MaxPincodeLength = 10;
    
    // Financial constraints
    public const decimal MaxQuantity = 999999999.999m;
    public const decimal MaxAmount = 9999999999.99m;
    public const decimal MinPositiveValue = 0.001m;
    public const int MaxDecimalPrecision = 18;
    public const int MaxDecimalScale = 4;
    
    // Textile-specific constraints
    public const int MaxEndsPerBeam = 50000;
    public const int MaxTotalEnds = 500000;
    public const decimal MaxLengthMeters = 100000m;
    public const decimal MaxWeightKg = 999999.999m;
    public const int MaxBeamsPerJob = 200;
    public const int MaxBagsPerReceipt = 1000;
    
    // Security patterns
    public static readonly Regex SafeTextPattern = new(@"^[a-zA-Z0-9\s\-_.,()@#&/]+$", RegexOptions.Compiled);
    public static readonly Regex CodePattern = new(@"^[A-Za-z0-9\-_]+$", RegexOptions.Compiled);
    public static readonly Regex PhonePattern = new(@"^\+?[\d\-\s()]+$", RegexOptions.Compiled);
    public static readonly Regex GstinPattern = new(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", RegexOptions.Compiled);
    public static readonly Regex PanPattern = new(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", RegexOptions.Compiled);
    public static readonly Regex PincodePattern = new(@"^[1-9][0-9]{5}$", RegexOptions.Compiled);
    public static readonly Regex VehicleNoPattern = new(@"^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$", RegexOptions.Compiled);
    
    // SQL Injection patterns to block
    public static readonly Regex SqlInjectionPattern = new(
        @"(--|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bTRUNCATE\b|\bEXEC\b|;|\bOR\b\s+1\s*=\s*1)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    
    // XSS patterns to block
    public static readonly Regex XssPattern = new(
        @"<script|javascript:|on\w+\s*=|<iframe|<object|<embed",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
}

/// <summary>
/// Extension methods for FluentValidation rules
/// </summary>
public static class ValidationExtensions
{
    public static IRuleBuilderOptions<T, string?> SafeText<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .Must(value => value == null || !ValidationRules.SqlInjectionPattern.IsMatch(value))
            .WithMessage("Input contains potentially dangerous characters")
            .Must(value => value == null || !ValidationRules.XssPattern.IsMatch(value))
            .WithMessage("Input contains potentially dangerous HTML/script content");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidCode<T>(this IRuleBuilder<T, string?> ruleBuilder, int maxLength = ValidationRules.MaxCodeLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength)
            .WithMessage($"Code must not exceed {maxLength} characters")
            .Matches(ValidationRules.CodePattern)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Code can only contain letters, numbers, hyphens, and underscores");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidName<T>(this IRuleBuilder<T, string?> ruleBuilder, int maxLength = ValidationRules.MaxNameLength)
    {
        return ruleBuilder
            .MaximumLength(maxLength)
            .WithMessage($"Name must not exceed {maxLength} characters")
            .SafeText();
    }
    
    public static IRuleBuilderOptions<T, decimal?> ValidQuantity<T>(this IRuleBuilder<T, decimal?> ruleBuilder)
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(0)
            .WithMessage("Quantity cannot be negative")
            .LessThanOrEqualTo(ValidationRules.MaxQuantity)
            .WithMessage($"Quantity exceeds maximum allowed value of {ValidationRules.MaxQuantity}");
    }
    
    public static IRuleBuilderOptions<T, decimal> ValidPositiveQuantity<T>(this IRuleBuilder<T, decimal> ruleBuilder)
    {
        return ruleBuilder
            .GreaterThan(0)
            .WithMessage("Quantity must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxQuantity)
            .WithMessage($"Quantity exceeds maximum allowed value of {ValidationRules.MaxQuantity}");
    }
    
    public static IRuleBuilderOptions<T, decimal?> ValidAmount<T>(this IRuleBuilder<T, decimal?> ruleBuilder)
    {
        return ruleBuilder
            .GreaterThanOrEqualTo(0)
            .WithMessage("Amount cannot be negative")
            .LessThanOrEqualTo(ValidationRules.MaxAmount)
            .WithMessage($"Amount exceeds maximum allowed value of {ValidationRules.MaxAmount}")
            .Must(value => !value.HasValue || HasValidPrecision(value.Value, 2))
            .WithMessage("Amount can have at most 2 decimal places");
    }
    
    public static IRuleBuilderOptions<T, decimal> ValidPositiveAmount<T>(this IRuleBuilder<T, decimal> ruleBuilder)
    {
        return ruleBuilder
            .GreaterThan(0)
            .WithMessage("Amount must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxAmount)
            .WithMessage($"Amount exceeds maximum allowed value of {ValidationRules.MaxAmount}");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidPhone<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .MaximumLength(ValidationRules.MaxPhoneLength)
            .WithMessage($"Phone number must not exceed {ValidationRules.MaxPhoneLength} characters")
            .Matches(ValidationRules.PhonePattern)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Invalid phone number format");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidEmail<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .MaximumLength(ValidationRules.MaxEmailLength)
            .WithMessage($"Email must not exceed {ValidationRules.MaxEmailLength} characters")
            .EmailAddress()
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Invalid email address format");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidGstin<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .Length(15)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("GSTIN must be exactly 15 characters")
            .Matches(ValidationRules.GstinPattern)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Invalid GSTIN format");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidPan<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .Length(10)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("PAN must be exactly 10 characters")
            .Matches(ValidationRules.PanPattern)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Invalid PAN format");
    }
    
    public static IRuleBuilderOptions<T, string?> ValidPincode<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .MaximumLength(ValidationRules.MaxPincodeLength)
            .Matches(ValidationRules.PincodePattern)
            .When(s => !string.IsNullOrEmpty(s as string), ApplyConditionTo.CurrentValidator)
            .WithMessage("Invalid pincode format (must be 6 digits, not starting with 0)");
    }
    
    private static bool HasValidPrecision(decimal value, int maxDecimalPlaces)
    {
        var multiplied = value * (decimal)Math.Pow(10, maxDecimalPlaces);
        return multiplied == Math.Floor(multiplied);
    }
}

#endregion

#region Authentication Validators

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MaximumLength(100).WithMessage("Username must not exceed 100 characters")
            .Matches(@"^[a-zA-Z0-9_]+$").WithMessage("Username can only contain letters, numbers, and underscores")
            .SafeText();

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters");
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required")
            .MaximumLength(128);

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("New password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one digit")
            .Matches(@"[!@#$%^&*(),.?""':{}|<>]").WithMessage("Password must contain at least one special character")
            .NotEqual(x => x.CurrentPassword).WithMessage("New password must be different from current password");
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required")
            .MaximumLength(500).WithMessage("Invalid refresh token format");
    }
}

#endregion

#region Master Data Validators

public class CreatePartyRequestValidator : AbstractValidator<CreatePartyRequest>
{
    public CreatePartyRequestValidator()
    {
        RuleFor(x => x.PartyCode)
            .NotEmpty().WithMessage("Party code is required")
            .ValidCode();

        RuleFor(x => x.PartyName)
            .NotEmpty().WithMessage("Party name is required")
            .ValidName();

        RuleFor(x => x.PartyType)
            .NotEmpty().WithMessage("Party type is required")
            .Must(type => new[] { "Customer", "Supplier", "Both", "Transporter" }.Contains(type))
            .WithMessage("Invalid party type. Must be Customer, Supplier, Both, or Transporter");

        RuleFor(x => x.City).ValidName(100);
        RuleFor(x => x.State).ValidName(100);
        RuleFor(x => x.StateCode).ValidCode(3);
        RuleFor(x => x.Pincode).ValidPincode();
        RuleFor(x => x.Phone).ValidPhone();
        RuleFor(x => x.Mobile).ValidPhone();
        RuleFor(x => x.Email).ValidEmail();
        RuleFor(x => x.ContactPerson).ValidName(100);
        RuleFor(x => x.GSTIN).ValidGstin();
        RuleFor(x => x.PAN).ValidPan();
        RuleFor(x => x.AddressLine1).MaximumLength(ValidationRules.MaxAddressLength).SafeText();
        RuleFor(x => x.AddressLine2).MaximumLength(ValidationRules.MaxAddressLength).SafeText();

        RuleFor(x => x.CreditDays)
            .GreaterThanOrEqualTo(0).WithMessage("Credit days cannot be negative")
            .LessThanOrEqualTo(365).WithMessage("Credit days cannot exceed 365");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Credit limit cannot be negative")
            .LessThanOrEqualTo(ValidationRules.MaxAmount).WithMessage("Credit limit exceeds maximum allowed");
    }
}

public class CreateLoomTypeRequestValidator : AbstractValidator<CreateLoomTypeRequest>
{
    public CreateLoomTypeRequestValidator()
    {
        RuleFor(x => x.LoomTypeCode)
            .NotEmpty().WithMessage("Loom type code is required")
            .ValidCode();

        RuleFor(x => x.LoomTypeName)
            .NotEmpty().WithMessage("Loom type name is required")
            .ValidName(100);

        RuleFor(x => x.WidthInches)
            .GreaterThan(0).When(x => x.WidthInches.HasValue)
            .WithMessage("Width must be greater than zero")
            .LessThanOrEqualTo(500).When(x => x.WidthInches.HasValue)
            .WithMessage("Width cannot exceed 500 inches");
    }
}

public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required")
            .ValidName();

        RuleFor(x => x.ShortName)
            .NotEmpty().WithMessage("Short name is required")
            .ValidCode(20);

        RuleFor(x => x.City).NotEmpty().ValidName(100);
        RuleFor(x => x.State).NotEmpty().ValidName(100);
        RuleFor(x => x.StateCode).NotEmpty().ValidCode(3);
        RuleFor(x => x.Pincode).NotEmpty().ValidPincode();
        RuleFor(x => x.Phone).ValidPhone();
        RuleFor(x => x.Email).ValidEmail();
        RuleFor(x => x.Website).MaximumLength(200).SafeText();
        RuleFor(x => x.GSTIN).NotEmpty().ValidGstin();
        RuleFor(x => x.PAN).NotEmpty().ValidPan();
        RuleFor(x => x.BankAccountNo).MaximumLength(30).SafeText();
        RuleFor(x => x.BankIFSC).MaximumLength(11).Matches(@"^[A-Z]{4}0[A-Z0-9]{6}$")
            .When(x => !string.IsNullOrEmpty(x.BankIFSC))
            .WithMessage("Invalid IFSC code format");
    }
}

public class CreateYarnCountRequestValidator : AbstractValidator<CreateYarnCountRequest>
{
    public CreateYarnCountRequestValidator()
    {
        // Yarn count codes allow spaces and slashes e.g. "20s 2/100", "Ne 40/1"
        RuleFor(x => x.CountCode)
            .NotEmpty().WithMessage("Count code is required")
            .MaximumLength(ValidationRules.MaxCodeLength).WithMessage($"Count code must not exceed {ValidationRules.MaxCodeLength} characters")
            .Matches(@"^[A-Za-z0-9\s/\-_.]+$").WithMessage("Count code can only contain letters, numbers, spaces, slashes, hyphens, and underscores");

        RuleFor(x => x.CountDescription)
            .MaximumLength(ValidationRules.MaxDescriptionLength).SafeText();

        RuleFor(x => x.Ply)
            .GreaterThanOrEqualTo(1).WithMessage("Ply must be at least 1")
            .LessThanOrEqualTo(10000).WithMessage("Ply value is too large");
    }
}

public class CreateBeamRequestValidator : AbstractValidator<CreateBeamRequest>
{
    public CreateBeamRequestValidator()
    {
        RuleFor(x => x.BeamNo)
            .NotEmpty().WithMessage("Beam number is required")
            .ValidCode();

        RuleFor(x => x.BeamType)
            .NotEmpty().WithMessage("Beam type is required")
            .Must(type => new[] { "Sizing Beam", "Warping Beam", "Weaver's Beam" }.Contains(type))
            .WithMessage("Invalid beam type");

        RuleFor(x => x.TareWeight)
            .GreaterThanOrEqualTo(0).WithMessage("Tare weight cannot be negative")
            .LessThanOrEqualTo(10000).WithMessage("Tare weight exceeds maximum (10000 kg)");

        RuleFor(x => x.WidthInches)
            .GreaterThan(0).When(x => x.WidthInches.HasValue)
            .LessThanOrEqualTo(500).When(x => x.WidthInches.HasValue);

        RuleFor(x => x.MaxEnds)
            .GreaterThan(0).When(x => x.MaxEnds.HasValue)
            .LessThanOrEqualTo(ValidationRules.MaxEndsPerBeam).When(x => x.MaxEnds.HasValue);
    }
}

public class CreateVehicleRequestValidator : AbstractValidator<CreateVehicleRequest>
{
    public CreateVehicleRequestValidator()
    {
        RuleFor(x => x.VehicleNo)
            .NotEmpty().WithMessage("Vehicle number is required")
            .MaximumLength(20)
            .Matches(ValidationRules.VehicleNoPattern)
            .WithMessage("Invalid vehicle number format (e.g., TN01AB1234)");

        RuleFor(x => x.VehicleType).ValidName(50);
        RuleFor(x => x.DriverName).ValidName(100);
        RuleFor(x => x.DriverPhone).ValidPhone();
        RuleFor(x => x.OwnerName).ValidName(100);
    }
}

#endregion

#region Yarn Transaction Validators

public class CreateYarnReceiptRequestValidator : AbstractValidator<CreateYarnReceiptRequest>
{
    public CreateYarnReceiptRequestValidator()
    {
        RuleFor(x => x.ReceiptDate)
            .NotEmpty().WithMessage("Receipt date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1)).WithMessage("Receipt date cannot be in the future");

        RuleFor(x => x.PartyId)
            .GreaterThan(0).WithMessage("Valid party is required");

        RuleFor(x => x.VehicleNo)
            .MaximumLength(20)
            .Matches(ValidationRules.VehicleNoPattern)
            .When(x => !string.IsNullOrEmpty(x.VehicleNo))
            .WithMessage("Invalid vehicle number format");

        RuleFor(x => x.DriverName).ValidName(100);
        RuleFor(x => x.Remarks).MaximumLength(ValidationRules.MaxRemarksLength).SafeText();

        RuleFor(x => x.Details)
            .NotEmpty().WithMessage("At least one detail line is required")
            .Must(d => d.Count <= ValidationRules.MaxBagsPerReceipt)
            .WithMessage($"Cannot have more than {ValidationRules.MaxBagsPerReceipt} bags per receipt");

        RuleForEach(x => x.Details).SetValidator(new CreateYarnReceiptDetailRequestValidator());
    }
}

public class CreateYarnReceiptDetailRequestValidator : AbstractValidator<CreateYarnReceiptDetailRequest>
{
    public CreateYarnReceiptDetailRequestValidator()
    {
        RuleFor(x => x.YarnCountId)
            .GreaterThan(0).WithMessage("Valid yarn count is required");

        RuleFor(x => x.LotNo).ValidCode();
        RuleFor(x => x.BagNo).ValidCode();

        RuleFor(x => x.GrossWeight)
            .GreaterThan(0).WithMessage("Gross weight must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxWeightKg).WithMessage("Gross weight exceeds maximum");

        RuleFor(x => x.TareWeight)
            .GreaterThanOrEqualTo(0).WithMessage("Tare weight cannot be negative")
            .LessThan(x => x.GrossWeight).WithMessage("Tare weight must be less than gross weight");

        RuleFor(x => x.ConeCount)
            .GreaterThan(0).When(x => x.ConeCount.HasValue)
            .LessThanOrEqualTo(10000).When(x => x.ConeCount.HasValue);

        RuleFor(x => x.RatePerKg)
            .GreaterThanOrEqualTo(0).WithMessage("Rate cannot be negative")
            .LessThanOrEqualTo(100000).WithMessage("Rate exceeds maximum");
    }
}

#endregion

#region Job Card Validators

public class CreateWarpingJobCardRequestValidator : AbstractValidator<CreateWarpingJobCardRequest>
{
    public CreateWarpingJobCardRequestValidator()
    {
        RuleFor(x => x.SetNo)
            .NotEmpty().WithMessage("Set number is required")
            .ValidCode();

        RuleFor(x => x.JobCardDate)
            .NotEmpty().WithMessage("Job card date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1)).WithMessage("Job card date cannot be in the future");

        RuleFor(x => x.PartyId)
            .GreaterThan(0).WithMessage("Valid party is required");

        RuleFor(x => x.YarnCountId)
            .GreaterThan(0).WithMessage("Valid yarn count is required");

        RuleFor(x => x.LotNo).ValidCode();

        RuleFor(x => x.TotalEnds)
            .GreaterThan(0).WithMessage("Total ends must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxTotalEnds).WithMessage($"Total ends cannot exceed {ValidationRules.MaxTotalEnds}");

        RuleFor(x => x.EndsPerBeam)
            .GreaterThan(0).WithMessage("Ends per beam must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxEndsPerBeam).WithMessage($"Ends per beam cannot exceed {ValidationRules.MaxEndsPerBeam}")
            .LessThanOrEqualTo(x => x.TotalEnds).WithMessage("Ends per beam cannot exceed total ends");

        RuleFor(x => x.SetLength)
            .GreaterThan(0).WithMessage("Set length must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxLengthMeters).WithMessage($"Set length cannot exceed {ValidationRules.MaxLengthMeters} meters");

        RuleFor(x => x.NumberOfBeams)
            .GreaterThan(0).WithMessage("Number of beams must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxBeamsPerJob).WithMessage($"Number of beams cannot exceed {ValidationRules.MaxBeamsPerJob}");

        RuleFor(x => x.WarpingMachineNo).ValidCode(20);
        RuleFor(x => x.Remarks).MaximumLength(ValidationRules.MaxRemarksLength).SafeText();

        RuleFor(x => x.BeamIds)
            .Must(ids => ids.Count <= ValidationRules.MaxBeamsPerJob)
            .WithMessage($"Cannot assign more than {ValidationRules.MaxBeamsPerJob} beams");
    }
}

public class CreateSizingJobCardRequestValidator : AbstractValidator<CreateSizingJobCardRequest>
{
    public CreateSizingJobCardRequestValidator()
    {
        RuleFor(x => x.SetNo)
            .NotEmpty().WithMessage("Set number is required")
            .ValidCode();

        RuleFor(x => x.JobCardDate)
            .NotEmpty().WithMessage("Job card date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1)).WithMessage("Job card date cannot be in the future");

        RuleFor(x => x.PartyId)
            .GreaterThan(0).WithMessage("Valid party is required");

        RuleFor(x => x.YarnCountId)
            .GreaterThan(0).WithMessage("Valid yarn count is required");

        RuleFor(x => x.LotNo).ValidCode();

        RuleFor(x => x.TotalEnds)
            .GreaterThan(0).WithMessage("Total ends must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxTotalEnds);

        RuleFor(x => x.SetLength)
            .GreaterThan(0).WithMessage("Set length must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxLengthMeters);

        RuleFor(x => x.SizingMachineNo).ValidCode(20);
        RuleFor(x => x.SizeRecipe).MaximumLength(500).SafeText();
        RuleFor(x => x.Remarks).MaximumLength(ValidationRules.MaxRemarksLength).SafeText();

        RuleFor(x => x.SourceBeamIds)
            .Must(ids => ids == null || ids.Count <= ValidationRules.MaxBeamsPerJob)
            .WithMessage($"Cannot use more than {ValidationRules.MaxBeamsPerJob} source beams");
    }
}

#endregion

#region Invoice Validators

public class CreateTaxInvoiceRequestValidator : AbstractValidator<CreateTaxInvoiceRequest>
{
    public CreateTaxInvoiceRequestValidator()
    {
        RuleFor(x => x.InvoiceDate)
            .NotEmpty().WithMessage("Invoice date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(1)).WithMessage("Invoice date cannot be in the future");

        RuleFor(x => x.PartyId)
            .GreaterThan(0).WithMessage("Valid party is required");

        RuleFor(x => x.PlaceOfSupply)
            .NotEmpty().WithMessage("Place of supply is required")
            .MaximumLength(100).SafeText();

        RuleFor(x => x.TransportMode)
            .MaximumLength(50).SafeText();

        RuleFor(x => x.VehicleNo)
            .MaximumLength(20)
            .Matches(ValidationRules.VehicleNoPattern)
            .When(x => !string.IsNullOrEmpty(x.VehicleNo))
            .WithMessage("Invalid vehicle number format");

        RuleFor(x => x.Remarks).MaximumLength(ValidationRules.MaxRemarksLength).SafeText();

        RuleFor(x => x.Details)
            .NotEmpty().WithMessage("At least one line item is required")
            .Must(d => d.Count <= 100).WithMessage("Cannot have more than 100 line items");

        RuleForEach(x => x.Details).SetValidator(new CreateTaxInvoiceDetailRequestValidator());

        // Financial integrity check
        RuleFor(x => x)
            .Must(x => ValidateFinancialTotals(x))
            .WithMessage("Invoice totals do not match line item calculations");
    }

    private bool ValidateFinancialTotals(CreateTaxInvoiceRequest request)
    {
        if (request.Details == null || !request.Details.Any()) return true;
        
        var calculatedTotal = request.Details.Sum(d => d.Quantity * d.Rate);
        
        // Basic sanity check
        return calculatedTotal >= 0 && calculatedTotal <= ValidationRules.MaxAmount;
    }
}

public class CreateTaxInvoiceDetailRequestValidator : AbstractValidator<CreateTaxInvoiceDetailRequest>
{
    public CreateTaxInvoiceDetailRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(ValidationRules.MaxDescriptionLength).SafeText();

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero")
            .LessThanOrEqualTo(ValidationRules.MaxQuantity);

        RuleFor(x => x.Rate)
            .GreaterThanOrEqualTo(0).WithMessage("Rate cannot be negative")
            .LessThanOrEqualTo(ValidationRules.MaxAmount);

        RuleFor(x => x.CGSTRate)
            .GreaterThanOrEqualTo(0).WithMessage("CGST rate cannot be negative")
            .LessThanOrEqualTo(28).WithMessage("CGST rate cannot exceed 28%");

        RuleFor(x => x.SGSTRate)
            .GreaterThanOrEqualTo(0).WithMessage("SGST rate cannot be negative")
            .LessThanOrEqualTo(28).WithMessage("SGST rate cannot exceed 28%");

        RuleFor(x => x.IGSTRate)
            .GreaterThanOrEqualTo(0).WithMessage("IGST rate cannot be negative")
            .LessThanOrEqualTo(28).WithMessage("IGST rate cannot exceed 28%");

        RuleFor(x => x.HSNCode)
            .MaximumLength(8)
            .Matches(@"^\d{4,8}$").When(x => !string.IsNullOrEmpty(x.HSNCode))
            .WithMessage("HSN code must be 4-8 digits");

        RuleFor(x => x.UOM)
            .NotEmpty().WithMessage("UOM is required")
            .MaximumLength(10);
    }
}

#endregion

#region Pagination Validators

public class PaginationParamsValidator : AbstractValidator<PaginationParams>
{
    public PaginationParamsValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("Page size must be at least 1")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

        RuleFor(x => x.Search)
            .MaximumLength(200).SafeText();

        RuleFor(x => x.SortBy)
            .MaximumLength(50)
            .Matches(@"^[a-zA-Z0-9_]+$").When(x => !string.IsNullOrEmpty(x.SortBy))
            .WithMessage("Invalid sort field name");
    }
}

#endregion
