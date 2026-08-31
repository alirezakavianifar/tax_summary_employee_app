using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
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

            if (string.IsNullOrWhiteSpace(lastName) && !string.IsNullOrWhiteSpace(firstName) && firstName.Contains(' '))
            {
                var nameParts = firstName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (nameParts.Length >= 2)
                {
                    // Payroll exports often store "LastName FirstName" in a single column.
                    firstName = nameParts[^1];
                    lastName = string.Join(' ', nameParts[..^1]);
                }
            }
            
            if (string.IsNullOrWhiteSpace(firstName)) firstName = "-";
            if (string.IsNullOrWhiteSpace(lastName)) lastName = "-";

            // Optional fields
            var serviceUnit = GetValue(props, "واحد متبوع", "واحد محل کار");
            var currentPosition = GetValue(props, "نام پست", "عنوان پست");
            var education = GetValue(props, "رشته تحصيلي");
            var appointmentPosition = GetValue(props, "پست انتصابی");
            var previousExperienceYears = ParseInt(GetValue(props, "سنوات سال"));
            var nationalIdValue = GetValue(props, "شماره ملي");
            
            // Parse Administrative Status values
            int missionDays = ParseInt(GetValue(props, "مأموريت"));
            int sickLeaveDays = ParseInt(GetValue(props, "استعلاجي"));
            int paidLeaveDays = ParseInt(GetValue(props, "استحقاقي"));
            int overtimeHours = ParseTime(GetRawValue(props, "اضافه واقعي"));
            int delayAll = ParseTime(GetRawValue(props, "جمع تأخيروتعجيل", "جمع تأخير و تعجيل"));
            int hourlyLeave = ParseTime(GetRawValue(props, "مرخصي ساعتي مجاز"));

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

    private string GetValue(IDictionary<string, object> props, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (props.TryGetValue(key, out var value) && value != null)
            {
                var text = value.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    return text;
                }
            }
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
            return result < 0 ? Math.Abs(result) : result;
        }
        return 0;
    }

    private object? GetRawValue(IDictionary<string, object> props, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (props.TryGetValue(key, out var value) && value != null)
            {
                if (value is string text && string.IsNullOrWhiteSpace(text))
                {
                    continue;
                }

                return value;
            }
        }

        return null;
    }

    private int ParseTime(object? value)
    {
        if (value == null) return 0;

        return value switch
        {
            int intValue => intValue < 0 ? 0 : intValue,
            long longValue => longValue < 0 ? 0 : (int)longValue,
            double doubleValue => ParseExcelTimeFraction(doubleValue),
            float floatValue => ParseExcelTimeFraction(floatValue),
            decimal decimalValue => ParseExcelTimeFraction((double)decimalValue),
            TimeSpan timeSpan => ConvertDurationToHoursFromTotalMinutes((int)Math.Round(timeSpan.TotalMinutes)),
            DateTime dateTime => ConvertDurationToHours(dateTime.Hour, dateTime.Minute),
            _ => ParseTimeString(value.ToString()?.Trim() ?? string.Empty)
        };
    }

    private int ParseExcelTimeFraction(double value)
    {
        if (value < 0) return 0;

        if (value > 0 && value < 1)
        {
            return ConvertDurationToHoursFromTotalMinutes((int)Math.Round(value * 24 * 60));
        }

        if (value >= 1)
        {
            var fractionalDay = value - Math.Floor(value);
            if (fractionalDay > 0)
            {
                return ConvertDurationToHoursFromTotalMinutes((int)Math.Round(fractionalDay * 24 * 60));
            }
        }

        return (int)Math.Round(value);
    }

    private int ParseTimeString(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;

        var daysDurationMatch = Regex.Match(
            value,
            @"(\d+)\s*days?,?\s*(\d+):(\d+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        if (daysDurationMatch.Success
            && int.TryParse(daysDurationMatch.Groups[1].Value, out var days)
            && int.TryParse(daysDurationMatch.Groups[2].Value, out var dayHours)
            && int.TryParse(daysDurationMatch.Groups[3].Value, out var dayMinutes))
        {
            return ConvertDurationToHours((days * 24) + dayHours, dayMinutes);
        }

        if (value.Contains(':'))
        {
            var parts = value.Split(':');
            if (parts.Length > 0 && int.TryParse(parts[0].Trim(), out var hours))
            {
                var minutes = 0;
                if (parts.Length > 1)
                {
                    int.TryParse(parts[1].Trim(), out minutes);
                }

                return ConvertDurationToHours(hours, minutes);
            }
        }

        if (int.TryParse(value, out var simpleHours))
        {
            return simpleHours < 0 ? 0 : simpleHours;
        }

        if (double.TryParse(value, out var numericValue))
        {
            return ParseExcelTimeFraction(numericValue);
        }

        return 0;
    }

    private static int ConvertDurationToHoursFromTotalMinutes(int totalMinutes)
    {
        if (totalMinutes < 0) return 0;

        var hours = totalMinutes / 60;
        var minutes = totalMinutes % 60;
        return ConvertDurationToHours(hours, minutes);
    }

    private static int ConvertDurationToHours(int hours, int minutes)
    {
        if (hours < 0) hours = 0;
        if (minutes < 0) minutes = 0;

        if (minutes >= 30)
        {
            hours++;
        }

        return hours;
    }
}
