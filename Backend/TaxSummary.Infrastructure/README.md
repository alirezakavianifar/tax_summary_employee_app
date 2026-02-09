# TaxSummary.Infrastructure

This is the **Infrastructure Layer** of the Tax Summary Employee Application, following Clean Architecture principles.

## Overview

The Infrastructure layer contains:
- **Data Access**: EF Core DbContext and configurations
- **Repositories**: Concrete implementations of repository interfaces
- **Unit of Work**: Transaction management implementation
- **Database Initializer**: Seeding and initialization logic
- **Dependency Injection**: Infrastructure service registration

## Structure

```
TaxSummary.Infrastructure/
├── Data/
│   ├── TaxSummaryDbContext.cs              # EF Core DbContext
│   ├── UnitOfWork.cs                       # Transaction management
│   ├── DbInitializer.cs                    # Database seeding
│   └── Configurations/
│       ├── EmployeeConfiguration.cs        # Employee EF config
│       ├── AdministrativeStatusConfiguration.cs
│       └── PerformanceCapabilityConfiguration.cs
├── Repositories/
│   └── EmployeeRepository.cs               # Repository implementation
├── DependencyInjection.cs                  # DI configuration
└── README.md
```

## Dependencies

This layer depends on:
- **TaxSummary.Domain**: For entities and interfaces
- **Microsoft.EntityFrameworkCore**: ORM framework
- **Microsoft.EntityFrameworkCore.SqlServer**: SQL Server provider
- **Microsoft.EntityFrameworkCore.Tools**: Migrations and tooling

## Key Components

### TaxSummaryDbContext

EF Core database context with:
- DbSet properties for entities
- Automatic configuration discovery
- Connection string from appsettings

### Entity Configurations

#### EmployeeConfiguration
- Table: `Employees`
- Primary Key: `Id` (GUID)
- Unique Index: `PersonnelNumber`
- Indexes: `LastName`, `ServiceUnit`, `CreatedAt`
- One-to-One: `AdministrativeStatus` (cascade delete)
- One-to-Many: `PerformanceCapabilities` (cascade delete)

#### AdministrativeStatusConfiguration
- Table: `AdministrativeStatuses`
- Primary Key: `Id` (GUID)
- Unique Index: `EmployeeId`
- Index: `DelayAndAbsenceHours`
- Default Values: All hours/days = 0

#### PerformanceCapabilityConfiguration
- Table: `PerformanceCapabilities`
- Primary Key: `Id` (GUID)
- Indexes: `EmployeeId`, `SystemRole`
- Default Values: All flags = false

### EmployeeRepository

Implementation of `IEmployeeRepository` with:
- Eager loading of related entities
- Pagination support (max 100 per page)
- Full-text search (name and personnel number)
- Service unit filtering
- Optimized queries with indexes

**Methods:**
1. `GetByIdAsync()` - With includes
2. `GetByPersonnelNumberAsync()` - With includes
3. `GetAllAsync()` - Sorted by name
4. `GetPagedAsync()` - Pagination with total count
5. `AddAsync()` - Add new employee
6. `UpdateAsync()` - Update existing
7. `DeleteAsync()` - Remove employee
8. `ExistsByPersonnelNumberAsync()` - Duplicate check
9. `GetByServiceUnitAsync()` - Filter by unit
10. `SearchByNameAsync()` - Case-insensitive search

### UnitOfWork

Transaction management with:
- `SaveChangesAsync()` - Persist changes
- `BeginTransactionAsync()` - Start transaction
- `CommitTransactionAsync()` - Commit with rollback on error
- `RollbackTransactionAsync()` - Manual rollback
- `Dispose()` - Proper resource cleanup

### DbInitializer

Database initialization with:
- Automatic migrations
- Optional seed data
- Sample employee for testing

### DependencyInjection

Extension method for service registration:
- DbContext with connection string
- SQL Server provider
- Retry on failure (3 attempts, 5 second delay)
- Repository registration
- Unit of Work registration

## Database Schema

### Tables

