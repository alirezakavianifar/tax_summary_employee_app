# Quick Start Guide - Phase 1 Domain Layer

## ✅ What's Been Implemented

Phase 1 (Domain Layer) of the Clean Architecture plan is complete. The foundation of the application is now in place with a rich domain model.

---

## 📂 Files Created

### Project Structure
```
Backend/
├── TaxSummary.sln                                    # Solution file
├── README.md                                         # Backend documentation
└── TaxSummary.Domain/
    ├── TaxSummary.Domain.csproj                     # .NET 8.0 project
    ├── README.md                                     # Domain documentation
    ├── Common/
    │   ├── Result.cs                                 # Result pattern
    │   └── ValueObject.cs                            # Value object base class
    ├── Entities/
    │   ├── Employee.cs                               # Employee entity (11 properties, 10 methods)
    │   ├── AdministrativeStatus.cs                   # Admin status (7 properties, 10 methods)
    │   └── PerformanceCapability.cs                  # Performance (12 properties, 20 methods)
    ├── ValueObjects/
    │   └── PersonnelNumber.cs                        # Personnel number value object
    ├── Interfaces/
    │   ├── IEmployeeRepository.cs                    # Repository interface (10 methods)
    │   └── IUnitOfWork.cs                           # Unit of Work interface (4 methods)
    └── Exceptions/
        └── DomainException.cs                        # 4 exception types
```

---

## 🚀 Quick Commands

### Build the Project
```powershell
cd Backend
dotnet build
```

**Expected Output:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Restore Dependencies
```powershell
cd Backend
dotnet restore
```

### Clean Build
```powershell
cd Backend
dotnet clean
dotnet build
```

---

## 💻 Code Examples

### 1. Creating an Employee

```csharp
using TaxSummary.Domain.Entities;

// Create a new employee
var employee = Employee.Create(
    personnelNumber: "EMP12345",
    firstName: "علی",
    lastName: "احمدی",
    education: "کارشناسی مهندسی کامپیوتر",
    serviceUnit: "اداره کل امور مالیاتی تهران",
    currentPosition: "کارشناس مالیاتی",
    appointmentPosition: "کارشناس ارشد مالیاتی",
    previousExperienceYears: 5
);

Console.WriteLine($"Employee Created: {employee.GetFullName()}");
Console.WriteLine($"ID: {employee.Id}");
```

### 2. Adding Administrative Status

```csharp
// Create administrative status for the employee
var adminStatus = AdministrativeStatus.Create(
    employeeId: employee.Id,
    missionDays: 15,
    incentiveHours: 40,
    delayAndAbsenceHours: 8,
    hourlyLeaveHours: 16
);

// Attach to employee
employee.SetAdministrativeStatus(adminStatus);

// Check if valid
if (adminStatus.IsValid())
{
    Console.WriteLine("Administrative status is valid");
}

// Check for disciplinary issues
if (adminStatus.HasDisciplinaryIssues())
{
    Console.WriteLine("Warning: Employee has disciplinary issues");
}
```

### 3. Adding Performance Capabilities

```csharp
// Create performance capability
var capability = PerformanceCapability.Create(
    employeeId: employee.Id,
    systemRole: "معاون مالیاتی سامانه سنیم",
    detectionOfTaxIssues: true,
    detectionOfTaxEvasion: true,
    companyIdentification: false,
    valueAddedRecognition: true,
    referredOrExecuted: true
);

// Add to employee
employee.AddPerformanceCapability(capability);

// Get capability score (0-100)
int score = capability.GetCapabilityScore();
Console.WriteLine($"Capability Score: {score}/100");

// Get active capabilities
var activeCapabilities = capability.GetActiveCapabilities();
foreach (var cap in activeCapabilities)
{
    Console.WriteLine($"- {cap}");
}
```

### 4. Updating Employee Information

```csharp
// Update personal information
employee.UpdatePersonalInfo(
    firstName: "علی",
    lastName: "احمدی زاده",
    education: "کارشناسی ارشد مدیریت مالی"
);

// Update position
employee.UpdatePosition(
    currentPosition: "کارشناس ارشد مالیاتی",
    appointmentPosition: "مدیر گروه",
    previousExperienceYears: 6
);

// Update service unit
employee.UpdateServiceUnit("اداره کل امور مالیاتی شرق تهران");

Console.WriteLine($"Updated at: {employee.UpdatedAt}");
```

