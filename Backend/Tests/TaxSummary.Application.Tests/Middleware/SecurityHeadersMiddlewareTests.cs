using FluentAssertions;
using Microsoft.AspNetCore.Http;
using TaxSummary.Api.Middleware;
using Xunit;

namespace TaxSummary.Application.Tests.Middleware;

public class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_ShouldAddExpectedSecurityHeaders()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new SecurityHeadersMiddleware(next);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeTrue();
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("SAMEORIGIN");
        context.Response.Headers["Referrer-Policy"].ToString().Should().Be("strict-origin-when-cross-origin");
        context.Response.Headers["Permissions-Policy"].ToString().Should().Be("geolocation=(), camera=(), microphone=()");
        context.Response.Headers["X-XSS-Protection"].ToString().Should().Be("1; mode=block");
        context.Response.Headers["Content-Security-Policy"].ToString().Should().Contain("frame-ancestors 'self'");
    }

    [Fact]
    public async Task InvokeAsync_ShouldNotOverwrite_ExistingCustomHeaders()
    {
        // Arrange
        var context = new DefaultHttpContext();
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["Referrer-Policy"] = "no-referrer";

        RequestDelegate next = (ctx) => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers["X-Frame-Options"].ToString().Should().Be("DENY");
        context.Response.Headers["Referrer-Policy"].ToString().Should().Be("no-referrer");
        context.Response.Headers["X-Content-Type-Options"].ToString().Should().Be("nosniff");
    }
}
