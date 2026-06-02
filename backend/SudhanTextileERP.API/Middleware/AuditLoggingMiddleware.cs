using SudhanTextileERP.API.Services;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace SudhanTextileERP.API.Middleware
{
    public class AuditLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuditLoggingMiddleware> _logger;

        // Actions that should be audited
        private static readonly HashSet<string> AuditedMethods = new() { "POST", "PUT", "DELETE", "PATCH" };

        // Endpoints to exclude from audit (health checks, login attempts logged separately)
        private static readonly HashSet<string> ExcludedPaths = new()
        {
            "/api/health",
            "/api/auth/login"
        };

        public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuditLogService auditLogService)
        {
            // Only audit write operations
            if (!AuditedMethods.Contains(context.Request.Method))
            {
                await _next(context);
                return;
            }

            // Skip excluded paths
            if (ExcludedPaths.Any(p => context.Request.Path.StartsWithSegments(p)))
            {
                await _next(context);
                return;
            }

            // Capture request body for audit
            context.Request.EnableBuffering();
            var requestBody = await ReadRequestBodyAsync(context.Request);

            // Store original response body stream
            var originalBodyStream = context.Response.Body;

            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            try
            {
                // Execute the request
                await _next(context);

                // Only log if request was successful (2xx status code)
                if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
                {
                    // Extract user information
                    var username = GetUsername(context.User);

                    // Parse action and module from path
                    var pathParts = context.Request.Path.Value?.Split('/') ?? Array.Empty<string>();
                    var module = pathParts.Length > 2 ? pathParts[2] : "Unknown";
                    var action = DetermineAction(context.Request.Method, module);

                    // Extract record ID if present (typically last part of path for PUT/DELETE)
                    string? recordId = null;
                    if ((context.Request.Method == "PUT" || context.Request.Method == "DELETE") && pathParts.Length > 3)
                    {
                        recordId = pathParts[^1];
                    }

                    // Log the audit entry (fire and forget - don't block response)
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await auditLogService.LogAsync(
                                tableName: module,
                                recordId: recordId != null && int.TryParse(recordId, out var rid) ? rid : 0,
                                action: action,
                                oldValues: null, // Will be populated by individual services
                                newValues: requestBody,
                                changedBy: username ?? "Anonymous"
                            );
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Audit logging failed for {Method} {Path}", context.Request.Method, context.Request.Path);
                        }
                    });
                }

                // Copy response body back to original stream
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);
            }
            finally
            {
                // Always restore original stream so global exception middleware can write error responses.
                context.Response.Body = originalBodyStream;
            }
        }

        private static async Task<string> ReadRequestBodyAsync(HttpRequest request)
        {
            request.Body.Position = 0;
            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            request.Body.Position = 0;
            return body;
        }

        private static int GetUserId(ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : 0;
        }

        private static string? GetUsername(ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value;
        }

        private static string DetermineAction(string method, string module)
        {
            return method switch
            {
                "POST" => $"Create_{module}",
                "PUT" => $"Update_{module}",
                "DELETE" => $"Delete_{module}",
                "PATCH" => $"Patch_{module}",
                _ => $"Action_{module}"
            };
        }
    }
}
