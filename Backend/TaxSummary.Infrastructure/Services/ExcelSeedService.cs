using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using MiniExcelLibs;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Services;

public class ExcelSeedService : IExcelSeedService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ExcelSeedService(
        IEmployeeRepository employeeRepository, 
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> SeedFromExcelAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        var rows = fileStream.Query(useHeaderRow: true).ToList();
        int count = 0;

        foreach (var row in rows)
        {
            var props = (IDictionary<string, object>)row;

            // Extract values using Persian headers
            var personnelNumber = GetValue(props, "شماره کارمند");
            if (string.IsNullOrWhiteSpace(personnelNumber)) continue;

            // Name handling: Prefer separate columns, fallback to splitting "نام"
            var firstName = GetValue(props, "نام");
            var lastName = GetValue(props, "نام خانوادگي");

            if (string.IsNullOrWhiteSpace(lastName) && !string.IsNullOrWhiteSpace(firstName) && firstName.Contains(" "))
            {
                var nameParts = firstName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                firstName = nameParts.Length > 0 ? nameParts[0] : "-";
                lastName = nameParts.Length > 1 ? nameParts[1] : "-";
            }
            
            if (string.IsNullOrWhiteSpace(firstName)) firstName = "-";
            if (string.IsNullOrWhiteSpace(lastName)) lastName = "-";

            // Optional fields
            var serviceUnit = GetValue(props, "واحد متبوع");
            var currentPosition = GetValue(props, "نام پست");
            var education = GetValue(props, "رشته تحصيلي");
            var appointmentPosition = GetValue(props, "پست انتصابی");
            var previousExperienceYears = ParseInt(GetValue(props, "سنوات سال"));
            var nationalIdValue = GetValue(props, "شماره ملي");
            
            // Parse Administrative Status values
            int missionDays = ParseInt(GetValue(props, "مأموريت"));
            int sickLeaveDays = ParseInt(GetValue(props, "استعلاجي"));
            int paidLeaveDays = ParseInt(GetValue(props, "استحقاقي"));
            int overtimeHours = ParseTime(GetValue(props, "اضافه واقعي"));
            int delayAll = ParseTime(GetValue(props, "جمع تأخيروتعجيل"));
            int hourlyLeave = ParseTime(GetValue(props, "مرخصي ساعتي مجاز"));

            // Parse Tax Performance Values
            // VAT
            int vatQty = ParseInt(GetValue(props, "تعداد تشخیص شده ارزش افزوده"));
            decimal vatAmt = ParseDecimal(GetValue(props, "مالیات تشخیص شده ارزش افزوده"));
            int vatUndetectedQty = ParseInt(GetValue(props, "تعداد تشخیص نشده ارزش افزوده"));

            // Companies
            int compQty = ParseInt(GetValue(props, "تعداد تشخیص شده شرکت ها"));
            decimal compAmt = ParseDecimal(GetValue(props, "مالیات تشخیص شده شرکت ها"));
            int compUndetectedQty = ParseInt(GetValue(props, "تعداد تشخیص نشده شرکت ها"));

            // Jobs
            int jobsQty = ParseInt(GetValue(props, "تعداد تشخیص شده مشاغل"));
            decimal jobsAmt = ParseDecimal(GetValue(props, "مالیات تشخیص شده مشاغل"));
            int jobsUndetectedQty = ParseInt(GetValue(props, "تعداد تشخیص نشده مشاغل"));

            // Other
            int otherQty = ParseInt(GetValue(props, "تعداد تشخیص شده سایر"));
            decimal otherAmt = ParseDecimal(GetValue(props, "مالیات تشخیص شده سایر"));
            int otherUndetectedQty = ParseInt(GetValue(props, "تعداد تشخیص نشده سایر"));


            // Check if employee exists
            var employee = await _employeeRepository.GetByPersonnelNumberAsync(personnelNumber, cancellationToken);

            if (employee == null)
            {
                // Create new employee
                employee = Employee.Create(
                    personnelNumber,
                    firstName,
                    lastName,
                    education,
                    serviceUnit,
                    currentPosition,
                    appointmentPosition,
                    previousExperienceYears,
                    nationalIdValue
                );

                await _employeeRepository.AddAsync(employee, cancellationToken);
            }
            else
            {
                // Update existing employee info
                employee.UpdatePersonalInfo(firstName, lastName, education, nationalIdValue);
                employee.UpdateServiceUnit(serviceUnit);
                employee.UpdatePosition(currentPosition, appointmentPosition, previousExperienceYears);
            }

            // Handle Administrative Status
            if (employee.AdministrativeStatus == null)
            {
                var status = AdministrativeStatus.Create(
                    employee.Id,
                    missionDays,
                    sickLeaveDays,
                    paidLeaveDays,
                    overtimeHours,
                    delayAll,
                    hourlyLeave
                );
                employee.SetAdministrativeStatus(status);
            }
            else
            {
                employee.AdministrativeStatus.UpdateStatus(
                    missionDays,
                    sickLeaveDays,
                    paidLeaveDays,
                    overtimeHours,
                    delayAll,
                    hourlyLeave
                );
            }

            // Handle Performance Capabilities
            // We assume one capability record per employee for this import logic
            var capability = employee.PerformanceCapabilities.FirstOrDefault();
            
            if (capability == null)
            {
                capability = PerformanceCapability.Create(
                    employeeId: employee.Id,
                    systemRole: "Imported User", // Default role
                    detectionOfTaxIssues: false, // Will be auto-set by metrics
                    detectionOfTaxEvasion: false,
                    companyIdentification: false,
                    valueAddedRecognition: false,
                    referredOrExecuted: false,
                    
                    valueAddedRecognitionQuantity: vatQty,
                    valueAddedRecognitionAmount: vatAmt,
                    valueAddedRecognitionUndetectedQuantity: vatUndetectedQty,
                    
                    jobsQuantity: jobsQty,
                    jobsAmount: jobsAmt,
                    jobsUndetectedQuantity: jobsUndetectedQty,
                    
                    otherQuantity: otherQty,
                    otherAmount: otherAmt,
                    otherUndetectedQuantity: otherUndetectedQty,
                    
                    companyIdentificationUndetectedQuantity: compUndetectedQty,
                    companyIdentificationQuantity: compQty,
                    companyIdentificationAmount: compAmt,

                    referredOrExecutedQuantity: 0, // Not in Excel
                    referredOrExecutedAmount: 0 // Not in Excel
                );
                employee.AddPerformanceCapability(capability);
            }
            else
            {
                capability.UpdateAllCapabilityMetrics(
                     detectionOfTaxIssuesQuantity: 0, // Not in Excel yet
                     detectionOfTaxIssuesAmount: 0,
                     detectionOfTaxEvasionQuantity: 0,
                     detectionOfTaxEvasionAmount: 0,
                     
                     companyIdentificationQuantity: compQty,
                     companyIdentificationAmount: compAmt,
                     companyIdentificationUndetectedQuantity: compUndetectedQty,
                     
                     valueAddedRecognitionQuantity: vatQty,
                     valueAddedRecognitionAmount: vatAmt,
                     valueAddedRecognitionUndetectedQuantity: vatUndetectedQty,
                     
                     jobsQuantity: jobsQty,
                     jobsAmount: jobsAmt,
                     jobsUndetectedQuantity: jobsUndetectedQty,
                     
                     otherQuantity: otherQty,
                     otherAmount: otherAmt,
                     otherUndetectedQuantity: otherUndetectedQty,
                     
                     referredOrExecutedQuantity: capability.ReferredOrExecuted_Quantity, // Keep existing
                     referredOrExecutedAmount: capability.ReferredOrExecuted_Amount // Keep existing
                );
            }

            count++;
        }

        if (count == 0 && rows.Any())
        {
            var firstRow = (IDictionary<string, object>)rows.First();
            var headers = string.Join(", ", firstRow.Keys);
            throw new Exception($"No records matched. Found headers: {headers}");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return count;
    }

    private string GetValue(IDictionary<string, object> props, string key)
    {
        if (props.TryGetValue(key, out var value) && value != null)
        {
            return value.ToString()?.Trim() ?? string.Empty;
        }
        return string.Empty;
    }

    private int ParseInt(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        if (int.TryParse(value, out var result))
        {
            return result;
        }
        // Handle decimals cast to int
        if (double.TryParse(value, out var d))
        {
            return (int)Math.Round(d);
        }
        return 0;
    }

    private decimal ParseDecimal(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        if (decimal.TryParse(value, out var result))
        {
            return result;
        }
        return 0;
    }

    private int ParseTime(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;

        // Handle "HH:mm" format or simple integer
        if (value.Contains(":"))
        {
            var parts = value.Split(':');
            if (parts.Length > 0 && int.TryParse(parts[0], out var hours))
            {
                 // We only care about full hours for now as per domain int properties
                 // Or should we round? Let's just take the hour part.
                 if (parts.Length > 1 && int.TryParse(parts[1], out var minutes))
                 {
                     if (minutes >= 30) hours++; // Round up
                 }
                 return hours;
            }
        }
        
        if (int.TryParse(value, out var simpleHours))
        {
            return simpleHours;
        }
        
        // Handle decimal like 12.5 -> 13
        if (double.TryParse(value, out var d))
        {
            return (int)Math.Round(d);
        }

        return 0;
    }
}
