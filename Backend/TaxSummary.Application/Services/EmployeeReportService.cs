using AutoMapper;
using TaxSummary.Application.DTOs;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

/// <summary>
/// Implementation of employee report service
/// </summary>
public class EmployeeReportService : IEmployeeReportService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public EmployeeReportService(
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<EmployeeReportDto>> GetReportAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);

        if (employee == null)
        {
            return Result.Failure<EmployeeReportDto>("کارمند یافت نشد");
        }

        var reportDto = _mapper.Map<EmployeeReportDto>(employee);
        return Result.Success(reportDto);
    }

    public async Task<Result<EmployeeReportDto>> GetReportByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
        {
            return Result.Failure<EmployeeReportDto>("شماره پرسنلی نمی‌تواند خالی باشد");
        }

        var employee = await _employeeRepository.GetByPersonnelNumberAsync(personnelNumber, cancellationToken);

        if (employee == null)
        {
            return Result.Failure<EmployeeReportDto>("کارمند با این شماره پرسنلی یافت نشد");
        }

        var reportDto = _mapper.Map<EmployeeReportDto>(employee);
        return Result.Success(reportDto);
    }

    public async Task<Result<Guid>> CreateReportAsync(CreateEmployeeReportDto dto, CancellationToken cancellationToken = default)
    {
        // Check if personnel number already exists
        if (await _employeeRepository.ExistsByPersonnelNumberAsync(dto.PersonnelNumber, cancellationToken))
        {
            return Result.Failure<Guid>("شماره پرسنلی قبلاً ثبت شده است");
        }

        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            // Create employee entity
            var employee = Employee.Create(
                personnelNumber: dto.PersonnelNumber,
                firstName: dto.FirstName,
                lastName: dto.LastName,
                education: dto.Education,
                serviceUnit: dto.ServiceUnit,
                currentPosition: dto.CurrentPosition,
                appointmentPosition: dto.AppointmentPosition,
                previousExperienceYears: dto.PreviousExperienceYears
            );

            // Create administrative status
            var adminStatus = AdministrativeStatus.Create(
                employeeId: employee.Id,
                missionDays: dto.MissionDays,
                sickLeaveDays: dto.SickLeaveDays,
                paidLeaveDays: dto.PaidLeaveDays,
                overtimeHours: dto.OvertimeHours,
                delayAndAbsenceHours: dto.DelayAndAbsenceHours,
                hourlyLeaveHours: dto.HourlyLeaveHours
            );

            employee.SetAdministrativeStatus(adminStatus);

            // Create performance capabilities
            foreach (var capabilityDto in dto.Capabilities)
            {
                var capability = PerformanceCapability.Create(
                    employeeId: employee.Id,
                    systemRole: capabilityDto.SystemRole,
                    detectionOfTaxIssues: capabilityDto.DetectionOfTaxIssues,
                    detectionOfTaxEvasion: capabilityDto.DetectionOfTaxEvasion,
                    companyIdentification: capabilityDto.CompanyIdentification,
                    valueAddedRecognition: capabilityDto.ValueAddedRecognition,
                    referredOrExecuted: capabilityDto.ReferredOrExecuted
                );

                employee.AddPerformanceCapability(capability);
            }

            // Save to repository
            await _employeeRepository.AddAsync(employee, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return Result.Success(employee.Id);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return Result.Failure<Guid>($"خطا در ایجاد گزارش: {ex.Message}");
        }
    }

    public async Task<Result> UpdateReportAsync(Guid employeeId, UpdateEmployeeReportDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);

        if (employee == null)
        {
            return Result.Failure("کارمند یافت نشد");
        }

        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            // Update employee information
            employee.UpdatePersonalInfo(dto.FirstName, dto.LastName, dto.Education);
            employee.UpdatePosition(dto.CurrentPosition, dto.AppointmentPosition, dto.PreviousExperienceYears);
            employee.UpdateServiceUnit(dto.ServiceUnit);
            
            // Update photo URL if provided
            if (dto.PhotoUrl != null)
            {
                employee.UpdatePhoto(dto.PhotoUrl);
            }
            
            // Update status description if provided
            if (dto.StatusDescription != null)
            {
                employee.UpdateStatusDescription(dto.StatusDescription);
            }

            // Update administrative status
            if (employee.AdministrativeStatus != null)
            {
                employee.AdministrativeStatus.UpdateStatus(
                    missionDays: dto.MissionDays,
                    sickLeaveDays: dto.SickLeaveDays,
                    paidLeaveDays: dto.PaidLeaveDays,
                    overtimeHours: dto.OvertimeHours,
                    delayAndAbsenceHours: dto.DelayAndAbsenceHours,
                    hourlyLeaveHours: dto.HourlyLeaveHours
                );
            }
            else
            {
                var adminStatus = AdministrativeStatus.Create(
                    employeeId: employee.Id,
                    missionDays: dto.MissionDays,
                    sickLeaveDays: dto.SickLeaveDays,
                    paidLeaveDays: dto.PaidLeaveDays,
                    overtimeHours: dto.OvertimeHours,
                    delayAndAbsenceHours: dto.DelayAndAbsenceHours,
                    hourlyLeaveHours: dto.HourlyLeaveHours
                );
                employee.SetAdministrativeStatus(adminStatus);
            }

            // Update performance capabilities - simple approach: remove all and re-add
            var existingCapabilities = employee.PerformanceCapabilities.ToList();
            foreach (var capability in existingCapabilities)
            {
                employee.RemovePerformanceCapability(capability.Id);
            }

            foreach (var capabilityDto in dto.Capabilities)
            {
                var capability = PerformanceCapability.Create(
                    employeeId: employee.Id,
                    systemRole: capabilityDto.SystemRole,
                    detectionOfTaxIssues: capabilityDto.DetectionOfTaxIssues,
                    detectionOfTaxEvasion: capabilityDto.DetectionOfTaxEvasion,
                    companyIdentification: capabilityDto.CompanyIdentification,
                    valueAddedRecognition: capabilityDto.ValueAddedRecognition,
                    referredOrExecuted: capabilityDto.ReferredOrExecuted
                );

                // Update all capability metrics
                capability.UpdateAllCapabilityMetrics(
                    detectionOfTaxIssuesQuantity: capabilityDto.DetectionOfTaxIssues_Quantity,
                    detectionOfTaxIssuesAmount: capabilityDto.DetectionOfTaxIssues_Amount,
                    detectionOfTaxEvasionQuantity: capabilityDto.DetectionOfTaxEvasion_Quantity,
                    detectionOfTaxEvasionAmount: capabilityDto.DetectionOfTaxEvasion_Amount,
                    companyIdentificationQuantity: capabilityDto.CompanyIdentification_Quantity,
                    companyIdentificationAmount: capabilityDto.CompanyIdentification_Amount,
                    valueAddedRecognitionQuantity: capabilityDto.ValueAddedRecognition_Quantity,
                    valueAddedRecognitionAmount: capabilityDto.ValueAddedRecognition_Amount,
                    referredOrExecutedQuantity: capabilityDto.ReferredOrExecuted_Quantity,
                    referredOrExecutedAmount: capabilityDto.ReferredOrExecuted_Amount
                );

                employee.AddPerformanceCapability(capability);
            }

            await _employeeRepository.UpdateAsync(employee, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return Result.Failure($"خطا در بروزرسانی گزارش: {ex.Message}");
        }
    }

    public async Task<Result> DeleteReportAsync(Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);

        if (employee == null)
        {
            return Result.Failure("کارمند یافت نشد");
        }

        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            await _employeeRepository.DeleteAsync(employeeId, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return Result.Success();
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            return Result.Failure($"خطا در حذف گزارش: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<EmployeeDto>>> GetAllEmployeesAsync(CancellationToken cancellationToken = default)
    {
        var employees = await _employeeRepository.GetAllAsync(cancellationToken);
        var employeeDtos = _mapper.Map<IEnumerable<EmployeeDto>>(employees);
        return Result.Success(employeeDtos);
    }

    public async Task<Result<(IEnumerable<EmployeeDto> Employees, int TotalCount)>> GetEmployeesPagedAsync(
        int pageNumber, 
        int pageSize,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1)
        {
            return Result.Failure<(IEnumerable<EmployeeDto>, int)>("شماره صفحه باید بزرگتر از 0 باشد");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return Result.Failure<(IEnumerable<EmployeeDto>, int)>("اندازه صفحه باید بین 1 تا 100 باشد");
        }

        try
        {
            var (employees, totalCount) = await _employeeRepository.GetPagedAsync(pageNumber, pageSize, searchTerm, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<EmployeeDto>>(employees);

            return Result.Success<(IEnumerable<EmployeeDto>, int)>((dtos, totalCount));
        }
        catch (Exception ex)
        {
            return Result.Failure<(IEnumerable<EmployeeDto>, int)>($"Failed to get paged employees: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<EmployeeDto>>> SearchEmployeesByNameAsync(
        string searchTerm, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return Result.Failure<IEnumerable<EmployeeDto>>("عبارت جستجو نمی‌تواند خالی باشد");
        }

        var employees = await _employeeRepository.SearchByNameAsync(searchTerm, cancellationToken);
        var employeeDtos = _mapper.Map<IEnumerable<EmployeeDto>>(employees);

        return Result.Success(employeeDtos);
    }

    public async Task<Result<IEnumerable<EmployeeDto>>> GetEmployeesByServiceUnitAsync(
        string serviceUnit, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(serviceUnit))
        {
            return Result.Failure<IEnumerable<EmployeeDto>>("واحد محل خدمت نمی‌تواند خالی باشد");
        }

        var employees = await _employeeRepository.GetByServiceUnitAsync(serviceUnit, cancellationToken);
        var employeeDtos = _mapper.Map<IEnumerable<EmployeeDto>>(employees);

        return Result.Success(employeeDtos);
    }
}
