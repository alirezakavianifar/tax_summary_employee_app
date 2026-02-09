using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Services;

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
        var passwordHasher = new PasswordHasher();

        // Create sample employees first
        var adminEmployee = Employee.Create(
            personnelNumber: "ADM001",
            firstName: "محمد",
            lastName: "رضایی",
            education: "کارشناسی ارشد مدیریت",
            serviceUnit: "اداره کل امور مالیاتی تهران",
            currentPosition: "مدیر سیستم",
            appointmentPosition: "مدیر ارشد سیستم",
            previousExperienceYears: 10
        );

        var managerEmployee = Employee.Create(
            personnelNumber: "MGR001",
            firstName: "فاطمه",
            lastName: "کریمی",
            education: "کارشناسی ارشد حسابداری",
            serviceUnit: "اداره کل امور مالیاتی تهران",
            currentPosition: "مدیر گروه",
            appointmentPosition: "مدیر ارشد گروه",
            previousExperienceYears: 7
        );

        var employeeRecord = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "کارشناسی ارشد مدیریت مالی",
            serviceUnit: "اداره کل امور مالیاتی تهران",
            currentPosition: "کارشناس مالیاتی",
            appointmentPosition: "کارشناس ارشد مالیاتی",
            previousExperienceYears: 5
        );

        // Add administrative status for employee
        var adminStatus = AdministrativeStatus.Create(
            employeeId: employeeRecord.Id,
            missionDays: 15,
            incentiveHours: 40,
            delayAndAbsenceHours: 8,
            hourlyLeaveHours: 16
        );

        employeeRecord.SetAdministrativeStatus(adminStatus);

        // Add performance capability with metrics for employee
        var capability = PerformanceCapability.Create(
            employeeId: employeeRecord.Id,
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

        employeeRecord.AddPerformanceCapability(capability);

        // Add photo URL for employee
        employeeRecord.UpdatePhoto("/uploads/employee-photos/Mehdi_Kazemi_744979.jpg");

        // Add status description for employee
        employeeRecord.UpdateStatusDescription("کارمند نمونه با عملکرد مناسب و سوابق مثبت اداری. دارای تجربه کافی در حوزه امور مالیاتی و شناسایی مشاغل مشمول مالیات. سوابق اداری مثبت و بدون مشکل انضباطی.");

        // Add employees to context
        context.Employees.Add(adminEmployee);
        context.Employees.Add(managerEmployee);
        context.Employees.Add(employeeRecord);

        // Save employees first to get their IDs
        await context.SaveChangesAsync();

        // Create default users with hashed passwords
        // Password for all users: "Admin@123" (change in production!)
        var defaultPassword = "Admin@123";
        var hashedPassword = passwordHasher.HashPassword(defaultPassword);

        // Admin user
        var adminUser = User.Create(
            username: "admin",
            email: "admin@taxsummary.ir",
            passwordHash: hashedPassword,
            role: "Admin",
            employeeId: adminEmployee.Id
        );

        // Manager user
        var managerUser = User.Create(
            username: "manager",
            email: "manager@taxsummary.ir",
            passwordHash: hashedPassword,
            role: "Manager",
            employeeId: managerEmployee.Id
        );

        // Employee user
        var employeeUser = User.Create(
            username: "employee",
            email: "employee@taxsummary.ir",
            passwordHash: hashedPassword,
            role: "Employee",
            employeeId: employeeRecord.Id
        );

        // Add users to context
        context.Users.Add(adminUser);
        context.Users.Add(managerUser);
        context.Users.Add(employeeUser);

        // Associate employees with users
        adminEmployee.AssociateWithUser(adminUser.Id);
        managerEmployee.AssociateWithUser(managerUser.Id);
        employeeRecord.AssociateWithUser(employeeUser.Id);

        // Save all changes
        await context.SaveChangesAsync();
    }
}
