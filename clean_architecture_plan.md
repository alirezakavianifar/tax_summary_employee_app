# Clean Architecture Plan - Tax Summary Employee Application

## Overview

This document provides a step-by-step implementation plan following Clean Architecture principles for the Tax Summary Employee Application (Persian RTL form system with exact print layout).

---

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│      (Next.js - App Router)             │
└─────────────────────────────────────────┘
                  ↓ HTTP/REST
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
│         Domain Layer                    │
│  (Entities, Business Logic, Rules)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (EF Core, Repositories, SQL Server)    │
└─────────────────────────────────────────┘
```

---

## Phase 1: Domain Layer (Core Business Logic) ✅ COMPLETED

**Status:** ✅ Fully Implemented
**Date Completed:** February 8, 2026
**Documentation:** See `PHASE1_COMPLETION_SUMMARY.md` for detailed implementation report

### Step 1.1: Create Domain Entities

**Location:** `Backend/TaxSummary.Domain/Entities/`

#### Employee Entity
```csharp
public class Employee
{
    public Guid Id { get; private set; }
    public string PersonnelNumber { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Education { get; private set; }
    public string ServiceUnit { get; private set; }
    public string CurrentPosition { get; private set; }
    public string AppointmentPosition { get; private set; }
    public int PreviousExperienceYears { get; private set; }
    public DateTime CreatedAt { get; private set; }
    
    // Navigation Properties
    public AdministrativeStatus AdministrativeStatus { get; private set; }
    public ICollection<PerformanceCapability> PerformanceCapabilities { get; private set; }
    
    // Domain Methods
    public void UpdatePersonalInfo(...) { }
    public void UpdatePosition(...) { }
}
```

#### AdministrativeStatus Entity
```csharp
public class AdministrativeStatus
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public int MissionDays { get; private set; }
    public int IncentiveHours { get; private set; }
    public int DelayAndAbsenceHours { get; private set; }
    public int HourlyLeaveHours { get; private set; }
    
    // Navigation
    public Employee Employee { get; private set; }
    
    // Domain Methods
    public void UpdateStatus(...) { }
    public bool IsValid() { }
}
```

#### PerformanceCapability Entity
```csharp
public class PerformanceCapability
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public string SystemRole { get; private set; }
    public bool DetectionOfTaxIssues { get; private set; }
    public bool DetectionOfTaxEvasion { get; private set; }
    public bool CompanyIdentification { get; private set; }
    public bool ValueAddedRecognition { get; private set; }
    public bool ReferredOrExecuted { get; private set; }
    
    // Navigation
    public Employee Employee { get; private set; }
    
    // Domain Methods
    public void UpdateCapabilities(...) { }
}
```

### Step 1.2: Define Domain Interfaces

**Location:** `Backend/TaxSummary.Domain/Interfaces/`

```csharp
public interface IEmployeeRepository
{
    Task<Employee> GetByIdAsync(Guid id);
    Task<Employee> GetByPersonnelNumberAsync(string personnelNumber);
    Task<IEnumerable<Employee>> GetAllAsync();
    Task<Employee> AddAsync(Employee employee);
    Task UpdateAsync(Employee employee);
    Task DeleteAsync(Guid id);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
```

### Step 1.3: Create Value Objects (Optional but Recommended)

**Location:** `Backend/TaxSummary.Domain/ValueObjects/`

```csharp
public class PersonnelNumber : ValueObject
{
    public string Value { get; private set; }
    
    private PersonnelNumber(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Personnel number cannot be empty");
        Value = value;
    }
    
