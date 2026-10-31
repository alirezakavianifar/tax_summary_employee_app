using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Api.Controllers.Reporting;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using Xunit;

namespace TaxSummary.Application.Tests.Controllers;

public class ReportingControllersTests
{
    private readonly Mock<IExecutiveReportingService> _execReportingServiceMock = new();
    private readonly Mock<IReportingRepository> _reportingRepoMock = new();
    private readonly Mock<IReportBuilderEngine> _builderEngineMock = new();
    private readonly Mock<ISavedReportsService> _savedReportsServiceMock = new();
    private readonly Mock<ILogger<ExecutiveReportingController>> _execLoggerMock = new();
    private readonly Mock<ILogger<StandardReportsController>> _standardLoggerMock = new();
    private readonly Mock<ILogger<ReportBuilderController>> _builderLoggerMock = new();
    private readonly Mock<ILogger<SavedReportsController>> _savedLoggerMock = new();

    private static ControllerContext CreateContext(string role, Guid userId, List<Guid>? officeIds = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, "testuser"),
            new(ClaimTypes.Role, role)
        };

        if (officeIds != null)
        {
            foreach (var oid in officeIds)
            {
                claims.Add(new Claim("office_id", oid.ToString()));
            }
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        return new ControllerContext { HttpContext = httpContext };
    }

    [Fact]
    public async Task ExecutiveReportingController_WhenManager_ShouldPassAssignedOffices()
    {
        // Arrange
        var officeId = Guid.NewGuid();
        var controller = new ExecutiveReportingController(_execReportingServiceMock.Object, _execLoggerMock.Object)
        {
            ControllerContext = CreateContext("Manager", Guid.NewGuid(), new() { officeId })
        };

        var expectedDto = new ExecutiveDashboardDto();
        _execReportingServiceMock
            .Setup(s => s.GetExecutiveDashboardOverviewAsync(
                It.IsAny<DashboardFilterDto>(),
                It.Is<List<Guid>>(o => o.Contains(officeId)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(expectedDto));

        // Act
        var actionResult = await controller.GetDashboard(new DashboardFilterDto(), CancellationToken.None);

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(StatusCodes.Status200OK);
        okResult.Value.Should().Be(expectedDto);
    }

    [Fact]
    public async Task ExecutiveReportingController_WhenAdmin_ShouldPassNullOffices_ForProvincialScope()
    {
        // Arrange
        var controller = new ExecutiveReportingController(_execReportingServiceMock.Object, _execLoggerMock.Object)
        {
            ControllerContext = CreateContext("Admin", Guid.NewGuid())
        };

        var expectedDto = new ExecutiveDashboardDto();
        _execReportingServiceMock
            .Setup(s => s.GetExecutiveDashboardOverviewAsync(
                It.IsAny<DashboardFilterDto>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(expectedDto));

        // Act
        var actionResult = await controller.GetDashboard(new DashboardFilterDto(), CancellationToken.None);

        // Assert
        var okResult = actionResult.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task StandardReportsController_ExecuteReport_LogsMetric_AndReturnsOk()
    {
        // Arrange
        var controller = new StandardReportsController(
            _execReportingServiceMock.Object,
            _reportingRepoMock.Object,
            _standardLoggerMock.Object)
        {
            ControllerContext = CreateContext("Admin", Guid.NewGuid())
        };

        var execResult = new ReportExecutionResultDto
        {
            ReportCode = "REP_01",
            ReportTitle = "گزارش ۱",
            TotalRowCount = 42
        };

        _execReportingServiceMock
            .Setup(s => s.ExecuteStandardReportAsync(
                "REP_01",
                It.IsAny<ReportFilterParametersDto>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(execResult));

        // Act
        var response = await controller.ExecuteReport("REP_01", new ReportFilterParametersDto(), CancellationToken.None);

        // Assert
        var okResult = response.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(StatusCodes.Status200OK);

        _reportingRepoMock.Verify(r => r.LogExecutionAsync(
            It.Is<ReportExecutionLog>(l => l.ReportCode == "REP_01" && l.ResultRowCount == 42),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task StandardReportsController_ExportExcel_ReturnsFileResult()
    {
        // Arrange
        var controller = new StandardReportsController(
            _execReportingServiceMock.Object,
            _reportingRepoMock.Object,
            _standardLoggerMock.Object)
        {
            ControllerContext = CreateContext("Admin", Guid.NewGuid())
        };

        var bytes = new byte[] { 1, 2, 3, 4, 5 };
        _execReportingServiceMock
            .Setup(s => s.ExportStandardReportAsync(
                "REP_01",
                It.IsAny<ReportFilterParametersDto>(),
                ExportFormat.Excel,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(bytes));

        // Act
        var result = await controller.ExportExcel("REP_01", new ReportFilterParametersDto(), CancellationToken.None);

        // Assert
        var fileResult = result as FileContentResult;
        fileResult.Should().NotBeNull();
        fileResult!.ContentType.Should().Be("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        fileResult.FileContents.Should().Equal(bytes);
    }

    [Fact]
    public async Task ReportBuilderController_ExecuteDynamicQuery_ReturnsResult()
    {
        // Arrange
        var controller = new ReportBuilderController(_builderEngineMock.Object, _builderLoggerMock.Object)
        {
            ControllerContext = CreateContext("Admin", Guid.NewGuid())
        };

        var dynamicResult = new DynamicReportResultDto
        {
            TotalRows = 10
        };

        _builderEngineMock
            .Setup(e => e.ExecuteDynamicQueryAsync(
                It.IsAny<DynamicReportQueryRequestDto>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(dynamicResult));

        // Act
        var response = await controller.ExecuteDynamicQuery(new DynamicReportQueryRequestDto(), CancellationToken.None);

        // Assert
        var okResult = response.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task SavedReportsController_CreatePreset_ReturnsCreatedAtAction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var controller = new SavedReportsController(_savedReportsServiceMock.Object, _savedLoggerMock.Object)
        {
            ControllerContext = CreateContext("Manager", userId)
        };

        var presetDto = new SavedReportPresetDto
        {
            Id = Guid.NewGuid(),
            PresetName = "الگوی من"
        };

        _savedReportsServiceMock
            .Setup(s => s.SavePresetAsync(
                It.IsAny<SaveReportPresetRequestDto>(),
                userId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(presetDto));

        // Act
        var response = await controller.CreatePreset(new SaveReportPresetRequestDto { PresetName = "الگوی من" }, CancellationToken.None);

        // Assert
        var createdResult = response.Result as CreatedAtActionResult;
        createdResult.Should().NotBeNull();
        createdResult!.StatusCode.Should().Be(StatusCodes.Status201Created);
        createdResult.Value.Should().Be(presetDto);
    }
}
