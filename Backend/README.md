# TaxSummary Backend - Clean Architecture Implementation

This is the backend implementation of the Tax Summary Employee Application following Clean Architecture principles.

## Architecture Overview

The backend is organized into layers, following the Dependency Rule: dependencies point inward.

```
┌─────────────────────────────────────────┐
│         API Layer                       │
│      (ASP.NET Core Controllers)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│   (Use Cases, DTOs, Interfaces)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Domain Layer ✓ COMPLETED        │
│  (Entities, Business Logic, Rules)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (EF Core, Repositories, SQL Server)    │
└─────────────────────────────────────────┘
```

## Current Implementation Status

### Phase 1: Domain Layer ✓ COMPLETED

The Domain layer has been fully implemented with:

#### Entities
- **Employee**: Core employee entity with personal information
- **AdministrativeStatus**: Administrative performance tracking
- **PerformanceCapability**: Employee performance capabilities

#### Value Objects
- **PersonnelNumber**: Validated personnel number with business rules

#### Interfaces
- **IEmployeeRepository**: Repository contract for employee operations
- **IUnitOfWork**: Transaction management contract

#### Common Infrastructure
- **Result**: Result pattern for operation outcomes
- **ValueObject**: Base class for value objects
- **DomainException**: Domain-specific exception hierarchy

## Project Structure

```
Backend/
├── TaxSummary.sln                 # Solution file
├── TaxSummary.Domain/             # ✓ Domain Layer (Phase 1 - COMPLETED)
│   ├── Common/
│   │   ├── Result.cs
│   │   └── ValueObject.cs
│   ├── Entities/
│   │   ├── Employee.cs
│   │   ├── AdministrativeStatus.cs
│   │   └── PerformanceCapability.cs
│   ├── ValueObjects/
│   │   └── PersonnelNumber.cs
│   ├── Interfaces/
│   │   ├── IEmployeeRepository.cs
│   │   └── IUnitOfWork.cs
│   ├── Exceptions/
│   │   └── DomainException.cs
│   └── TaxSummary.Domain.csproj
├── TaxSummary.Application/        # Phase 2 (TODO)
├── TaxSummary.Infrastructure/     # Phase 3 (TODO)
└── TaxSummary.Api/                # Phase 4 (TODO)
```

## Building the Project

### Prerequisites
- .NET 8.0 SDK or later
- Visual Studio 2022 or VS Code with C# extension

### Build Commands

```powershell
# Navigate to the Backend directory
cd Backend

# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Build specific project
dotnet build TaxSummary.Domain/TaxSummary.Domain.csproj
```

## Domain Layer Features

### Rich Domain Model
- Entities contain business logic and validation
- Encapsulation: All setters are private
- Factory methods for entity creation
- Domain methods for state changes

### Example Usage

```csharp
// Create an employee
var employee = Employee.Create(
    personnelNumber: "EMP001",
    firstName: "علی",
    lastName: "احمدی",
    education: "کارشناسی",
    serviceUnit: "واحد مالیات",
    currentPosition: "کارشناس",
    appointmentPosition: "کارشناس ارشد",
    previousExperienceYears: 5
);

// Create administrative status
var adminStatus = AdministrativeStatus.Create(
    employeeId: employee.Id,
    missionDays: 10,
    incentiveHours: 20,
    delayAndAbsenceHours: 5,
    hourlyLeaveHours: 8
);

employee.SetAdministrativeStatus(adminStatus);

// Create performance capability
var capability = PerformanceCapability.Create(
    employeeId: employee.Id,
    systemRole: "معاون مالیاتی",
    detectionOfTaxIssues: true,
    detectionOfTaxEvasion: true,
    companyIdentification: false,
    valueAddedRecognition: true,
    referredOrExecuted: true
);

employee.AddPerformanceCapability(capability);
```

## Next Steps

### Phase 2: Application Layer
- Create DTOs (Data Transfer Objects)
- Implement Use Cases (Commands and Queries)
- Add Application Services
- Implement Validators using FluentValidation

### Phase 3: Infrastructure Layer
- Setup EF Core DbContext
- Create Entity Configurations
- Implement Repositories
- Implement Unit of Work
- Create Database Migrations

### Phase 4: API Layer
- Create Controllers
- Setup Dependency Injection
- Add Middleware (Exception Handling, CORS)
- Configure Authentication/Authorization

## Design Principles

1. **Separation of Concerns**: Each layer has a distinct responsibility
2. **Dependency Inversion**: Dependencies point inward
3. **Domain-Centric**: Business logic lives in the domain
4. **Testability**: Easy to unit test due to interfaces
5. **Maintainability**: Clear structure and boundaries

## Persian Language Support

All entities and value objects fully support Persian (Farsi) text:
- UTF-8 encoding throughout
- RTL text handling
- Persian character validation where applicable

## Contributing

When adding new features, ensure:
1. Domain entities have comprehensive validation
2. Business rules are enforced in the domain
3. All public methods have XML documentation
4. Follow the existing patterns and conventions

## License

Internal use only - Tax Summary Employee Application
