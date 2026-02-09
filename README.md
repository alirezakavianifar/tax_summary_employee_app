# Tax Summary Employee Application

## Persian RTL Form System with Clean Architecture

A professional application for managing tax employee performance forms with exact print layout, built using Clean Architecture principles with ASP.NET Core backend and Next.js frontend.

---

## 🎯 Project Overview

This application manages employee performance evaluation forms for tax administration, with the following key features:

- **Persian/Farsi Language Support** with RTL layout
- **Exact Print Layout** matching physical forms (A4)
- **Clean Architecture** implementation
- **Separated Backend (ASP.NET Core) and Frontend (Next.js)**

---

## 📊 Implementation Status

### ✅ Phase 1: Domain Layer - COMPLETED
**Status:** Fully Implemented and Verified  
**Date Completed:** February 8, 2026

The Domain Layer has been fully implemented with:
- ✅ 3 Domain Entities (Employee, AdministrativeStatus, PerformanceCapability)
- ✅ 1 Value Object (PersonnelNumber)
- ✅ 2 Repository Interfaces (IEmployeeRepository, IUnitOfWork)
- ✅ Result Pattern for error handling
- ✅ Domain Exception hierarchy
- ✅ Comprehensive business logic and validation
- ✅ Zero external dependencies
- ✅ Full Persian language support

**Documentation:** [`PHASE1_COMPLETION_SUMMARY.md`](./PHASE1_COMPLETION_SUMMARY.md)

### ✅ Phase 2: Application Layer - COMPLETED
**Status:** Fully Implemented and Verified
**Date Completed:** February 8, 2026

The Application Layer has been fully implemented with:
- ✅ 6 DTOs (Data Transfer Objects)
- ✅ Application Service with 9 methods
- ✅ 3 Validators with FluentValidation (Persian messages)
- ✅ AutoMapper Configuration
- ✅ Transaction management
- ✅ Result pattern integration
- ✅ Full Persian error messages

**Documentation:** [`PHASE2_COMPLETION_SUMMARY.md`](./PHASE2_COMPLETION_SUMMARY.md)

### ✅ Phase 3: Infrastructure Layer - COMPLETED
**Status:** Fully Implemented and Verified
**Date Completed:** February 8, 2026

The Infrastructure Layer has been fully implemented with:
- ✅ EF Core DbContext with SQL Server
- ✅ 3 Entity Configurations (Fluent API)
- ✅ EmployeeRepository (10 methods)
- ✅ Unit of Work implementation
- ✅ Database initializer with seed data
- ✅ 8 strategic indexes
- ✅ Cascade delete relationships
- ✅ Transaction support

**Documentation:** [`PHASE3_COMPLETION_SUMMARY.md`](./PHASE3_COMPLETION_SUMMARY.md)

### ✅ Phase 4: API Layer - COMPLETED
**Status:** Fully Implemented and Verified
**Date Completed:** February 8, 2026

The API Layer has been fully implemented with:
- ✅ EmployeeReportsController (10 REST endpoints)
- ✅ Exception handling middleware
- ✅ Complete DI configuration
- ✅ CORS for frontend integration
- ✅ Swagger/OpenAPI documentation
- ✅ Health checks
- ✅ Structured logging
- ✅ Persian error messages

**Documentation:** [`PHASE4_COMPLETION_SUMMARY.md`](./PHASE4_COMPLETION_SUMMARY.md)

### ✅ Phase 5: Frontend Layer - FOUNDATION COMPLETE
**Status:** Core Implemented (Print layout needs font files)
**Date Started:** February 8, 2026

The Frontend foundation has been implemented with:
- ✅ Next.js 14 App Router setup
- ✅ TypeScript configuration
- ✅ Tailwind CSS with RTL support
- ✅ Persian font configuration (Vazirmatn)
- ✅ API client with Axios
- ✅ Home page
- ✅ Reports list page
- ✅ Create report form
- ⏳ Print layout (requires font files)
- ⏳ Report detail view
- ⏳ Edit/Delete functionality

**Next Steps:** Download Persian fonts and implement print layout

---