### 5. Using Result Pattern

```csharp
using TaxSummary.Domain.Common;

// Success result
var successResult = Result.Success();
if (successResult.IsSuccess)
{
    Console.WriteLine("Operation succeeded");
}

// Success result with value
var employeeResult = Result.Success<Employee>(employee);
if (employeeResult.IsSuccess)
{
    var emp = employeeResult.Value;
    Console.WriteLine($"Got employee: {emp.GetFullName()}");
}

// Failure result
var failureResult = Result.Failure("Employee not found");
if (failureResult.IsFailure)
{
    Console.WriteLine($"Error: {failureResult.Error}");
}

// Failure result with type
var notFoundResult = Result.Failure<Employee>("Personnel number does not exist");
if (notFoundResult.IsFailure)
{
    Console.WriteLine($"Error: {notFoundResult.Error}");
}
```

### 6. Using Value Objects

```csharp
using TaxSummary.Domain.ValueObjects;

// Create personnel number (with validation)
var personnelNumber = PersonnelNumber.Create("EMP12345");
Console.WriteLine($"Personnel Number: {personnelNumber}");

// Implicit conversion to string
string numberString = personnelNumber;

// This will throw an exception (empty value)
try
{
    var invalid = PersonnelNumber.Create("");
}
catch (ArgumentException ex)
{
    Console.WriteLine($"Validation failed: {ex.Message}");
}
```

### 7. Domain Validation Examples

```csharp
// This will throw ArgumentException (negative years)
try
{
    var invalidEmployee = Employee.Create(
        personnelNumber: "EMP001",
        firstName: "Test",
        lastName: "User",
        education: "Bachelor",
        serviceUnit: "IT",
        currentPosition: "Developer",
        appointmentPosition: "Senior Developer",
        previousExperienceYears: -5  // Invalid!
    );
}
catch (ArgumentException ex)
{
    Console.WriteLine($"Validation failed: {ex.Message}");
}

// This will throw InvalidOperationException (exceeds annual limit)
try
{
    var invalidStatus = AdministrativeStatus.Create(
        employeeId: Guid.NewGuid(),
        missionDays: 400,  // Exceeds 365 days!
        incentiveHours: 100,
        delayAndAbsenceHours: 50,
        hourlyLeaveHours: 20
    );
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"Business rule violation: {ex.Message}");
}
```

---

## 🧪 Testing the Domain Layer

### Create a Test Console Application

```powershell
# In the Backend folder
dotnet new console -n TaxSummary.Domain.Playground
cd TaxSummary.Domain.Playground
dotnet add reference ../TaxSummary.Domain/TaxSummary.Domain.csproj
```

### Sample Program.cs

```csharp
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.ValueObjects;

Console.WriteLine("=== Tax Summary Domain Layer Test ===\n");

// Create employee
var employee = Employee.Create(
    personnelNumber: "123456",
    firstName: "محمد",
    lastName: "رضایی",
    education: "کارشناسی حسابداری",
    serviceUnit: "اداره کل مالیات",
    currentPosition: "کارشناس",
    appointmentPosition: "کارشناس ارشد",
    previousExperienceYears: 3
);

Console.WriteLine($"✓ Employee created: {employee.GetFullName()}");

// Add administrative status
var adminStatus = AdministrativeStatus.Create(
    employeeId: employee.Id,
    missionDays: 10,
    incentiveHours: 20,
    delayAndAbsenceHours: 5,
    hourlyLeaveHours: 8
);

employee.SetAdministrativeStatus(adminStatus);
Console.WriteLine($"✓ Administrative status added");
Console.WriteLine($"  Mission Days: {adminStatus.MissionDays}");
Console.WriteLine($"  Has Disciplinary Issues: {adminStatus.HasDisciplinaryIssues()}");

// Add performance capability
var capability = PerformanceCapability.Create(
    employeeId: employee.Id,
    systemRole: "کاربر سامانه",
    detectionOfTaxIssues: true,
    detectionOfTaxEvasion: false,
    companyIdentification: true,
    valueAddedRecognition: true,
    referredOrExecuted: true
);

employee.AddPerformanceCapability(capability);
Console.WriteLine($"✓ Performance capability added");
Console.WriteLine($"  System Role: {capability.SystemRole}");
Console.WriteLine($"  Capability Score: {capability.GetCapabilityScore()}/100");
Console.WriteLine($"  Active Capabilities: {string.Join(", ", capability.GetActiveCapabilities())}");

Console.WriteLine("\n=== Test Completed Successfully ===");
```