    public static PersonnelNumber Create(string value) => new(value);
}
```

---

## Phase 2: Application Layer (Use Cases & Business Rules) ✅ COMPLETED

**Status:** ✅ Fully Implemented
**Date Completed:** February 8, 2026
**Documentation:** See `PHASE2_COMPLETION_SUMMARY.md` for detailed implementation report

### Step 2.1: Create DTOs

**Location:** `Backend/TaxSummary.Application/DTOs/`

```csharp
public class EmployeeDto
{
    public Guid Id { get; set; }
    public string PersonnelNumber { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Education { get; set; }
    public string ServiceUnit { get; set; }
    public string CurrentPosition { get; set; }
    public string AppointmentPosition { get; set; }
    public int PreviousExperienceYears { get; set; }
}

public class AdministrativeStatusDto
{
    public Guid Id { get; set; }
    public int MissionDays { get; set; }
    public int IncentiveHours { get; set; }
    public int DelayAndAbsenceHours { get; set; }
    public int HourlyLeaveHours { get; set; }
}

public class PerformanceCapabilityDto
{
    public Guid Id { get; set; }
    public string SystemRole { get; set; }
    public bool DetectionOfTaxIssues { get; set; }
    public bool DetectionOfTaxEvasion { get; set; }
    public bool CompanyIdentification { get; set; }
    public bool ValueAddedRecognition { get; set; }
    public bool ReferredOrExecuted { get; set; }
}

public class EmployeeReportDto
{
    public EmployeeDto Employee { get; set; }
    public AdministrativeStatusDto AdminStatus { get; set; }
    public List<PerformanceCapabilityDto> Capabilities { get; set; }
}
```

### Step 2.2: Create Use Cases (Command/Query Pattern)

**Location:** `Backend/TaxSummary.Application/UseCases/`

#### Commands
```csharp
// CreateEmployeeReport/CreateEmployeeReportCommand.cs
public record CreateEmployeeReportCommand(
    EmployeeDto Employee,
    AdministrativeStatusDto AdminStatus,
    List<PerformanceCapabilityDto> Capabilities
);

// CreateEmployeeReport/CreateEmployeeReportHandler.cs
public class CreateEmployeeReportHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    
    public async Task<Result<Guid>> Handle(CreateEmployeeReportCommand command)
    {
        // Validation
        // Create domain entities
        // Save to repository
        // Commit unit of work
    }
}
```

#### Queries
```csharp
// GetEmployeeReport/GetEmployeeReportQuery.cs
public record GetEmployeeReportQuery(Guid EmployeeId);

// GetEmployeeReport/GetEmployeeReportHandler.cs
public class GetEmployeeReportHandler
{
    private readonly IEmployeeRepository _employeeRepository;
    
    public async Task<Result<EmployeeReportDto>> Handle(GetEmployeeReportQuery query)
    {
        // Fetch from repository
        // Map to DTO
        // Return
    }
}
```

### Step 2.3: Create Application Services

**Location:** `Backend/TaxSummary.Application/Services/`

```csharp
public interface IEmployeeReportService
{
    Task<Result<EmployeeReportDto>> GetReportAsync(Guid employeeId);
    Task<Result<Guid>> CreateReportAsync(CreateEmployeeReportCommand command);
    Task<Result> UpdateReportAsync(Guid employeeId, UpdateEmployeeReportCommand command);
    Task<Result<IEnumerable<EmployeeDto>>> GetAllEmployeesAsync();
}

public class EmployeeReportService : IEmployeeReportService
{
    private readonly IEmployeeRepository _repository;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    
    // Implementation
}
```

### Step 2.4: Create Validators

**Location:** `Backend/TaxSummary.Application/Validators/`

```csharp
public class CreateEmployeeReportValidator : AbstractValidator<CreateEmployeeReportCommand>
{
    public CreateEmployeeReportValidator()
    {
        RuleFor(x => x.Employee.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Employee.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Employee.PersonnelNumber).NotEmpty().MaximumLength(50);
        // Add more rules
    }
}
```

---

## Phase 3: Infrastructure Layer (Data Access) ✅ COMPLETED

**Status:** ✅ Fully Implemented
**Date Completed:** February 8, 2026
**Documentation:** See `PHASE3_COMPLETION_SUMMARY.md` for detailed implementation report

### Step 3.1: Setup EF Core DbContext

**Location:** `Backend/TaxSummary.Infrastructure/Data/`

```csharp
public class TaxSummaryDbContext : DbContext
{
    public DbSet<Employee> Employees { get; set; }
    public DbSet<AdministrativeStatus> AdministrativeStatuses { get; set; }
    public DbSet<PerformanceCapability> PerformanceCapabilities { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaxSummaryDbContext).Assembly);
    }
}
```

### Step 3.2: Create Entity Configurations

**Location:** `Backend/TaxSummary.Infrastructure/Data/Configurations/`

```csharp
public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.PersonnelNumber)
            .IsRequired()
            .HasMaxLength(50)
            .HasColumnType("NVARCHAR");
        
        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnType("NVARCHAR");
        
        // Configure relationships
        builder.HasOne(e => e.AdministrativeStatus)
            .WithOne(a => a.Employee)
            .HasForeignKey<AdministrativeStatus>(a => a.EmployeeId);
        
        builder.HasMany(e => e.PerformanceCapabilities)
            .WithOne(p => p.Employee)
            .HasForeignKey(p => p.EmployeeId);
    }
}
```

### Step 3.3: Implement Repositories

**Location:** `Backend/TaxSummary.Infrastructure/Repositories/`

```csharp
public class EmployeeRepository : IEmployeeRepository
{
    private readonly TaxSummaryDbContext _context;
    
