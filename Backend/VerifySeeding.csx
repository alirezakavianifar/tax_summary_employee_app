using Microsoft.EntityFrameworkCore;
using TaxSummary.Infrastructure.Data;
using Microsoft.Extensions.Configuration;

// Build configuration
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json")
    .Build();

// Create DbContext
var connectionString = configuration.GetConnectionString("DefaultConnection");
var optionsBuilder = new DbContextOptionsBuilder<TaxSummaryDbContext>();
optionsBuilder.UseSqlServer(connectionString);

using var context = new TaxSummaryDbContext(optionsBuilder.Options);

Console.WriteLine("=== Checking Database Seeding ===\n");

// Check employees
var employeeCount = await context.Employees.CountAsync();
Console.WriteLine($"Total Employees: {employeeCount}");

if (employeeCount > 0)
{
    var employees = await context.Employees.ToListAsync();
    foreach (var emp in employees)
    {
        Console.WriteLine($"  - {emp.PersonnelNumber}: {emp.GetFullName()} ({emp.CurrentPosition})");
    }
}

Console.WriteLine();

// Check users
var userCount = await context.Users.CountAsync();
Console.WriteLine($"Total Users: {userCount}");

if (userCount > 0)
{
    var users = await context.Users.Include(u => u.Employee).ToListAsync();
    foreach (var user in users)
    {
        Console.WriteLine($"  - Username: {user.Username}");
        Console.WriteLine($"    Email: {user.Email}");
        Console.WriteLine($"    Role: {user.Role}");
        Console.WriteLine($"    Active: {user.IsActive}");
        Console.WriteLine($"    Employee: {user.Employee?.GetFullName() ?? "None"}");
        Console.WriteLine($"    Password Hash: {user.PasswordHash.Substring(0, 20)}...");
        Console.WriteLine();
    }
}

Console.WriteLine("\n=== Verification Complete ===");
Console.WriteLine("\nDefault credentials for all users:");
Console.WriteLine("  Username: admin / manager / employee");
Console.WriteLine("  Password: Admin@123");
