using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data;

/// <summary>
/// Database initializer for seeding initial data
/// </summary>
public static class DbInitializer
{
    /// <summary>
    /// Seeds the database with initial data if empty
    /// </summary>
    public static async Task InitializeAsync(TaxSummaryDbContext context)
    {
        // Ensure database is created
        // For in-memory database, just ensure created instead of migrate
        if (context.Database.IsInMemory())
        {
            await context.Database.EnsureCreatedAsync();
        }
        else
        {
            await context.Database.MigrateAsync();
        }

        // Check if we already have data
        if (await context.Employees.AnyAsync())
        {
            return; // Database has been seeded
        }

        // Seed sample data (optional)
        await SeedSampleDataAsync(context);
    }

    private static async Task SeedSampleDataAsync(TaxSummaryDbContext context)
    {
        // Create sample employee
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "کارشناسی ارشد مدیریت مالی",
            serviceUnit: "اداره کل امور مالیاتی تهران",
            currentPosition: "کارشناس مالیاتی",
            appointmentPosition: "کارشناس ارشد مالیاتی",
            previousExperienceYears: 5
        );

        // Add administrative status
        var adminStatus = AdministrativeStatus.Create(
            employeeId: employee.Id,
            missionDays: 15,
            incentiveHours: 40,
            delayAndAbsenceHours: 8,
            hourlyLeaveHours: 16
        );

        employee.SetAdministrativeStatus(adminStatus);

        // Add performance capability with metrics
        var capability = PerformanceCapability.Create(
            employeeId: employee.Id,
            systemRole: "معاون مالیاتی سامانه سنیم",
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: false,
            valueAddedRecognition: true,
            referredOrExecuted: true,
            detectionOfTaxIssuesQuantity: 15,
            detectionOfTaxIssuesAmount: 250000000,
            detectionOfTaxEvasionQuantity: 8,
            detectionOfTaxEvasionAmount: 180000000,
            companyIdentificationQuantity: 0,
            companyIdentificationAmount: 0,
            valueAddedRecognitionQuantity: 12,
            valueAddedRecognitionAmount: 320000000,
            referredOrExecutedQuantity: 5,
            referredOrExecutedAmount: 95000000
        );

        employee.AddPerformanceCapability(capability);

        // Add photo URL (if test image exists)
        employee.UpdatePhoto("/uploads/employee-photos/Mehdi_Kazemi_744979.jpg");

        // Add status description
        employee.UpdateStatusDescription("کارمند نمونه با عملکرد مناسب و سوابق مثبت اداری. دارای تجربه کافی در حوزه امور مالیاتی و شناسایی مشاغل مشمول مالیات. سوابق اداری مثبت و بدون مشکل انضباطی.");

        // Add to context
        context.Employees.Add(employee);

        // Save changes
        await context.SaveChangesAsync();
    }
}
