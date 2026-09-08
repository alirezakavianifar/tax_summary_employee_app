using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace TaxSummary.Api.Middleware;

/// <summary>
/// Middleware to apply secure HTTP headers to all API responses
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        var path = context.Request.Path.Value ?? string.Empty;
        bool isDocumentView = path.Contains("/documents/", StringComparison.OrdinalIgnoreCase) &&
                              path.EndsWith("/view", StringComparison.OrdinalIgnoreCase);

        // Prevent MIME type sniffing
        if (!headers.ContainsKey("X-Content-Type-Options"))
        {
            headers["X-Content-Type-Options"] = "nosniff";
        }

        // Prevent clickjacking / framing (allow frontend embedding for document preview)
        if (!headers.ContainsKey("X-Frame-Options") && !isDocumentView)
        {
            headers["X-Frame-Options"] = "SAMEORIGIN";
        }

        // Control referrer information sent with requests
        if (!headers.ContainsKey("Referrer-Policy"))
        {
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        }

        // Restrict browser features and APIs
        if (!headers.ContainsKey("Permissions-Policy"))
        {
            headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()";
        }

        // Legacy XSS filter protection
        if (!headers.ContainsKey("X-XSS-Protection"))
        {
            headers["X-XSS-Protection"] = "1; mode=block";
        }

        // Content Security Policy
        if (!headers.ContainsKey("Content-Security-Policy"))
        {
            if (isDocumentView)
            {
                headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'self' http://localhost:3000 http://localhost:3001 http://127.0.0.1:3000;";
            }
            else
            {
                headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:* https://localhost:*; frame-ancestors 'self';";
            }
        }

        await _next(context);
    }
}

/// <summary>
/// Extension method for adding security headers middleware
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
