using FluentValidation;
using TaxSummary.Application.DTOs;

namespace TaxSummary.Application.Validators;

/// <summary>
/// Validator for CreateEmployeeReportDto
/// </summary>
public class CreateEmployeeReportValidator : AbstractValidator<CreateEmployeeReportDto>
{
    public CreateEmployeeReportValidator()
    {
        // Employee basic information
        RuleFor(x => x.PersonnelNumber)
            .NotEmpty().WithMessage("شماره پرسنلی الزامی است")
            .MaximumLength(50).WithMessage("شماره پرسنلی نمی‌تواند بیش از 50 کاراکتر باشد");

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

        RuleFor(x => x.IncentiveHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات تشویقی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات تشویقی نمی‌تواند بیش از 8760 ساعت باشد");

        RuleFor(x => x.DelayAndAbsenceHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات تاخیر و غیبت نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات تاخیر و غیبت نمی‌تواند بیش از 8760 ساعت باشد");

        RuleFor(x => x.HourlyLeaveHours)
            .GreaterThanOrEqualTo(0).WithMessage("ساعات مرخصی ساعتی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(8760).WithMessage("ساعات مرخصی ساعتی نمی‌تواند بیش از 8760 ساعت باشد");

        // Status Description
        RuleFor(x => x.StatusDescription)
            .MaximumLength(2000).WithMessage("توضیحات وضعیت نمی‌تواند بیشتر از 2000 کاراکتر باشد");

        // Performance Capabilities
        RuleFor(x => x.Capabilities)
            .NotNull().WithMessage("توانمندی‌های عملکردی الزامی است");

        RuleForEach(x => x.Capabilities).SetValidator(new CreatePerformanceCapabilityValidator());
    }
}

/// <summary>
/// Validator for CreatePerformanceCapabilityDto
/// </summary>
public class CreatePerformanceCapabilityValidator : AbstractValidator<CreatePerformanceCapabilityDto>
{
    public CreatePerformanceCapabilityValidator()
    {
        RuleFor(x => x.SystemRole)
            .NotEmpty().WithMessage("نقش در سامانه الزامی است")
            .MaximumLength(200).WithMessage("نقش در سامانه نمی‌تواند بیش از 200 کاراکتر باشد");

        // Validation for quantity fields
        RuleFor(x => x.DetectionOfTaxIssues_Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد تشخیص مشاغل نمی‌تواند منفی باشد");

        RuleFor(x => x.DetectionOfTaxEvasion_Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد تشخیص فرار مالیاتی نمی‌تواند منفی باشد");

        RuleFor(x => x.CompanyIdentification_Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد تشخیص شرکت نمی‌تواند منفی باشد");

        RuleFor(x => x.ValueAddedRecognition_Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد تشخیص ارزش افزوده نمی‌تواند منفی باشد");

        RuleFor(x => x.ReferredOrExecuted_Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("تعداد ارجاع یا اجرا نمی‌تواند منفی باشد");

        // Validation for amount fields
        RuleFor(x => x.DetectionOfTaxIssues_Amount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ تشخیص مشاغل نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(999999999999.99m).WithMessage("مبلغ تشخیص مشاغل بیش از حد مجاز است");

        RuleFor(x => x.DetectionOfTaxEvasion_Amount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ تشخیص فرار مالیاتی نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(999999999999.99m).WithMessage("مبلغ تشخیص فرار مالیاتی بیش از حد مجاز است");

        RuleFor(x => x.CompanyIdentification_Amount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ تشخیص شرکت نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(999999999999.99m).WithMessage("مبلغ تشخیص شرکت بیش از حد مجاز است");

        RuleFor(x => x.ValueAddedRecognition_Amount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ تشخیص ارزش افزوده نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(999999999999.99m).WithMessage("مبلغ تشخیص ارزش افزوده بیش از حد مجاز است");

        RuleFor(x => x.ReferredOrExecuted_Amount)
            .GreaterThanOrEqualTo(0).WithMessage("مبلغ ارجاع یا اجرا نمی‌تواند منفی باشد")
            .LessThanOrEqualTo(999999999999.99m).WithMessage("مبلغ ارجاع یا اجرا بیش از حد مجاز است");
    }
}