```sql
-- Employees table
CREATE TABLE Employees (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    PersonnelNumber NVARCHAR(50) NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Education NVARCHAR(200),
    ServiceUnit NVARCHAR(200),
    CurrentPosition NVARCHAR(200),
    AppointmentPosition NVARCHAR(200),
    PreviousExperienceYears INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2
);

-- AdministrativeStatuses table
CREATE TABLE AdministrativeStatuses (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    EmployeeId UNIQUEIDENTIFIER NOT NULL UNIQUE,
    MissionDays INT NOT NULL DEFAULT 0,
    IncentiveHours INT NOT NULL DEFAULT 0,
    DelayAndAbsenceHours INT NOT NULL DEFAULT 0,
    HourlyLeaveHours INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2,
    FOREIGN KEY (EmployeeId) REFERENCES Employees(Id) ON DELETE CASCADE
);

-- PerformanceCapabilities table
CREATE TABLE PerformanceCapabilities (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    EmployeeId UNIQUEIDENTIFIER NOT NULL,
    SystemRole NVARCHAR(200) NOT NULL,
    DetectionOfTaxIssues BIT NOT NULL DEFAULT 0,
    DetectionOfTaxEvasion BIT NOT NULL DEFAULT 0,
    CompanyIdentification BIT NOT NULL DEFAULT 0,
    ValueAddedRecognition BIT NOT NULL DEFAULT 0,
    ReferredOrExecuted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2,
    FOREIGN KEY (EmployeeId) REFERENCES Employees(Id) ON DELETE CASCADE
);
```

### Indexes

```sql
-- Employee indexes
CREATE UNIQUE INDEX IX_Employees_PersonnelNumber ON Employees(PersonnelNumber);
CREATE INDEX IX_Employees_LastName ON Employees(LastName);
CREATE INDEX IX_Employees_ServiceUnit ON Employees(ServiceUnit);
CREATE INDEX IX_Employees_CreatedAt ON Employees(CreatedAt);

-- AdministrativeStatus indexes
CREATE UNIQUE INDEX IX_AdministrativeStatuses_EmployeeId ON AdministrativeStatuses(EmployeeId);
CREATE INDEX IX_AdministrativeStatuses_DelayAndAbsenceHours ON AdministrativeStatuses(DelayAndAbsenceHours);

-- PerformanceCapability indexes
CREATE INDEX IX_PerformanceCapabilities_EmployeeId ON PerformanceCapabilities(EmployeeId);
CREATE INDEX IX_PerformanceCapabilities_SystemRole ON PerformanceCapabilities(SystemRole);
```

## Configuration

### Connection String (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TaxSummaryDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Logging": {
    "EnableSensitiveDataLogging": false
  }
}
```

### Production Connection String

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=TaxSummaryDb;User Id=your-user;Password=your-password;TrustServerCertificate=true;MultipleActiveResultSets=true"
  }
}
```

## Usage

### Register Infrastructure Services

```csharp
// In Program.cs or Startup.cs
services.AddInfrastructure(configuration);
```

### Database Migrations

```bash
# Add migration
dotnet ef migrations add InitialCreate --project TaxSummary.Infrastructure --startup-project TaxSummary.Api

# Update database
dotnet ef database update --project TaxSummary.Infrastructure --startup-project TaxSummary.Api

# Remove last migration (if needed)
dotnet ef migrations remove --project TaxSummary.Infrastructure --startup-project TaxSummary.Api
```

### Initialize Database

```csharp
// In Program.cs
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TaxSummaryDbContext>();
    await DbInitializer.InitializeAsync(context);
}
```

## Features

### Performance Optimizations

1. **Indexes**: Strategic indexes for common queries
2. **Eager Loading**: Includes related entities to avoid N+1 queries
3. **Pagination**: Limits result sets for large tables
4. **Retry Logic**: Automatic retry on transient failures

### Persian Language Support

- NVARCHAR columns for Unicode support
- Full UTF-8 text storage
- Case-insensitive search with Persian characters

### Transaction Support

- ACID compliance
- Automatic rollback on errors
- Manual transaction control

### Query Optimization

- Sorted results by default
- Filtered queries with indexes
- Efficient pagination
- Case-insensitive search

## Testing

### Integration Tests (Example)

```csharp
public class EmployeeRepositoryTests : IDisposable
{
    private readonly TaxSummaryDbContext _context;
    private readonly EmployeeRepository _repository;

    public EmployeeRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TaxSummaryDbContext(options);
        _repository = new EmployeeRepository(_context);
    }

    [Fact]
    public async Task AddAsync_ValidEmployee_AddsToDatabase()
    {
        // Arrange
        var employee = Employee.Create(...);

        // Act
        await _repository.AddAsync(employee);
        await _context.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(employee.Id);
        Assert.NotNull(result);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

## Design Patterns

### Repository Pattern
- Abstracts data access
- Testable through interfaces
- Centralized query logic

### Unit of Work Pattern
- Transaction boundaries
- Consistent state management
- Automatic cleanup

### Configuration Pattern
- Fluent API for entity configuration
- Separation of concerns
- Reusable configurations

## Notes

- All GUIDs are generated in the domain layer
- Cascade delete ensures referential integrity
- UTC timestamps for consistency
- Retry logic handles transient SQL errors
- Connection pooling enabled by default

---

**Infrastructure Layer Status: ✅ COMPLETE**

Ready for Phase 4: API Layer (Controllers and middleware)