## 🏗️ Architecture Overview

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
│  Application Layer ✅ COMPLETED         │
│   (Use Cases, DTOs, Interfaces)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Domain Layer ✅ COMPLETED            │
│  (Entities, Business Logic, Rules)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (EF Core, Repositories, SQL Server)    │
└─────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
tax_summary_employee_app/
├── README.md                              # This file
├── AGENTS.md                              # Agent instructions for git operations
├── .gitignore                             # Git ignore file
├── clean_architecture_plan.md             # Complete implementation plan
├── PHASE1_COMPLETION_SUMMARY.md          # Phase 1 completion report
├── plan.md                                # Original project plan
│
├── Backend/                               # ASP.NET Core Backend
│   ├── TaxSummary.sln                    # Solution file
│   ├── README.md                         # Backend documentation
│   │
│   ├── TaxSummary.Domain/                # ✅ Phase 1 - COMPLETED
│   │   ├── Common/
│   │   │   ├── Result.cs
│   │   │   └── ValueObject.cs
│   │   ├── Entities/
│   │   │   ├── Employee.cs
│   │   │   ├── AdministrativeStatus.cs
│   │   │   └── PerformanceCapability.cs
│   │   ├── ValueObjects/
│   │   │   └── PersonnelNumber.cs
│   │   ├── Interfaces/
│   │   │   ├── IEmployeeRepository.cs
│   │   │   └── IUnitOfWork.cs
│   │   ├── Exceptions/
│   │   │   └── DomainException.cs
│   │   └── README.md
│   │
│   ├── TaxSummary.Application/           # ✅ Phase 2 - COMPLETED
│   │   ├── DTOs/
│   │   │   ├── EmployeeDto.cs
│   │   │   ├── AdministrativeStatusDto.cs
│   │   │   ├── PerformanceCapabilityDto.cs
│   │   │   ├── EmployeeReportDto.cs
│   │   │   ├── CreateEmployeeReportDto.cs
│   │   │   └── UpdateEmployeeReportDto.cs
│   │   ├── Services/
│   │   │   ├── IEmployeeReportService.cs
│   │   │   └── EmployeeReportService.cs
│   │   ├── Validators/
│   │   │   ├── CreateEmployeeReportValidator.cs
│   │   │   └── UpdateEmployeeReportValidator.cs
│   │   ├── Mapping/
│   │   │   └── MappingProfile.cs
│   │   └── README.md
│   │
│   ├── TaxSummary.Infrastructure/        # Phase 3 - TODO
│   └── TaxSummary.Api/                   # Phase 4 - TODO
│
└── Frontend/                              # Phase 5 - TODO
    └── (Next.js application)
```

---

## 🚀 Getting Started

### Prerequisites

- **.NET 8.0 SDK** or later
- **Node.js 18+** and npm (for frontend, when implemented)
- **SQL Server 2019+** (for database, when implemented)
- **Visual Studio 2022** or **VS Code** with C# extension

### Building the Current Implementation

```powershell
# Navigate to Backend directory
cd Backend

# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Output: Build succeeded (0 warnings, 0 errors)
```

---

## 🎨 Domain Model

### Employee Entity
The core entity representing an employee with:
- Personal information (name, personnel number, education)
- Position information (current and appointment positions)
- Service details (unit, experience years)
- Related administrative status
- Multiple performance capabilities

### AdministrativeStatus Entity
Tracks employee administrative performance:
- Mission days
- Incentive hours
- Delay and absence hours
- Hourly leave hours
- Disciplinary issue detection

### PerformanceCapability Entity
Represents employee capabilities:
- System role
- Detection of tax issues
- Detection of tax evasion
- Company identification
- Value added recognition
- Referred or executed status
- Performance scoring

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [`README.md`](./README.md) | This file - Project overview |
| [`clean_architecture_plan.md`](./clean_architecture_plan.md) | Complete implementation plan (all phases) |
| [`PHASE1_COMPLETION_SUMMARY.md`](./PHASE1_COMPLETION_SUMMARY.md) | Phase 1 detailed completion report |
| [`Backend/README.md`](./Backend/README.md) | Backend-specific documentation |
| [`Backend/TaxSummary.Domain/README.md`](./Backend/TaxSummary.Domain/README.md) | Domain layer documentation |
| [`AGENTS.md`](./AGENTS.md) | Agent instructions for git operations |

---

## 🛠️ Technology Stack

### Backend (Current/Planned)
| Layer | Technology |
|-------|-----------|
| **Domain** | C# 11, .NET 8.0 ✅ |
| **Application** | MediatR, FluentValidation, AutoMapper |
| **Infrastructure** | EF Core 8+, SQL Server 2019+ |
| **API** | ASP.NET Core 8+, Swagger |

### Frontend (Planned)
| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+, TypeScript |
| **Styling** | TailwindCSS |
| **Font** | Vazirmatn (Persian) |
| **State** | React Context/Zustand |

### Testing (Planned)
| Type | Technology |
|------|-----------|
| **Unit Tests** | xUnit, Moq |
| **Integration Tests** | WebApplicationFactory |
| **E2E Tests** | Playwright |

---

## 🎯 Key Features (Planned)

### Form Management
- Create, read, update employee performance forms
- Multi-section form with validation
- Persian text support throughout

### Print Layout
- Exact A4 layout matching physical forms
- Print-optimized CSS
- QR code generation
- Photo upload support

### User Roles
- Admin: Full access
- Manager: Department access
- Employee: View only

### Reporting
- Employee performance reports
- Service unit summaries
- Export to PDF

---

## 🔒 Security Considerations (Planned)

- JWT-based authentication
- Role-based authorization
- HTTPS enforcement
- CORS configuration
- SQL injection prevention (EF Core)
- XSS protection

---

## 🧪 Testing Strategy (Planned)

### Unit Tests
- Domain entity logic
- Business rule validation
- Value object behavior

### Integration Tests
- Repository operations
- API endpoints
- Database interactions

### E2E Tests
- Complete user workflows
- Print layout verification
- Cross-browser testing

---

## 📈 Development Roadmap

### ✅ Phase 1: Domain Layer (2 weeks) - COMPLETED
- Domain entities with business logic
- Repository interfaces
- Value objects and domain exceptions

### 📋 Phase 2: Application Layer (2 weeks)
- DTOs and AutoMapper profiles
- CQRS pattern (Commands/Queries)
- Application services
- FluentValidation

### 📋 Phase 3: Infrastructure Layer (2 weeks)
- EF Core DbContext setup
- Repository implementations
- Database migrations
- SQL Server configuration

### 📋 Phase 4: API Layer (1 week)
- ASP.NET Core controllers
- Middleware configuration
- Swagger/OpenAPI documentation
- Authentication setup

### 📋 Phase 5: Frontend Layer (3 weeks)
- Next.js setup with RTL
- Persian font integration
- Form components
- **Critical:** Print layout (1 week dedicated)

### 📋 Phase 6: Testing & Polish (2 weeks)
- Unit tests
- Integration tests
- E2E tests
- Performance optimization

### 📋 Phase 7: Deployment (1 week)
- Backend deployment (Azure/IIS)
- Frontend deployment (Vercel/Azure)
- Production configuration
- Monitoring setup

**Total Estimated Timeline:** 13 weeks

---

## 🤝 Contributing

When contributing to this project:

1. Follow Clean Architecture principles
2. Maintain separation of concerns
3. Write comprehensive tests
4. Document all public APIs
5. Support Persian text throughout
6. Follow existing code patterns

---

## 📝 Git Workflow

The project uses the following git workflow as defined in [`AGENTS.md`](./AGENTS.md):

**Remote Repository:**
```
https://github.com/alirezakavianifar/tax_summary_employee_app.git
```

**Push Workflow:**
1. Stage changes: `git add .`
2. Commit with descriptive message
3. Push to remote: `git push`

---

## 📞 Support

For questions or issues:
- Review the documentation in this repository
- Check the implementation plan: `clean_architecture_plan.md`
- Review phase completion summaries

---

## 📜 License

Internal use only - Tax Summary Employee Application

---

## 🎉 Acknowledgments

- Clean Architecture principles by Robert C. Martin
- Domain-Driven Design by Eric Evans
- ASP.NET Core team
- Next.js team
- Persian font creators (Vazirmatn)

---

**Current Status:** Phase 1 Complete ✅ | Ready for Phase 2 Development

**Last Updated:** February 8, 2026
