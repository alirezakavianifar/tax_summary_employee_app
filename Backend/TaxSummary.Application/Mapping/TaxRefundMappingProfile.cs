using AutoMapper;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.Mapping;

/// <summary>
/// AutoMapper profile for Tax Refund entities and DTOs
/// </summary>
public class TaxRefundMappingProfile : Profile
{
    public TaxRefundMappingProfile()
    {
        CreateMap<TaxRefundReceipt, TaxRefundReceiptDto>().MaxDepth(5);
        CreateMap<RefundableReceiptAllocation, RefundableReceiptAllocationDto>().MaxDepth(5);

        CreateMap<TaxRefundLetter, TaxRefundLetterDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.LetterTypeName, opt => opt.MapFrom(src => GetLetterTypeName(src.LetterType)));

        CreateMap<TaxAssessmentInfo, TaxAssessmentInfoDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.FinalizationMethodName, opt => opt.MapFrom(src => GetFinalizationMethodName(src.FinalizationMethod)));

        CreateMap<RefundBreakdown, RefundBreakdownDto>().MaxDepth(5);

        CreateMap<TaxRefundApprovalAction, TaxRefundApprovalActionDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.FromStatusName, opt => opt.MapFrom(src => GetStatusName(src.FromStatus)))
            .ForMember(dest => dest.ToStatusName, opt => opt.MapFrom(src => GetStatusName(src.ToStatus)));

        CreateMap<TaxRefundCase, TaxRefundCaseDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => GetStatusName(src.Status)))
            .ForMember(dest => dest.TaxSourceName, opt => opt.MapFrom(src => GetTaxSourceName(src.TaxSource)))
            .ForMember(dest => dest.Calculation, opt => opt.Ignore());

        CreateMap<TaxRefundCase, TaxRefundCaseSummaryDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.StatusName, opt => opt.MapFrom(src => GetStatusName(src.Status)))
            .ForMember(dest => dest.TaxSourceName, opt => opt.MapFrom(src => GetTaxSourceName(src.TaxSource)))
            .ForMember(dest => dest.ReceiptsCount, opt => opt.MapFrom(src => src.Receipts.Count))
            .ForMember(dest => dest.TotalPaidAmount, opt => opt.MapFrom(src => src.Receipts.Sum(r => r.AmountRials)))
            .ForMember(dest => dest.PrincipalTaxRefund, opt => opt.MapFrom(src => src.Breakdown.PrincipalTaxRefund))
            .ForMember(dest => dest.GrandTotalRefundable, opt => opt.MapFrom(src => src.Breakdown.GrandTotalRefundable));
    }

    public static string GetStatusName(RefundCaseStatus status) => status switch
    {
        RefundCaseStatus.Draft => "پیش‌نویس",
        RefundCaseStatus.InquiriesPending => "در انتظار پاسخ استعلامات",
        RefundCaseStatus.Audited => "گزارش توجیهی تنظیم شده",
        RefundCaseStatus.GroupHeadApproved => "تایید رئیس گروه",
        RefundCaseStatus.AdministrationHeadApproved => "تایید نهایی و دستور استرداد",
        RefundCaseStatus.TreasuryDisbursed => "پرداخت شده توسط ذیحسابی",
        RefundCaseStatus.Rejected => "رد شده",
        _ => status.ToString()
    };

    public static string GetTaxSourceName(TaxSourceType source) => source switch
    {
        TaxSourceType.CorporateIncome => "عملکرد شرکت‌ها",
        TaxSourceType.PersonalBusiness => "عملکرد مشاغل",
        TaxSourceType.SalaryPayroll => "مالیات بر حقوق",
        TaxSourceType.ValueAddedTax => "مالیات بر ارزش افزوده",
        TaxSourceType.PropertyRental => "مالیات بر درآمد اجاره",
        TaxSourceType.PropertyTransfer => "نقل و انتقال املاک",
        TaxSourceType.Vehicles => "مالیات بر خودرو",
        _ => source.ToString()
    };

    public static string GetFinalizationMethodName(FinalizationMethod method) => method switch
    {
        FinalizationMethod.ReturnAccepted => "تایید اظهارنامه",
        FinalizationMethod.AuditBooks => "رسیدگی به دفاتر",
        FinalizationMethod.AliRas => "علی‌الراس",
        FinalizationMethod.TaxExemption => "معافیت مالیاتی",
        FinalizationMethod.LossAccepted => "قبول زیان",
        _ => method.ToString()
    };

    public static string GetLetterTypeName(TaxRefundLetterType letterType) => letterType switch
    {
        TaxRefundLetterType.InboundTaxpayerRequest => "درخواست استرداد مودی",
        TaxRefundLetterType.CollectionAndEnforcementInquiry => "استعلام وصول و اجرا",
        TaxRefundLetterType.WithholdingTaxInquiry => "استعلام مالیات تکلیفی و حقوق",
        TaxRefundLetterType.EstateInquiry => "استعلام واحد ارث",
        TaxRefundLetterType.BusinessInquiry => "استعلام واحد مشاغل",
        TaxRefundLetterType.VatInquiry => "استعلام واحد ارزش افزوده",
        TaxRefundLetterType.JustificationReport => "گزارش توجیه استرداد اداره",
        TaxRefundLetterType.OfficeCommitment => "تعهد اداره امور مالیاتی",
        TaxRefundLetterType.RefundVoucher => "برگ استرداد اصلی",
        TaxRefundLetterType.TreasuryLetter => "نامه ذیحسابی",
        _ => letterType.ToString()
    };
}
