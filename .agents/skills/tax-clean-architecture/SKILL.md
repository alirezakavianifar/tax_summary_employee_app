---
name: tax-clean-architecture
description: >-
  Guidelines, checklists, and patterns for adding or modifying full-stack features in the Tax Summary Employee App following Clean Architecture (ASP.NET Core 8 Web API + Next.js 14 App Router). Use this skill whenever creating new entities, endpoints, DTOs, services, or connecting frontend pages to backend APIs.
---

# Clean Architecture Full-Stack Feature Skill

This skill governs feature development, layer synchronization, and architectural discipline across the ASP.NET Core 8 backend and Next.js 14 App Router frontend.

---

## 1. Architectural Layers & Responsibilities

```
Frontend (Next.js 14 App Router, TypeScript, Tailwind)
  ↓ HTTP JSON / REST (JWT Bearer)
Backend/TaxSummary.Api (Controllers, Middleware, Swagger, Rate Limiting)
  ↓ Depends on Application
Backend/TaxSummary.Application (Services, DTOs, FluentValidation, AutoMapper)
  ↓ Depends on Domain
Backend/TaxSummary.Domain (Entities, Value Objects, Result Pattern, Repository Interfaces)
  ↑ Implemented by
Backend/TaxSummary.Infrastructure (EF Core DbContext, Repositories, SQLite Mapping)
```

### Layer Dependency Rules
1. **`TaxSummary.Domain`**: ZERO external dependencies. Contains pure domain logic, entities, value objects, domain exceptions, and repository interfaces. Never reference EF Core or ASP.NET Core here.
2. **`TaxSummary.Application`**: Business logic orchestration. Contains service interfaces, DTOs, FluentValidation validators (in Persian), and AutoMapper profiles. Depends strictly on `TaxSummary.Domain`.
3. **`TaxSummary.Infrastructure`**: Implements repository interfaces, EF Core DbContext, entity configurations (Fluent API), and third-party integrations (file storage, MiniExcel/EPPlus).
4. **`TaxSummary.Api`**: HTTP entrypoint. Handles routing, rate limiting (`[EnableRateLimiting("GeneralPolicy")]`), authorization (`[Authorize]`), and maps Application `Result<T>` to HTTP status codes.
5. **`frontend`**: React 18 / Next.js 14 App Router. Consumes API through modular clients in `frontend/lib/api/` with strict TypeScript types in `frontend/types/`.

---

## 2. Standard Feature Implementation Checklist

When implementing a new feature or extending an existing one, follow this exact sequence:

### Step 1: Domain Layer (`Backend/TaxSummary.Domain`)
- Define entity in `Entities/`:
  - Inherit from base entity if applicable.
  - Use encapsulated domain methods for state mutations.
- Define Value Objects in `ValueObjects/` (inherit from `ValueObject`).
- Ensure operations return `Result` or `Result<T>` from `TaxSummary.Domain.Common.Result`.

### Step 2: Infrastructure Layer (`Backend/TaxSummary.Infrastructure`)
- Add entity configuration in `Data/Configurations/` using Fluent API:
  - Configure table names, primary keys, and required column constraints.
  - Specify indexes for query-heavy fields (e.g. PersonnelNumber, TrackingNumber, Dates).
  - Explicitly configure cascade delete behaviors (`DeleteBehavior.Restrict` or `DeleteBehavior.Cascade`).
- Add `DbSet<T>` to `TaxSummaryDbContext.cs`.
- If a custom repository is needed, define the interface in `Domain/Interfaces` and implementation in `Infrastructure/Repositories`.

### Step 3: Application Layer (`Backend/TaxSummary.Application`)
- Define DTOs in `DTOs/<FeatureName>/` (request DTOs, response DTOs, summary DTOs).
- Configure mapping in `Mapping/MappingProfile.cs` using AutoMapper.
- Create FluentValidation validators in `Validators/`:
  - **All validation error messages MUST be in Persian (Farsi)**.
  - Example: `.NotEmpty().WithMessage("وارد کردن نام الزامی است")`.
- Define service interface (`IService`) and implementation in `Services/`:
  - Methods must accept `CancellationToken cancellationToken = default`.
  - Methods must return `Task<Result<TResponse>>` or `Task<Result>`.
  - Handle exceptions and return `Result.Failure("پیام خطا به زبان فارسی")`.

### Step 4: API Layer (`Backend/TaxSummary.Api`)
- Create or update controller in `Controllers/`:
  - Decorate with `[ApiController]`, `[Route("api/[controller]")]`, `[EnableRateLimiting("GeneralPolicy")]`.
  - Inject service and `ILogger<TController>`.
  - Decorate endpoints with `[Authorize]` or `[Authorize(Roles = "Admin,Manager")]`.
  - Return clean HTTP responses based on `Result`:
    ```csharp
    var result = await _service.DoActionAsync(dto, cancellationToken);
    if (result.IsFailure)
        return BadRequest(new { error = result.Error });
    return Ok(result.Value);
    ```
- Register new services in `Program.cs` via Dependency Injection.

### Step 5: Frontend Integration (`frontend/`)
- Define TypeScript interfaces in `frontend/types/<feature>.ts`.
- Add API client functions in `frontend/lib/api/<feature>.ts`:
  - Use the shared Axios instance with interceptors (JWT token attachment).
- Create or update pages in `frontend/app/<feature>/` and components in `frontend/components/`.
- Handle loading, empty, and error states gracefully with Persian UI text.

---

## 3. Key Patterns & Conventions

### Result Pattern
Always use `Result` and `Result<T>` from `TaxSummary.Domain.Common`:
```csharp
// Success
return Result.Success();
return Result<EmployeeDto>.Success(dto);

// Failure
return Result.Failure("کارمند مورد نظر یافت نشد.");
return Result<EmployeeDto>.Failure("شماره پرسنلی نامعتبر است.");
```

### Rate Limiting & Security
- Every controller exposing business endpoints must include `[EnableRateLimiting("GeneralPolicy")]`.
- Sanitize inputs from Excel exports/imports using `FormulaInjectionSanitizer`.
- Restrict sensitive actions (deletions, role management, menu overrides) to `[Authorize(Roles = "Admin")]`.

### Database & SQLite Best Practices
- The production database is SQLite (`taxsummary.db`).
- Large monetary amounts (in Rials) must use `long` (64-bit integer) or `decimal` to prevent SQLite 32-bit integer overflow.
- Ensure queries that read large datasets use pagination (`Skip` and `Take`) or bounded ranges to prevent memory spikes.

---

## 4. Verification Workflow

After completing feature changes across layers:
1. Verify Backend builds cleanly:
   ```powershell
   dotnet build Backend/TaxSummary.sln
   ```
2. Verify Frontend builds cleanly:
   ```powershell
   cd frontend
   npm run build
   ```
3. Test API and Health status using the management script:
   ```powershell
   .\scripts\manage-app.ps1 health
   ```