### Run the Test

```powershell
dotnet run
```

---

## 📋 Repository Interface Usage (Future)

When Phase 3 (Infrastructure) is implemented, you'll use repositories like this:

```csharp
// This is how it will work (implementation coming in Phase 3)
public class EmployeeService
{
    private readonly IEmployeeRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    
    public EmployeeService(IEmployeeRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }
    
    public async Task<Result<Employee>> CreateEmployeeAsync(/* parameters */)
    {
        // Create employee using domain factory
        var employee = Employee.Create(/* parameters */);
        
        // Check if personnel number already exists
        if (await _repository.ExistsByPersonnelNumberAsync(employee.PersonnelNumber))
        {
            return Result.Failure<Employee>("Personnel number already exists");
        }
        
        // Add to repository
        await _repository.AddAsync(employee);
        
        // Save changes
        await _unitOfWork.SaveChangesAsync();
        
        return Result.Success(employee);
    }
    
    public async Task<Result<Employee>> GetEmployeeAsync(Guid employeeId)
    {
        var employee = await _repository.GetByIdAsync(employeeId);
        
        if (employee == null)
        {
            return Result.Failure<Employee>("Employee not found");
        }
        
        return Result.Success(employee);
    }
}
```

---

## 🎯 Key Domain Rules to Remember

### Employee Rules
- ✅ Personnel number is required (max 50 chars)
- ✅ First name and last name are required
- ✅ Experience years: 0-60 range
- ✅ All text fields are trimmed automatically
- ✅ UpdatedAt timestamp on all changes

### Administrative Status Rules
- ✅ All values must be non-negative
- ✅ Mission days ≤ 365 per year
- ✅ Hours ≤ 8760 (annual limit)
- ✅ Disciplinary threshold: 40 hours delay/absence

### Performance Capability Rules
- ✅ System role is required
- ✅ Scoring: Tax Issues (20), Tax Evasion (25), Company ID (20), Value Added (20), Referred (15)
- ✅ Multiple capabilities per employee allowed

---

## 📚 Next Steps

### Ready for Phase 2: Application Layer

The next phase will add:
1. **DTOs** - Data Transfer Objects for API communication
2. **Use Cases** - Commands and Queries (CQRS pattern)
3. **Services** - Application services for orchestration
4. **Validators** - FluentValidation for input validation
5. **Mapping** - AutoMapper for entity-DTO conversion

### To Proceed with Phase 2:
```
Refer to clean_architecture_plan.md - Phase 2 section
```

---

## 🔗 Useful Links

- [Main README](./README.md) - Project overview
- [Phase 1 Completion Summary](./PHASE1_COMPLETION_SUMMARY.md) - Detailed report
- [Clean Architecture Plan](./clean_architecture_plan.md) - Full implementation plan
- [Backend README](./Backend/README.md) - Backend documentation
- [Domain README](./Backend/TaxSummary.Domain/README.md) - Domain layer details

---

## ✅ Checklist Before Moving to Phase 2

- [x] Domain entities implemented
- [x] Business logic in domain layer
- [x] Repository interfaces defined
- [x] Value objects created
- [x] Domain exceptions defined
- [x] Result pattern implemented
- [x] Build succeeds with 0 warnings
- [x] Documentation completed
- [ ] Unit tests for domain logic (optional, can do later)

**You are ready to proceed with Phase 2!** 🎉

---

**Last Updated:** February 8, 2026
