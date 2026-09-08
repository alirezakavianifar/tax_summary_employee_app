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
            .ForMember(dest => dest.FinalizationMethodName, opt => opt.MapFrom(src => GetFinalizationMethodName(src.FinalizationMethod)))
            .ForMember(dest => dest.FinalityStageName, opt => opt.MapFrom(src => GetFinalityStageName(src.FinalityStage)));

        CreateMap<RefundBreakdown, RefundBreakdownDto>().MaxDepth(5);
        CreateMap<JustificationReportInfo, JustificationReportDto>().MaxDepth(5);

        CreateMap<TaxRefundApprovalAction, TaxRefundApprovalActionDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.FromStatusName, opt => opt.MapFrom(src => GetStatusName(src.FromStatus)))
            .ForMember(dest => dest.ToStatusName, opt => opt.MapFrom(src => GetStatusName(src.ToStatus)));

        CreateMap<TaxRefundDocument, TaxRefundDocumentDto>()
            .MaxDepth(5)
            .ForMember(dest => dest.DocumentTypeDescription, opt => opt.MapFrom(src => GetDocumentTypeName(src.DocumentType)))
            .ForMember(dest => dest.FileSizeFormatted, opt => opt.MapFrom(src => FormatFileSize(src.FileSize)));

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

    public static string GetFinalityStageName(FinalityStage stage) => stage switch
    {
        FinalityStage.Tamkin => "تمکین",
        FinalityStage.TaxOfficeAgreement => "توافق در اداره امور مالیاتی",
        FinalityStage.PrimaryBoardRuling => "رای هیات بدوی",
        FinalityStage.AppellateBoardRuling => "رای هیات تجدید نظر",
        FinalityStage.Article251 => "251",
        FinalityStage.Article216 => "216",
        _ => stage.ToString()
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

    public static string GetDocumentTypeName(TaxRefundDocumentType docType) => docType switch
    {
        TaxRefundDocumentType.TaxpayerPetition => "درخواست استرداد مودی",
        TaxRefundDocumentType.ReceiptProof => "تصویر فیش/قبض پرداختی",
        TaxRefundDocumentType.AssessmentNotice => "برگ تشخیص/قطعی",
        TaxRefundDocumentType.InquiryResponse => "پاسخ استعلام عدم بدهی",
        TaxRefundDocumentType.JustificationReport => "گزارش توجیهی حسابرسی",
        TaxRefundDocumentType.OfficeCommitment => "تعهدنامه کارشناس ارشد",
        TaxRefundDocumentType.DisbursementReceipt => "رسید پرداخت ذیحسابی",
        TaxRefundDocumentType.IdentityProof => "مدارک هویتی و ثبتی",
        TaxRefundDocumentType.Other => "سایر مدارک و ضمائم",
        _ => docType.ToString()
    };

    public static string FormatFileSize(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        return $"{bytes / (1024.0 * 1024.0):F1} MB";
    }
}
