using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Data.Interceptors;
using TaxSummary.Infrastructure.Repositories;
using TaxSummary.Infrastructure.Services;

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

        // Register HTTP context and Current User service
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<AuditLogInterceptor>();

        // Add DbContext
        services.AddDbContext<TaxSummaryDbContext>((sp, options) =>
        {
            // Register Audit Log Interceptor
            options.AddInterceptors(sp.GetRequiredService<AuditLogInterceptor>());

            if (useInMemoryDb)
            {
                // Use in-memory database for testing/development without SQL Server
                options.UseInMemoryDatabase("TaxSummaryDb");
            }
            else
            {
                // Use SQLite for easy deployment and portability
                options.UseSqlite(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqliteOptions =>
                    {
                        sqliteOptions.MigrationsAssembly(typeof(TaxSummaryDbContext).Assembly.FullName);
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
        services.AddScoped<IUserRepository, UserRepository>();

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register File Storage Service
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Register Excel Seed Service
        services.AddScoped<IExcelSeedService, ExcelSeedService>();

        // Register Office Service
        services.AddScoped<IOfficeService, OfficeService>();

        // Register Payroll Services
        services.AddSingleton<IPositionMappingService, PositionMappingService>();
        services.AddScoped<IPayrollRepository, PayrollRepository>();
        services.AddScoped<IPayrollCycleRepository, PayrollCycleRepository>();
        services.AddScoped<IPayrollService, PayrollService>();
        services.AddScoped<IPayrollCycleService, PayrollCycleService>();
        services.AddScoped<IPayrollExcelExportService, PayrollExcelExportService>();

        // Register Tax Refund Services
        services.AddScoped<ITaxRefundRepository, TaxRefundRepository>();
        services.AddScoped<RefundCalculationEngine>();
        services.AddScoped<IRefundDocumentStorageService, RefundDocumentStorageService>();
        services.AddScoped<ITaxRefundService, TaxRefundService>();
        services.AddScoped<ITaxRefundExcelService, TaxRefundExcelService>();

        // Register Menu Settings Services
        services.AddScoped<IMenuSettingsRepository, MenuSettingsRepository>();
        services.AddScoped<IMenuSettingsService, MenuSettingsService>();

        // Register Personnel & User Excel Import Service
        services.AddScoped<IPersonnelImportService, PersonnelImportService>();

        return services;
    }
}