    public EmployeeRepository(TaxSummaryDbContext context)
    {
        _context = context;
    }
    
    public async Task<Employee> GetByIdAsync(Guid id)
    {
        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .FirstOrDefaultAsync(e => e.Id == id);
    }
    
    public async Task<IEnumerable<Employee>> GetAllAsync()
    {
        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .ToListAsync();
    }
    
    // Other implementations
}
```

### Step 3.4: Implement Unit of Work

**Location:** `Backend/TaxSummary.Infrastructure/Data/`

```csharp
public class UnitOfWork : IUnitOfWork
{
    private readonly TaxSummaryDbContext _context;
    private IDbContextTransaction _transaction;
    
    public UnitOfWork(TaxSummaryDbContext context)
    {
        _context = context;
    }
    
    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
    
    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }
    
    public async Task CommitTransactionAsync()
    {
        await _transaction.CommitAsync();
    }
    
    public async Task RollbackTransactionAsync()
    {
        await _transaction.RollbackAsync();
    }
}
```

---

## Phase 4: API Layer (Controllers & Middleware)

### Step 4.1: Create Controllers

**Location:** `Backend/TaxSummary.Api/Controllers/`

```csharp
[ApiController]
[Route("api/[controller]")]
public class EmployeeReportsController : ControllerBase
{
    private readonly IEmployeeReportService _reportService;
    private readonly ILogger<EmployeeReportsController> _logger;
    
    public EmployeeReportsController(
        IEmployeeReportService reportService,
        ILogger<EmployeeReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }
    
