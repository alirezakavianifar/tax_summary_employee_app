using FluentValidation;
using TaxSummary.Application.DTOs;

namespace TaxSummary.Application.Validators;

/// <summary>
/// Validator for UpdateEmployeeReportDto
/// </summary>
public class UpdateEmployeeReportValidator : AbstractValidator<UpdateEmployeeReportDto>
{
    public UpdateEmployeeReportValidator()
    {
        // Employee basic information
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("نام الزامی است")
            .MaximumLength(100).WithMessage("نام نمی‌تواند بیش از 100 کاراکتر باشد");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("نام خانوادگی الزامی است")
            .MaximumLength(100).WithMessage("نام خانوادگی نمی‌تواند بیش از 100 کاراکتر باشد");

        RuleFor(x => x.Education)
            .MaximumLength(200).WithMessage("مدرک تحصیلی نمی‌تواند بیش از 200 کاراکتر باشد");

        RuleFor(x => x.ServiceUnit)
            .MaximumLength(200).WithMessage("واحد محل خدمت نمی‌تواند بیش از 200 کاراکتر باشد");

        RuleFor(x => x.CurrentPosition)
            .MaximumLength(200).WithMessage("پست سازمانی فعلی نمی‌تواند بیش از 200 کاراکتر باشد");

        RuleFor(x => x.AppointmentPosition)
            .MaximumLength(200).WithMessage("پست سازمانی موضوع انتصاب نمی‌تواند بیش از 200 کاراکتر باشد");

        RuleFor(x => x.PreviousExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("سابقه خدمتی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(60).WithMessage("سابقه خدمتی نمی‌تواند بیش از 60 سال باشد");

        // Administrative Status
        RuleFor(x => x.MissionDays)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد روز ماموریت نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(365).WithMessage("تعداد روز ماموریت نمی‌تواند بیش از 365 روز باشد");

        RuleFor(x => x.SickLeaveDays)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد روز مرخصی استعلاجی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(365).WithMessage("تعداد روز مرخصی استعلاجی نمی‌تواند بیش از 365 روز باشد");

        RuleFor(x => x.PaidLeaveDays)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد روز مرخصی استحقاقی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(365).WithMessage("تعداد روز مرخصی استحقاقی نمی‌تواند بیش از 365 روز باشد");

        RuleFor(x => x.OvertimeHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات اضافه کاری نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات اضافه کاری نمی‌تواند بیش از 8760 ساعت باشد");

        RuleFor(x => x.DelayAndAbsenceHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات تاخیر و غیبت نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات تاخیر و غیبت نمی‌تواند بیش از 8760 ساعت باشد");

        RuleFor(x => x.HourlyLeaveHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات مرخصی ساعتی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات مرخصی ساعتی نمی‌تواند بیش از 8760 ساعت باشد");

        // Performance Capabilities
        RuleFor(x => x.Capabilities)
            .NotNull().WithMessage("توانمندی‌های عملکردی الزامی است");

        RuleForEach(x => x.Capabilities).SetValidator(new CreatePerformanceCapabilityValidator());
    }
}
