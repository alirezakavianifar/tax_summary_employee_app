using System.Text.Json;
using FluentValidation;
using TaxSummary.Api.Middleware;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services;
using TaxSummary.Application.Validators;
using TaxSummary.Infrastructure;
using TaxSummary.Infrastructure.Data;

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

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeReportValidator>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Tax Summary Employee API",
        Version = "v1",
        Description = "REST API for Tax Summary Employee Application - Persian RTL Form System",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Tax Summary Team"
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

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Tax Summary API v1");
        options.RoutePrefix = string.Empty; // Swagger UI at root
    });

    // Initialize database in development
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<TaxSummaryDbContext>();
        await DbInitializer.InitializeAsync(context);
    }
}

// Use custom exception handling middleware
app.UseExceptionHandlingMiddleware();

// Use HTTPS redirection
app.UseHttpsRedirection();

// Serve static files (for employee photos)
app.UseStaticFiles();

// Use CORS
app.UseCors("AllowFrontend");

// Use authorization (if needed in the future)
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Map health checks
app.MapHealthChecks("/health");

app.Run();