    [HttpGet("{employeeId}")]
    [ProducesResponseType(typeof(EmployeeReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeReportDto>> GetReport(Guid employeeId)
    {
        var result = await _reportService.GetReportAsync(employeeId);
        
        if (result.IsFailure)
            return NotFound(result.Error);
        
        return Ok(result.Value);
    }
    
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateReport([FromBody] CreateEmployeeReportCommand command)
    {
        var result = await _reportService.CreateReportAsync(command);
        
        if (result.IsFailure)
            return BadRequest(result.Error);
        
        return CreatedAtAction(nameof(GetReport), new { employeeId = result.Value }, result.Value);
    }
    
    [HttpPut("{employeeId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> UpdateReport(Guid employeeId, [FromBody] UpdateEmployeeReportCommand command)
    {
        var result = await _reportService.UpdateReportAsync(employeeId, command);
        
        if (result.IsFailure)
            return BadRequest(result.Error);
        
        return NoContent();
    }
    
    [HttpGet("employees")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAllEmployees()
    {
        var result = await _reportService.GetAllEmployeesAsync();
        return Ok(result.Value);
    }
}
```

### Step 4.2: Configure Dependency Injection

**Location:** `Backend/TaxSummary.Api/Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add DbContext
builder.Services.AddDbContext<TaxSummaryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("TaxSummary.Infrastructure")));

// Register repositories
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register application services
builder.Services.AddScoped<IEmployeeReportService, EmployeeReportService>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Add validators
builder.Services.AddValidatorsFromAssemblyContaining<CreateEmployeeReportValidator>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* configuration */ });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

var app = builder.Build();

app.UseCors("AllowNextJS");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### Step 4.3: Create Middleware

**Location:** `Backend/TaxSummary.Api/Middleware/`

```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        
        return context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            error = "An error occurred processing your request"
        }));
    }
}
```

---

## Phase 5: Frontend Layer (Next.js)

### Step 5.1: Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with RTL
│   ├── page.tsx                # Home page
│   ├── reports/
│   │   ├── page.tsx            # Reports list
│   │   └── [employeeId]/
│   │       ├── page.tsx        # View report
│   │       └── print/
│   │           └── page.tsx    # Print layout
│   └── admin/
│       ├── employees/
│       │   └── page.tsx
│       └── reports/
│           └── page.tsx
├── components/
│   ├── report/
│   │   ├── ReportHeader.tsx
│   │   ├── PersonalInfo.tsx
│   │   ├── AdministrativeStatus.tsx
│   │   └── PerformanceCapabilities.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Input.tsx
├── lib/
│   ├── api/
│   │   └── reportService.ts
│   ├── types/
│   │   └── report.types.ts
│   └── utils/
│       └── helpers.ts
└── styles/
    ├── globals.css
    └── print.css
```

### Step 5.2: Setup Root Layout (RTL + Persian Font)

**Location:** `frontend/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const vazirmatn = localFont({
  src: '../public/fonts/Vazirmatn-Regular.woff2',
  variable: '--font-vazirmatn'
});

export const metadata: Metadata = {
  title: 'فرم وضعیت داوطلبین',
  description: 'سامانه مدیریت فرم‌های داوطلبین ارتقاء و انتصاب'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.variable}>
        {children}
      </body>
    </html>
  );
}
```

### Step 5.3: Create API Service Layer

**Location:** `frontend/lib/api/reportService.ts`

```typescript
import { EmployeeReportDto, CreateEmployeeReportDto } from '../types/report.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ReportService {
  static async getReport(employeeId: string): Promise<EmployeeReportDto> {
    const response = await fetch(`${API_BASE_URL}/employeereports/${employeeId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    
    return response.json();
  }
  
  static async createReport(data: CreateEmployeeReportDto): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/employeereports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create report');
    }
    
    return response.json();
  }
  
  static async updateReport(employeeId: string, data: CreateEmployeeReportDto): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/employeereports/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update report');
    }
  }
  
  static async getAllEmployees(): Promise<EmployeeDto[]> {
    const response = await fetch(`${API_BASE_URL}/employeereports/employees`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    
    return response.json();
  }
}
```

### Step 5.4: Create Type Definitions

**Location:** `frontend/lib/types/report.types.ts`

```typescript
export interface EmployeeDto {
  id: string;
  personnelNumber: string;
  firstName: string;
  lastName: string;
  education: string;
  serviceUnit: string;
  currentPosition: string;
  appointmentPosition: string;
  previousExperienceYears: number;
}

export interface AdministrativeStatusDto {
  id: string;
  missionDays: number;
  incentiveHours: number;
  delayAndAbsenceHours: number;
  hourlyLeaveHours: number;
}

export interface PerformanceCapabilityDto {
  id: string;
  systemRole: string;
  detectionOfTaxIssues: boolean;
  detectionOfTaxEvasion: boolean;
  companyIdentification: boolean;
  valueAddedRecognition: boolean;
  referredOrExecuted: boolean;
}

export interface EmployeeReportDto {
  employee: EmployeeDto;
  adminStatus: AdministrativeStatusDto;
  capabilities: PerformanceCapabilityDto[];
}

export type CreateEmployeeReportDto = Omit<EmployeeReportDto, 'employee.id' | 'adminStatus.id'>;
```

### Step 5.5: Create Print Layout Page

**Location:** `frontend/app/reports/[employeeId]/print/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReportService } from '@/lib/api/reportService';
import { EmployeeReportDto } from '@/lib/types/report.types';
import '@/styles/print.css';

export default function PrintReportPage() {
  const params = useParams();
  const [report, setReport] = useState<EmployeeReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await ReportService.getReport(params.employeeId as string);
        setReport(data);
        setLoading(false);
        
        // Auto-trigger print dialog
        setTimeout(() => window.print(), 500);
      } catch (error) {
        console.error('Failed to load report:', error);
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [params.employeeId]);
  
  if (loading) return <div>در حال بارگذاری...</div>;
  if (!report) return <div>گزارش یافت نشد</div>;
  
  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-title">
        فرم وضعیت داوطلبین ارتقاء و انتصاب به سطوح مدیریتی
      </div>
      
      {/* QR Code and Photo Row */}
      <div className="metadata-row">
        <div className="qr-section">
          {/* QR Code placeholder */}
        </div>
        <div className="photo-box">
          عکس
        </div>
      </div>
      
      {/* Personal Information Table */}
      <table className="info-table">
        <tbody>
          <tr>
            <td>
              <div className="label">نام</div>
              <div className="value">{report.employee.firstName || ''}</div>
            </td>
            <td>
              <div className="label">نام خانوادگی</div>
              <div className="value">{report.employee.lastName || ''}</div>
            </td>
            <td>
              <div className="label">شماره پرسنلی</div>
              <div className="value">{report.employee.personnelNumber || ''}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="label">مدرک و رشته تحصیلی</div>
              <div className="value">{report.employee.education || ''}</div>
            </td>
            <td>
              <div className="label">واحد محل خدمت</div>
              <div className="value">{report.employee.serviceUnit || ''}</div>
            </td>
            <td>
              <div className="label">سوابق خدمتی</div>
              <div className="value">{report.employee.previousExperienceYears || ''}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="label">پست سازمانی فعلی</div>
              <div className="value">{report.employee.currentPosition || ''}</div>
            </td>
            <td>
              <div className="label">پست سازمانی موضوع انتصاب</div>
              <div className="value">{report.employee.appointmentPosition || ''}</div>
            </td>
            <td>
              <div className="label">تجربه در سمت قبلی (سال)</div>
              <div className="value">{report.employee.previousExperienceYears || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Administrative Status Section */}
      <div className="section-title">وضعیت نظم و انضباط اداری</div>
      <table className="info-table">
        <tbody>
          <tr>
            <td>
              <div className="label">استحقاقی</div>
              <div className="value">{report.adminStatus.missionDays || ''}</div>
            </td>
            <td>
              <div className="label">استعلاجی</div>
              <div className="value">{report.adminStatus.incentiveHours || ''}</div>
            </td>
            <td>
              <div className="label">ماموریت</div>
              <div className="value">{report.adminStatus.delayAndAbsenceHours || ''}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div className="label">مرخصی ساعتی مجاز</div>
              <div className="value">{report.adminStatus.hourlyLeaveHours || ''}</div>
            </td>
            <td colSpan={2}>
              {/* Additional fields */}
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Performance Capabilities Section */}
      <div className="section-title">توانمندی‌های عملکردی در سال جاری</div>
      <table className="capabilities-table">
        <thead>
          <tr>
            <th>وصول</th>
            <th>تشخیص شرکت/مالیات</th>
            <th>نقش در سامانه سنیم</th>
          </tr>
        </thead>
        <tbody>
          {report.capabilities.map((capability) => (
            <tr key={capability.id}>
              <td>{capability.referredOrExecuted ? '✓' : ''}</td>
              <td>{capability.companyIdentification ? '✓' : ''}</td>
              <td>{capability.systemRole || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 5.6: Create Print CSS

**Location:** `frontend/styles/print.css`

```css
@page {
  size: A4;
  margin: 0;
}

@media print {
  body {
    margin: 0;
    padding: 0;
  }
  
  .report-container {
    width: 210mm;
    height: 297mm;
    padding: 10mm;
    box-sizing: border-box;
    font-family: var(--font-vazirmatn), 'Vazirmatn', sans-serif;
    font-size: 12px;
  }
  
  .report-title {
    width: 100%;
    text-align: center;
    background: #d9d9d9;
    font-weight: bold;
    padding: 8px;
    margin-bottom: 10px;
    font-size: 14px;
  }
  
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }
  
  .info-table td,
  .info-table th {
    border: 1px solid #000;
    padding: 6px;
    text-align: right;
    vertical-align: top;
  }
  
  .label {
    font-size: 10px;
    color: #666;
    margin-bottom: 2px;
  }
  
  .value {
    font-size: 12px;
    font-weight: 600;
    min-height: 18px;
  }
  
  .section-title {
    background: #d9d9d9;
    font-weight: bold;
    padding: 6px;
    text-align: right;
    margin-top: 10px;
    margin-bottom: 5px;
  }
  
  .photo-box {
    width: 40mm;
    height: 50mm;
    border: 1px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #999;
  }
  
  /* Hide interactive elements */
  button,
  input,
  select,
  textarea {
    display: none !important;
  }
}
```

---

## Phase 6: Database Migrations

### Step 6.1: Create Initial Migration

```bash
cd Backend/TaxSummary.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../TaxSummary.Api
```

### Step 6.2: Update Database

```bash
dotnet ef database update --startup-project ../TaxSummary.Api
```

---

## Phase 7: Testing Strategy

### Step 7.1: Unit Tests (Domain Layer)

**Location:** `Backend/Tests/TaxSummary.Domain.Tests/`

```csharp
public class EmployeeTests
{
    [Fact]
    public void UpdatePersonalInfo_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var employee = new Employee(...);
        
        // Act
        employee.UpdatePersonalInfo("NewFirstName", "NewLastName");
        
        // Assert
        Assert.Equal("NewFirstName", employee.FirstName);
    }
}
```

### Step 7.2: Integration Tests (API Layer)

**Location:** `Backend/Tests/TaxSummary.Api.Tests/`

```csharp
public class EmployeeReportsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    
    public EmployeeReportsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task GetReport_ValidId_ReturnsOk()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        
        // Act
        var response = await _client.GetAsync($"/api/employeereports/{employeeId}");
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### Step 7.3: Frontend Tests

