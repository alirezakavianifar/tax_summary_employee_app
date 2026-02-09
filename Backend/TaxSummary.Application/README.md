# TaxSummary.Application

This is the **Application Layer** of the Tax Summary Employee Application, following Clean Architecture principles.

## Overview

The Application layer contains:
- **DTOs (Data Transfer Objects)**: Objects for data transfer between layers
- **Services**: Application services orchestrating business workflows
- **Validators**: FluentValidation validators for input validation
- **Mapping**: AutoMapper profiles for entity-DTO conversions

## Structure

```
TaxSummary.Application/
├── DTOs/
│   ├── EmployeeDto.cs                      # Employee data transfer object
│   ├── AdministrativeStatusDto.cs          # Administrative status DTO
│   ├── PerformanceCapabilityDto.cs         # Performance capability DTO
│   ├── EmployeeReportDto.cs                # Complete report DTO
│   ├── CreateEmployeeReportDto.cs          # Create report DTO
│   └── UpdateEmployeeReportDto.cs          # Update report DTO
├── Services/
│   ├── IEmployeeReportService.cs           # Service interface
│   └── EmployeeReportService.cs            # Service implementation
├── Validators/
│   ├── CreateEmployeeReportValidator.cs    # Create validation
│   └── UpdateEmployeeReportValidator.cs    # Update validation
├── Mapping/
│   └── MappingProfile.cs                   # AutoMapper profiles
└── README.md
```

## Dependencies

This layer depends on:
- **TaxSummary.Domain**: For entities and interfaces
- **AutoMapper**: For object mapping
- **FluentValidation**: For input validation

## Key Components

### DTOs

#### EmployeeDto
Basic employee information without navigation properties.

#### EmployeeReportDto
Complete employee report including:
- Employee information
- Administrative status
- Performance capabilities list

#### CreateEmployeeReportDto
Used for creating new employee reports with all required data.

#### UpdateEmployeeReportDto
Used for updating existing employee reports (excludes personnel number).

### Services

#### IEmployeeReportService
Interface defining operations for:
- Getting reports by ID or personnel number
- Creating new reports
- Updating existing reports
- Deleting reports
- Searching and filtering employees

#### EmployeeReportService
Implementation providing:
- Transaction management via Unit of Work
- Entity-DTO mapping via AutoMapper
- Domain entity creation and updates
- Error handling with Result pattern

### Validators

#### CreateEmployeeReportValidator
Validates:
- Required fields (personnel number, names)
- Field length limits
- Value ranges (experience years, hours, days)
- Persian error messages

#### UpdateEmployeeReportValidator
Similar to create validator but excludes personnel number.

### Mapping

#### MappingProfile
AutoMapper configuration for:
- Entity to DTO mappings
- DTO to Entity mappings
- Ignoring navigation properties
- Ignoring computed/system fields

## Usage Examples

### Creating a Report

```csharp
public class ExampleController
{
    private readonly IEmployeeReportService _reportService;
    
    public async Task<IActionResult> CreateReport(CreateEmployeeReportDto dto)
    {
        var result = await _reportService.CreateReportAsync(dto);
        
        if (result.IsFailure)
        {
            return BadRequest(result.Error);
        }
        
        return Ok(result.Value); // Returns employee ID
    }
}
```

### Getting a Report

```csharp
public async Task<IActionResult> GetReport(Guid employeeId)
{
    var result = await _reportService.GetReportAsync(employeeId);
    
    if (result.IsFailure)
    {
        return NotFound(result.Error);
    }
    
    return Ok(result.Value); // Returns EmployeeReportDto
}
```

### Updating a Report

```csharp
public async Task<IActionResult> UpdateReport(Guid employeeId, UpdateEmployeeReportDto dto)
{
    var result = await _reportService.UpdateReportAsync(employeeId, dto);
    
    if (result.IsFailure)
    {
        return BadRequest(result.Error);
    }
    
    return NoContent();
}
```

### Validation

Validators are automatically executed when using FluentValidation middleware:

```csharp
// In Startup/Program.cs
services.AddValidatorsFromAssemblyContaining<CreateEmployeeReportValidator>();
```

## Error Messages

All validation messages are in Persian (Farsi):
- "شماره پرسنلی الزامی است" - Personnel number is required
- "نام خانوادگی الزامی است" - Last name is required
- "سابقه خدمتی نمی‌تواند منفی باشد" - Experience years cannot be negative

Service errors are also in Persian:
- "کارمند یافت نشد" - Employee not found
- "شماره پرسنلی قبلاً ثبت شده است" - Personnel number already registered

## Design Patterns

### Service Pattern
- Services orchestrate business logic
- Handle transactions
- Coordinate between repositories and domain

### DTO Pattern
- Separate data transfer from domain entities
- Prevent over-posting
- API versioning support

### Result Pattern
- Explicit success/failure handling
- Error messages included
- No exception throwing for business logic errors

### Repository Pattern
- Services depend on repository interfaces
- Infrastructure implements repositories
- Testability through mocking

## Validation Rules

### Employee Fields
| Field | Required | Max Length | Range |
|-------|----------|-----------|-------|
| Personnel Number | Yes | 50 | - |
| First Name | Yes | 100 | - |
| Last Name | Yes | 100 | - |
| Education | No | 200 | - |
| Service Unit | No | 200 | - |
| Current Position | No | 200 | - |
| Appointment Position | No | 200 | - |
| Experience Years | Yes | - | 0-60 |

### Administrative Status
| Field | Required | Max | Range |
|-------|----------|-----|-------|
| Mission Days | Yes | 365 | 0-365 |
| Incentive Hours | Yes | 8760 | 0-8760 |
| Delay Hours | Yes | 8760 | 0-8760 |
| Leave Hours | Yes | 8760 | 0-8760 |

### Performance Capability
| Field | Required | Max Length |
|-------|----------|-----------|
| System Role | Yes | 200 |
| Detection Flags | No | Boolean |

## Transaction Management

The service uses Unit of Work for transaction management:

```csharp
await _unitOfWork.BeginTransactionAsync();
try
{
    // Perform operations
    await _unitOfWork.SaveChangesAsync();
    await _unitOfWork.CommitTransactionAsync();
}
catch
{
    await _unitOfWork.RollbackTransactionAsync();
    throw;
}
```

## Integration with Other Layers

### Domain Layer
- Uses domain entities for business logic
- Calls factory methods for entity creation
- Respects domain invariants

### Infrastructure Layer
- Depends on repository interfaces
- Uses Unit of Work for transactions
- No direct database access

### API Layer
- Controllers call service methods
- Services return Result objects
- DTOs are used for request/response

## Testing

Services can be easily tested by mocking dependencies:

```csharp
[Fact]
public async Task CreateReport_ValidDto_ReturnsSuccess()
{
    // Arrange
    var mockRepo = new Mock<IEmployeeRepository>();
    var mockUoW = new Mock<IUnitOfWork>();
    var mapper = GetMapper();
    
    var service = new EmployeeReportService(mockRepo.Object, mockUoW.Object, mapper);
    var dto = new CreateEmployeeReportDto { /* valid data */ };
    
    // Act
    var result = await service.CreateReportAsync(dto);
    
    // Assert
    Assert.True(result.IsSuccess);
}
```

## Notes

- All async methods accept CancellationToken
- Persian language fully supported
- UTF-8 encoding for all text
- Result pattern for error handling
- Transaction support for data consistency
- AutoMapper for clean separation
- FluentValidation for robust validation

---

**Application Layer Status: ✅ COMPLETE**

Ready for Phase 3: Infrastructure Layer (Repository implementations and EF Core)
