# TaxSummary.Api

This is the **API Layer** of the Tax Summary Employee Application, following Clean Architecture principles.

## Overview

The API layer provides:
- **REST API**: RESTful endpoints for employee report management
- **Controllers**: ASP.NET Core controllers for HTTP requests
- **Middleware**: Exception handling and request processing
- **Swagger/OpenAPI**: Interactive API documentation
- **CORS**: Cross-origin resource sharing configuration
- **Health Checks**: Database health monitoring

## Structure

```
TaxSummary.Api/
├── Controllers/
│   └── EmployeeReportsController.cs    # REST API endpoints
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs  # Global exception handling
├── Properties/
│   └── launchSettings.json             # Launch configuration
├── Program.cs                           # Application entry point
├── appsettings.json                     # Configuration
├── appsettings.Development.json         # Development config
└── README.md
```

## API Endpoints

### Employee Reports

#### GET /api/employeereports/{employeeId}
Get complete employee report by ID.

**Response:** `200 OK` with `EmployeeReportDto`

```json
{
  "employee": {
    "id": "guid",
    "personnelNumber": "string",
    "firstName": "string",
    "lastName": "string",
    ...
  },
  "adminStatus": { ... },
  "capabilities": [ ... ]
}
```

#### GET /api/employeereports/by-personnel-number/{personnelNumber}
Get complete employee report by personnel number.

**Response:** `200 OK` with `EmployeeReportDto`

#### POST /api/employeereports
Create a new employee report.

**Request Body:** `CreateEmployeeReportDto`
```json
{
  "personnelNumber": "EMP001",
  "firstName": "علی",
  "lastName": "احمدی",
  "education": "کارشناسی",
  "serviceUnit": "واحد مالیات",
  "currentPosition": "کارشناس",
  "appointmentPosition": "کارشناس ارشد",
  "previousExperienceYears": 5,
  "missionDays": 10,
  "incentiveHours": 20,
  "delayAndAbsenceHours": 5,
  "hourlyLeaveHours": 8,
  "capabilities": [
    {
      "systemRole": "معاون مالیاتی",
      "detectionOfTaxIssues": true,
      ...
    }
  ]
}
```

**Response:** `201 Created` with employee ID

#### PUT /api/employeereports/{employeeId}
Update an existing employee report.

**Request Body:** `UpdateEmployeeReportDto`

**Response:** `204 No Content`

#### DELETE /api/employeereports/{employeeId}
Delete an employee report.

**Response:** `204 No Content`

### Employee List Operations

#### GET /api/employeereports/employees
Get all employees (basic information).

**Response:** `200 OK` with `IEnumerable<EmployeeDto>`

#### GET /api/employeereports/employees/paged?pageNumber=1&pageSize=10
Get employees with pagination.

**Query Parameters:**
- `pageNumber` (default: 1)
- `pageSize` (default: 10, max: 100)

**Response:** `200 OK`
```json
{
  "data": [ ... ],
  "pagination": {
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 50,
    "totalPages": 5
  }
}
```

#### GET /api/employeereports/employees/search?searchTerm=علی
Search employees by name or personnel number.

**Query Parameters:**
- `searchTerm` (required)

**Response:** `200 OK` with `IEnumerable<EmployeeDto>`

#### GET /api/employeereports/employees/by-service-unit?serviceUnit=واحد مالیات
Get employees by service unit.

**Query Parameters:**
- `serviceUnit` (required)

**Response:** `200 OK` with `IEnumerable<EmployeeDto>`

## Configuration

### Connection String

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TaxSummaryDb;Trusted_Connection=true"
  }
}
```

### CORS Origins

Configure allowed frontend origins:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-frontend-domain.com"
    ]
  }
}
```

### Logging

Configure logging levels:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## Running the API

### Development

```bash
cd Backend/TaxSummary.Api
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `http://localhost:5000` (root)

### Watch Mode (Auto-reload)

```bash
dotnet watch run
```

### Production

```bash
dotnet run --configuration Release
```

## Features

### Swagger/OpenAPI Documentation

Interactive API documentation available at the root URL when running in development mode.

Features:
- Try out endpoints directly
- View request/response schemas
- See all available endpoints
- Persian text support

