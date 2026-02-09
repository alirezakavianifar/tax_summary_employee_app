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

            var rawName = GetValue(props, "نام");
            var nameParts = rawName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            var firstName = nameParts.Length > 0 ? nameParts[0] : "-";
            var lastName = nameParts.Length > 1 ? nameParts[1] : "-";
            
            var serviceUnit = GetValue(props, "واحد متبوع");
            var currentPosition = GetValue(props, "نام پست");
            
            // Parse numeric/time values
            int missionDays = ParseInt(GetValue(props, "مأموريت"));
            int incentiveHours = ParseTime(GetValue(props, "اضافه واقعي"));
            int delayAll = ParseTime(GetValue(props, "جمع تأخيروتعجيل"));
            int hourlyLeave = ParseTime(GetValue(props, "مرخصي ساعتي"));

            // Check if employee exists
            var employee = await _employeeRepository.GetByPersonnelNumberAsync(personnelNumber, cancellationToken);

            if (employee == null)
            {
                // Create new employee
                employee = Employee.Create(
                    personnelNumber,
                    firstName,
                    lastName,
                    education: "", // Not existing in Excel
                    serviceUnit,
                    currentPosition,
                    appointmentPosition: "", // Not existing in Excel
                    previousExperienceYears: 0 // Not existing in Excel
                );

                await _employeeRepository.AddAsync(employee, cancellationToken);
            }
            else
            {
                // Update existing employee info
                employee.UpdatePersonalInfo(firstName, lastName, employee.Education);
                employee.UpdateServiceUnit(serviceUnit);
                employee.UpdatePosition(currentPosition, employee.AppointmentPosition, employee.PreviousExperienceYears);
            }

            // Handle Administrative Status
            if (employee.AdministrativeStatus == null)
            {
                var status = AdministrativeStatus.Create(
                    employee.Id,
                    missionDays,
                    incentiveHours,
                    delayAll,
                    hourlyLeave
                );
                employee.SetAdministrativeStatus(status);
            }
            else
            {
                employee.AdministrativeStatus.UpdateStatus(
                    missionDays,
                    incentiveHours,
                    delayAll,
                    hourlyLeave
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
        if (int.TryParse(value, out var result))
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