**Location:** `frontend/__tests__/`

```typescript
import { render, screen } from '@testing-library/react';
import PrintReportPage from '@/app/reports/[employeeId]/print/page';

describe('Print Report Page', () => {
  it('renders report title correctly', () => {
    render(<PrintReportPage />);
    const title = screen.getByText(/فرم وضعیت داوطلبین/i);
    expect(title).toBeInTheDocument();
  });
});
```

---

## Phase 8: Deployment

### Step 8.1: Backend Deployment Checklist

- [ ] Configure production connection string
- [ ] Setup HTTPS certificates
- [ ] Configure CORS for production domain
- [ ] Enable logging (Serilog recommended)
- [ ] Setup health checks
- [ ] Configure API versioning
- [ ] Setup rate limiting
- [ ] Configure authentication (JWT/Windows Auth)

### Step 8.2: Frontend Deployment Checklist

- [ ] Set production API URL
- [ ] Optimize fonts for production
- [ ] Test print layout on multiple browsers
- [ ] Enable error tracking (Sentry)
- [ ] Configure CSP headers
- [ ] Optimize build size
- [ ] Setup CDN for static assets

---

## Summary: Development Order

1. **Week 1-2: Backend Foundation**
   - Setup domain entities
   - Create repositories and unit of work
   - Setup EF Core and migrations

