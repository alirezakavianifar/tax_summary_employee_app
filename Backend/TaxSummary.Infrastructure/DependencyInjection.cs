using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Repositories;
using TaxSummary.Infrastructure.Services;
using TaxSummary.Application.Services;

namespace TaxSummary.Infrastructure;

/// <summary>
/// Dependency injection configuration for Infrastructure layer
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Check if we should use in-memory database
        var useInMemory = configuration.GetConnectionString("UseInMemoryDatabase");
        var useInMemoryDb = !string.IsNullOrEmpty(useInMemory) && bool.Parse(useInMemory);

        // Add DbContext
        services.AddDbContext<TaxSummaryDbContext>(options =>
        {
            if (useInMemoryDb)
            {
                // Use in-memory database for testing/development without SQL Server
                options.UseInMemoryDatabase("TaxSummaryDb");
            }
            else
            {
                // Use SQL Server for production
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions =>
                    {
                        sqlOptions.MigrationsAssembly(typeof(TaxSummaryDbContext).Assembly.FullName);
                        // sqlOptions.EnableRetryOnFailure(
                        //     maxRetryCount: 3,
                        //     maxRetryDelay: TimeSpan.FromSeconds(5),
                        //     errorNumbersToAdd: null);
                    });
            }

            // Enable sensitive data logging in development
            var enableSensitiveDataLogging = configuration.GetSection("Logging")
                .GetValue<bool>("EnableSensitiveDataLogging", false);
            
            if (enableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        // Register repositories
        services.AddScoped<IEmployeeRepository, EmployeeRepository>();

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register File Storage Service
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Register Excel Seed Service
        services.AddScoped<IExcelSeedService, ExcelSeedService>();

        return services;
    }
}
