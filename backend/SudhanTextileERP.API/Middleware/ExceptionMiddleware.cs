using System.Net;
using System.Text.Json;
using FluentValidation;

namespace SudhanTextileERP.API.Middleware;

/// <summary>
/// Global exception middleware for proper ERP error handling
/// No API should ever return 500 for normal user actions
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse();

        switch (exception)
        {
            // 401 Unauthorized
            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                response.ErrorCode = "AUTH_UNAUTHORIZED";
                break;

            // 404 Not Found
            case KeyNotFoundException:
            case EntityNotFoundException entityNotFound:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = exception.Message;
                response.ErrorCode = "NOT_FOUND";
                break;

            // 400 Bad Request - Validation errors
            case ValidationException validationEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Validation failed";
                response.ErrorCode = "VALIDATION_ERROR";
                response.Errors = validationEx.Errors.Select(e => e.ErrorMessage).ToList();
                break;

            case ArgumentException argEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = argEx.Message;
                response.ErrorCode = "INVALID_ARGUMENT";
                break;

            // 409 Conflict - Business rule violations (specific exceptions first)
            case InsufficientStockException stockEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = stockEx.Message;
                response.ErrorCode = "INSUFFICIENT_STOCK";
                response.Details = $"Available: {stockEx.AvailableQty:N2} kg, Required: {stockEx.RequiredQty:N2} kg";
                break;

            case ApprovalRequiredException approvalEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = approvalEx.Message;
                response.ErrorCode = "APPROVAL_REQUIRED";
                break;

            case RecordLockedException lockedEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = lockedEx.Message;
                response.ErrorCode = "RECORD_LOCKED";
                break;

            case DuplicateEntryException duplicateEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = duplicateEx.Message;
                response.ErrorCode = "DUPLICATE_ENTRY";
                break;

            case InvalidStatusTransitionException statusEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = statusEx.Message;
                response.ErrorCode = "INVALID_STATUS_TRANSITION";
                break;

            // Generic BusinessRuleException (catch-all for business rules)
            case BusinessRuleException businessRule:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = businessRule.Message;
                response.ErrorCode = businessRule.ErrorCode;
                break;

            case InvalidOperationException invalidOp:
                // Check if it's a business rule issue
                if (invalidOp.Message.Contains("stock", StringComparison.OrdinalIgnoreCase) ||
                    invalidOp.Message.Contains("insufficient", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    response.ErrorCode = "BUSINESS_RULE_VIOLATION";
                }
                else if (invalidOp.Message.Contains("approved", StringComparison.OrdinalIgnoreCase) ||
                         invalidOp.Message.Contains("locked", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    response.ErrorCode = "RECORD_LOCKED";
                }
                else
                {
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.ErrorCode = "INVALID_OPERATION";
                }
                response.Message = invalidOp.Message;
                break;

            // 500 Internal Server Error - Only for unexpected errors
            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = _env.IsDevelopment() 
                    ? exception.Message 
                    : "An internal server error occurred. Please try again later.";
                response.ErrorCode = "INTERNAL_ERROR";
                response.Details = _env.IsDevelopment() ? exception.StackTrace : null;
                
                // Log the full exception for investigation
                _logger.LogCritical(exception, "Unhandled exception occurred");
                break;
        }

        response.StatusCode = context.Response.StatusCode;
        response.Success = false;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}

public class ApiErrorResponse
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public string? Details { get; set; }
    public List<string>? Errors { get; set; }
}

// ============================================
// CUSTOM ERP BUSINESS EXCEPTIONS
// ============================================

/// <summary>
/// Entity not found in the database
/// </summary>
public class EntityNotFoundException : Exception
{
    public string EntityType { get; }
    public object EntityId { get; }

    public EntityNotFoundException(string entityType, object entityId)
        : base($"{entityType} with ID {entityId} not found")
    {
        EntityType = entityType;
        EntityId = entityId;
    }
}

/// <summary>
/// Business rule violation (returns 409)
/// </summary>
public class BusinessRuleException : Exception
{
    public string ErrorCode { get; }

    public BusinessRuleException(string message, string errorCode = "BUSINESS_RULE_VIOLATION")
        : base(message)
    {
        ErrorCode = errorCode;
    }
}

/// <summary>
/// Insufficient stock for operation
/// </summary>
public class InsufficientStockException : BusinessRuleException
{
    public decimal AvailableQty { get; }
    public decimal RequiredQty { get; }
    public string YarnCode { get; }

    public InsufficientStockException(string yarnCode, decimal availableQty, decimal requiredQty)
        : base($"Insufficient stock for {yarnCode}. Available: {availableQty:N2} kg, Required: {requiredQty:N2} kg", "INSUFFICIENT_STOCK")
    {
        YarnCode = yarnCode;
        AvailableQty = availableQty;
        RequiredQty = requiredQty;
    }
}

/// <summary>
/// Approval is required before this operation
/// </summary>
public class ApprovalRequiredException : BusinessRuleException
{
    public string DocumentType { get; }
    public string RequiredStatus { get; }

    public ApprovalRequiredException(string documentType, string requiredStatus)
        : base($"{documentType} must be {requiredStatus} before this operation", "APPROVAL_REQUIRED")
    {
        DocumentType = documentType;
        RequiredStatus = requiredStatus;
    }
}

/// <summary>
/// Record is locked and cannot be modified
/// </summary>
public class RecordLockedException : BusinessRuleException
{
    public string RecordType { get; }

    public RecordLockedException(string recordType)
        : base($"This {recordType} is locked and cannot be modified", "RECORD_LOCKED")
    {
        RecordType = recordType;
    }
}

/// <summary>
/// Duplicate entry already exists
/// </summary>
public class DuplicateEntryException : BusinessRuleException
{
    public string FieldName { get; }
    public string FieldValue { get; }

    public DuplicateEntryException(string fieldName, string fieldValue)
        : base($"A record with {fieldName} '{fieldValue}' already exists", "DUPLICATE_ENTRY")
    {
        FieldName = fieldName;
        FieldValue = fieldValue;
    }
}

/// <summary>
/// Invalid status transition
/// </summary>
public class InvalidStatusTransitionException : BusinessRuleException
{
    public string CurrentStatus { get; }
    public string TargetStatus { get; }

    public InvalidStatusTransitionException(string currentStatus, string targetStatus)
        : base($"Cannot transition from '{currentStatus}' to '{targetStatus}'", "INVALID_STATUS_TRANSITION")
    {
        CurrentStatus = currentStatus;
        TargetStatus = targetStatus;
    }
}