2. **Week 3-4: Application Layer**
   - Implement use cases
   - Create DTOs and validators
   - Build application services

3. **Week 5: API Layer**
   - Create controllers
   - Setup middleware
   - Configure DI and authentication

4. **Week 6-7: Frontend Foundation**
   - Setup Next.js with RTL
   - Create API service layer
   - Build basic components

5. **Week 8-9: Print Layout (Critical)**
   - Design exact print layout
   - Test on multiple browsers
   - Fine-tune CSS for A4

6. **Week 10: Testing & Polish**
   - Write unit tests
   - Integration testing
   - User acceptance testing

7. **Week 11: Deployment**
   - Deploy backend to Azure/IIS
   - Deploy frontend to Vercel/Azure
   - Final testing in production

---

## Key Success Factors

1. **Print Layout First**: Design and lock the print CSS early
2. **Persian Font**: Use high-quality Persian fonts with proper licensing
3. **Fixed Dimensions**: All table cells must have fixed heights
4. **Browser Testing**: Test printing on Chrome, Edge, and Firefox
5. **Data Validation**: Strong validation at all layers
6. **UTF-8 Everywhere**: Ensure proper Persian text handling
7. **Performance**: Optimize for quick report generation
8. **Security**: Role-based access control from the start

---

## Tools & Technologies Summary

| Layer | Technology |
|-------|-----------|
| **Domain** | C# 11, .NET 7+ |
| **Application** | MediatR (optional), FluentValidation, AutoMapper |
| **Infrastructure** | EF Core 7+, SQL Server 2019+ |
| **API** | ASP.NET Core 7+, Swagger |
| **Frontend** | Next.js 14+, TypeScript, TailwindCSS |
| **Testing** | xUnit, Moq, Jest, React Testing Library |
| **CI/CD** | GitHub Actions, Azure DevOps |

---

**End of Clean Architecture Plan**
