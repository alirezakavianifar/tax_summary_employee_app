using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaxSummary.Api.Middleware;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services;
using TaxSummary.Application.Validators;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Add Infrastructure layer (DbContext, Repositories, UnitOfWork)
builder.Services.AddInfrastructure(builder.Configuration);

// Add Application services
builder.Services.AddScoped<IEmployeeReportService, EmployeeReportService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();

// Add Infrastructure services
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeReportValidator>();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = builder.Configuration["JWT_SECRET_KEY"] 
    ?? jwtSettings["SecretKey"] 
    ?? throw new InvalidOperationException("JWT SecretKey is not configured. Set JWT_SECRET_KEY environment variable or configure JwtSettings:SecretKey.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "TaxSummaryApi",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "TaxSummaryClient",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // No tolerance for expired tokens
    };

    // Extract token from cookie if not in Authorization header
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Check if token is in Authorization header first
            if (string.IsNullOrEmpty(context.Token))
            {
                // If not, try to get from cookie (for refresh token scenarios)
                context.Token = context.Request.Cookies["accessToken"];
            }

            // Also check query string for token (useful for direct file preview/streaming)
            if (string.IsNullOrEmpty(context.Token) && context.Request.Query.TryGetValue("token", out var queryToken))
            {
                context.Token = queryToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Support any intranet IP/hostname (e.g., 10.52.0.114, localhost)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Support cookies/credentials
    });
});

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict policy for authentication endpoints (mitigates brute-force attacks)
    options.AddPolicy("AuthPolicy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? "anonymous";

        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    // General rate limit for standard API endpoints (100 requests per minute)
    options.AddPolicy("GeneralPolicy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString()
            ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
            ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(new
            {
                success = false,
                message = "تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً پس از یک دقیقه مجدداً تلاش نمایید."
            }), token);
    };
});

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Tax Summary Employee API",
        Version = "v1",
        Description = "REST API for Tax Summary Employee Application - Persian RTL Form System with JWT Authentication",
        Contact = new OpenApiContact
        {
            Name = "Tax Summary Team"
        }
    });

    // Add JWT Authentication support in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments if available
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TaxSummaryDbContext>("Database");

var app = builder.Build();

// Initialize database (create, migrate, and seed if empty)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TaxSummaryDbContext>();
    await DbInitializer.InitializeAsync(context);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tax Summary API v1");
        options.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

// Use custom exception handling middleware
app.UseExceptionHandlingMiddleware();

// Use security headers middleware
app.UseSecurityHeaders();

// Use HTTPS redirection - Disabled for simpler local network deployment
// if (!app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }

// Serve static files (for employee photos)
app.UseStaticFiles();

// Use CORS
app.UseCors("AllowFrontend");

// Use Rate Limiting
app.UseRateLimiter();

// Use authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Map health checks
app.MapHealthChecks("/health");

app.Run();
