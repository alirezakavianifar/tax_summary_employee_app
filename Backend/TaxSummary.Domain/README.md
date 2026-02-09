# TaxSummary.Domain

This is the **Domain Layer** of the Tax Summary Employee Application, following Clean Architecture principles.

## Overview

The Domain layer contains:
- **Entities**: Core business objects with identity (Employee, AdministrativeStatus, PerformanceCapability)
- **Value Objects**: Immutable objects defined by their attributes (PersonnelNumber)
- **Domain Interfaces**: Repository and Unit of Work contracts
- **Domain Exceptions**: Specific exceptions for domain violations
- **Common**: Shared base classes and patterns (Result pattern, ValueObject base)

## Structure

```
TaxSummary.Domain/
├── Common/
│   ├── Result.cs              # Result pattern for operation outcomes
│   └── ValueObject.cs         # Base class for value objects
├── Entities/
│   ├── Employee.cs            # Core employee entity
│   ├── AdministrativeStatus.cs # Administrative performance data
│   └── PerformanceCapability.cs # Performance capabilities
├── ValueObjects/
│   └── PersonnelNumber.cs     # Personnel number value object
├── Interfaces/
│   ├── IEmployeeRepository.cs # Repository contract
│   └── IUnitOfWork.cs        # Unit of Work contract
├── Exceptions/
│   └── DomainException.cs    # Domain-specific exceptions
└── README.md
```

## Key Principles

1. **No Dependencies**: The domain layer has no external dependencies
2. **Rich Domain Model**: Entities contain business logic and validation
3. **Encapsulation**: All setters are private; state changes through domain methods
4. **Factory Methods**: Static `Create()` methods for entity instantiation
5. **Invariants Protection**: Validation in constructors and methods

## Usage Examples

### Creating an Employee

```csharp
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
```

### Creating Administrative Status

```csharp
var adminStatus = AdministrativeStatus.Create(
    employeeId: employee.Id,
    missionDays: 10,
    incentiveHours: 20,
    delayAndAbsenceHours: 5,
    hourlyLeaveHours: 8
);

employee.SetAdministrativeStatus(adminStatus);
```

### Creating Performance Capability

```csharp
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

## Domain Rules

### Employee Rules
- Personnel number, first name, and last name are required
- Personnel number cannot exceed 50 characters
- Experience years must be between 0 and 60

### Administrative Status Rules
- All hour/day values must be non-negative
- Mission days cannot exceed 365 per year
- Total hours cannot exceed 8760 (annual limit)

### Performance Capability Rules
- System role is required
- Multiple capabilities can be enabled per employee
- Each capability contributes to overall performance score

## Integration with Other Layers

The Domain layer is referenced by:
- **Application Layer**: Uses entities and interfaces
- **Infrastructure Layer**: Implements repository interfaces

The Domain layer references:
- **Nothing** - It's completely independent

## Notes

- All timestamps are in UTC
- Persian (Farsi) text is fully supported
- Entity IDs are GUIDs for distributed system compatibility