### Exception Handling

Global exception handling middleware catches all unhandled exceptions:
- Logs errors with details
- Returns user-friendly Persian error messages
- Includes stack trace in development mode
- Returns 500 status code

### CORS Support

Cross-Origin Resource Sharing configured for frontend:
- Allows specified origins
- Supports credentials
- Allows all methods and headers

### Health Checks

Health check endpoint at `/health`:
- Checks database connectivity
- Returns 200 OK if healthy
- Returns 503 Service Unavailable if unhealthy

### Logging

Structured logging throughout:
- Request/response logging
- Error logging
- Information logging
- Entity Framework query logging (in development)

### Persian Language Support

- All error messages in Persian
- UTF-8 JSON encoding
- Unsafe relaxed JSON escaping for Persian characters
- Proper content type headers

## Response Formats

### Success Response

```json
{
  "id": "guid",
  "personnelNumber": "EMP001",
  "firstName": "علی",
  "lastName": "احمدی"
}
```

### Error Response

```json
{
  "error": "کارمند یافت نشد"
}
```

### Validation Error Response

```json
{
  "error": "شماره پرسنلی الزامی است"
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 OK | Success | GET requests |
| 201 Created | Resource created | POST requests |
| 204 No Content | Success, no body | PUT/DELETE requests |
| 400 Bad Request | Validation error | Invalid input |
| 404 Not Found | Resource not found | Employee not found |
| 500 Internal Server Error | Server error | Unhandled exceptions |

## Security Considerations

### HTTPS

- HTTPS redirection enabled
- Recommended for production

### CORS

- Restricted to configured origins
- Credentials support enabled
- Configure origins per environment

### Input Validation

- FluentValidation on all inputs
- DTO validation before processing
- Persian validation messages

### SQL Injection

- EF Core parameterized queries
- No raw SQL concatenation
- Repository pattern isolation

## Testing with curl

### Create Employee Report

```bash
curl -X POST http://localhost:5000/api/employeereports \
  -H "Content-Type: application/json" \
  -d '{
    "personnelNumber": "EMP001",
    "firstName": "علی",
    "lastName": "احمدی",
    "education": "کارشناسی",
    "serviceUnit": "واحد مالیات",
    "currentPosition": "کارشناس",
    "appointmentPosition": "کارشناس ارشد",
    "previousExperienceYears": 5,
    "missionDays": 10,
    "incentiveHours": 20,
    "delayAndAbsenceHours": 5,
    "hourlyLeaveHours": 8,
    "capabilities": [
      {
        "systemRole": "معاون مالیاتی",
        "detectionOfTaxIssues": true,
        "detectionOfTaxEvasion": true,
        "companyIdentification": false,
        "valueAddedRecognition": true,
        "referredOrExecuted": true
      }
    ]
  }'
```

### Get Employee Report

```bash
curl http://localhost:5000/api/employeereports/{employeeId}
```

### Search Employees

```bash
curl "http://localhost:5000/api/employeereports/employees/search?searchTerm=علی"
```

## Database Migrations

The API automatically applies migrations in development mode.

For manual migration:

```bash
dotnet ef database update --project ../TaxSummary.Infrastructure
```

## Deployment

### Publish

```bash
dotnet publish -c Release -o ./publish
```

### IIS Deployment

1. Publish the application
2. Copy to IIS wwwroot
3. Create application pool (.NET 8.0)
4. Configure connection string in appsettings.json
5. Set ASPNETCORE_ENVIRONMENT to Production

### Docker (Future)

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY ./publish .
ENTRYPOINT ["dotnet", "TaxSummary.Api.dll"]
```

## Performance

### Optimizations

- EF Core connection pooling
- Async/await throughout
- Efficient queries with indexes
- Pagination for large datasets
- Minimal memory allocations

### Monitoring

- Health checks at `/health`
- Structured logging
- Exception tracking
- Request/response logging

## Notes

- UTF-8 encoding for Persian text
- camelCase JSON property names
- Swagger UI at root in development
- Automatic database initialization in development
- Health check monitors database connectivity

---

**API Layer Status: ✅ COMPLETE**

Ready for Phase 5: Frontend Layer (Next.js application)
