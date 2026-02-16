using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Domain.Entities;

var config = new ConfigurationBuilder()
    .AddJsonFile("Backend/TaxSummary.Api/appsettings.json")
    .Build();

var optionsBuilder = new DbContextOptionsBuilder<TaxSummaryDbContext>();
optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

using var context = new TaxSummaryDbContext(optionsBuilder.Options);

var employees = await context.Employees.Take(20).ToListAsync();
Console.WriteLine($"Found {employees.Count} employees.");

foreach (var e in employees)
{
    Console.WriteLine($"ID: {e.Id}, PIN: {e.PersonnelNumber}, Name: {e.FirstName} {e.LastName}, NatID: '{e.NationalId}', Photo: '{e.PhotoUrl}'");
}
