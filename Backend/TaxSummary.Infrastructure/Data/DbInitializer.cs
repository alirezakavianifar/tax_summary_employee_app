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
    /// <summary>
    /// Seeds the database with initial data if empty
    /// </summary>
    public static async Task InitializeAsync(TaxSummaryDbContext context)
    {
        // Ensure database is created
        if (context.Database.IsInMemory())
        {
            await context.Database.EnsureCreatedAsync();
        }
        else
        {
            await context.Database.MigrateAsync();
        }

        // Check if we already have both employees and users
        if (await context.Employees.AnyAsync() && await context.Users.AnyAsync())
        {
            return; // Database has been fully seeded
        }

        // Seed sample data
        await SeedSampleDataAsync(context);
    }

    private static async Task SeedSampleDataAsync(TaxSummaryDbContext context)
    {
        var passwordHasher = new PasswordHasher();

        // 1. Get or Create Employees
        var adminEmployee = await GetOrCreateEmployeeAsync(context, "ADM001", "محمد", "رضایی", "مدیر سیستم");
        var managerEmployee = await GetOrCreateEmployeeAsync(context, "MGR001", "فاطمه", "کریمی", "مدیر گروه");
        var employeeRecord = await GetEmployeeWithDetailsAsync(context, "EMP001");

        // Special handling for the main employee record if it doesn't exist
        if (employeeRecord == null)
        {
            employeeRecord = Employee.Create(
                personnelNumber: "EMP001",
                firstName: "علی",
                lastName: "احمدی",
                education: "کارشناسی ارشد مدیریت مالی",
                serviceUnit: "اداره کل امور مالیاتی تهران",
                currentPosition: "کارشناس مالیاتی",
                appointmentPosition: "کارشناس ارشد مالیاتی",
                previousExperienceYears: 5
            );

            // Add details
            var adminStatus = AdministrativeStatus.Create(
                employeeId: employeeRecord.Id,
                missionDays: 15,
                sickLeaveDays: 2,
                paidLeaveDays: 5,
                overtimeHours: 40,
                delayAndAbsenceHours: 8,
                hourlyLeaveHours: 16
            );
            employeeRecord.SetAdministrativeStatus(adminStatus);

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
            employeeRecord.UpdatePhoto("/uploads/employee-photos/Mehdi_Kazemi_744979.jpg");
            employeeRecord.UpdateStatusDescription("کارمند نمونه با عملکرد مناسب و سوابق مثبت اداری. دارای تجربه کافی در حوزه امور مالیاتی و شناسایی مشاغل مشمول مالیات. سوابق اداری مثبت و بدون مشکل انضباطی.");

            context.Employees.Add(employeeRecord);
        }

        await context.SaveChangesAsync();

        // 2. Get or Create Users
        var defaultPassword = "Admin@123";
        var hashedPassword = passwordHasher.HashPassword(defaultPassword);

        // Admin User
        if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminUser = User.Create(
                username: "admin",
                email: "admin@taxsummary.ir",
                passwordHash: hashedPassword,
                role: "Admin",
                employeeId: adminEmployee.Id
            );
            context.Users.Add(adminUser);
            adminEmployee.AssociateWithUser(adminUser.Id);
        }

        // Manager User
        if (!await context.Users.AnyAsync(u => u.Username == "manager"))
        {
            var managerUser = User.Create(
                username: "manager",
                email: "manager@taxsummary.ir",
                passwordHash: hashedPassword,
                role: "Manager",
                employeeId: managerEmployee.Id
            );
            context.Users.Add(managerUser);
            managerEmployee.AssociateWithUser(managerUser.Id);
        }

        // Employee User
        if (!await context.Users.AnyAsync(u => u.Username == "employee"))
        {
            var employeeUser = User.Create(
                username: "employee",
                email: "employee@taxsummary.ir",
                passwordHash: hashedPassword,
                role: "Employee",
                employeeId: employeeRecord.Id
            );
            context.Users.Add(employeeUser);
            employeeRecord.AssociateWithUser(employeeUser.Id);
        }

        await context.SaveChangesAsync();
    }

    private static async Task<Employee> GetOrCreateEmployeeAsync(
        TaxSummaryDbContext context, 
        string personnelNumber, 
        string firstName, 
        string lastName, 
        string position)
    {
        var employee = await context.Employees.FirstOrDefaultAsync(e => e.PersonnelNumber == personnelNumber);
        
        if (employee == null)
        {
            employee = Employee.Create(
                personnelNumber: personnelNumber,
                firstName: firstName,
                lastName: lastName,
                education: "کارشناسی",
                serviceUnit: "اداره کل امور مالیاتی تهران",
                currentPosition: position,
                appointmentPosition: position,
                previousExperienceYears: 5
            );
            context.Employees.Add(employee);
        }

        return employee;
    }

    private static async Task<Employee?> GetEmployeeWithDetailsAsync(TaxSummaryDbContext context, string personnelNumber)
    {
        return await context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .FirstOrDefaultAsync(e => e.PersonnelNumber == personnelNumber);
    }
}
