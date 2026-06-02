using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace SudhanTextileERP.API.Middleware
{
    public static class SecurityConfiguration
    {
        public static IServiceCollection AddSecurityHardening(this IServiceCollection services, IConfiguration configuration)
        {
            // Rate Limiting
            services.AddRateLimiter(options =>
            {
                // Global rate limit
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 100,
                            Window = TimeSpan.FromMinutes(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Strict rate limit for authentication endpoints
                options.AddPolicy("auth", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = 429;
                    await context.HttpContext.Response.WriteAsync(
                        "Too many requests. Please try again later.", token);
                };
            });

            return services;
        }

        public static IApplicationBuilder UseSecurityHardening(this IApplicationBuilder app, IConfiguration configuration)
        {
            var env = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();

            // HTTPS Redirection (Production only)
            if (!env.IsDevelopment())
            {
                app.UseHttpsRedirection();
                app.UseHsts();
            }

            // Security Headers
            app.Use(async (context, next) =>
            {
                // Prevent clickjacking
                context.Response.Headers.Append("X-Frame-Options", "DENY");
                
                // Prevent MIME sniffing
                context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
                
                // XSS Protection
                context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
                
                // Content Security Policy
                context.Response.Headers.Append("Content-Security-Policy", 
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
                
                // Referrer Policy
                context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
                
                // Permissions Policy
                context.Response.Headers.Append("Permissions-Policy", 
                    "geolocation=(), microphone=(), camera=()");

                // Remove server header
                context.Response.Headers.Remove("Server");
                context.Response.Headers.Remove("X-Powered-By");

                await next();
            });

            // Rate Limiting
            app.UseRateLimiter();

            return app;
        }
    }
}
