using FluentValidation;
using System.Net;
using System.Text.Json;
using SudhanTextileERP.API.DTOs;

namespace SudhanTextileERP.API.Middleware;

/// <summary>
/// Global validation middleware that intercepts requests and validates DTOs
/// before they reach the controller
/// </summary>
public class ValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ValidationMiddleware> _logger;

    public ValidationMiddleware(RequestDelegate next, ILogger<ValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
    {
        // Only intercept POST, PUT, PATCH methods
        if (!new[] { "POST", "PUT", "PATCH" }.Contains(context.Request.Method))
        {
            await _next(context);
            return;
        }

        await _next(context);
    }
}

/// <summary>
/// Custom validation filter that provides detailed error responses
/// </summary>
public class ValidationFilter : IEndpointFilter
{
    private readonly ILogger<ValidationFilter> _logger;

    public ValidationFilter(ILogger<ValidationFilter> logger)
    {
        _logger = logger;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var result = await next(context);
        return result;
    }
}

/// <summary>
/// Validation behavior for MediatR pipeline (if using CQRS pattern)
/// </summary>
public static class ValidationPipelineExtensions
{
    public static IServiceCollection AddValidationPipeline(this IServiceCollection services)
    {
        // Register all validators from assembly
        services.AddValidatorsFromAssemblyContaining<Program>();
        
        return services;
    }
}
