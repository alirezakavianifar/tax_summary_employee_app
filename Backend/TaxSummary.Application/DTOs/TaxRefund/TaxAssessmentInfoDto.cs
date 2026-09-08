using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxAssessmentInfoDto
{
    public bool HasReturnFiled { get; set; }
    public string? ReturnNumber { get; set; }
    public string? ReturnDateJalali { get; set; }
    public FinalizationMethod FinalizationMethod { get; set; }
    public string FinalizationMethodName { get; set; } = string.Empty;
    public FinalityStage FinalityStage { get; set; } = FinalityStage.Tamkin;
    public string FinalityStageName { get; set; } = string.Empty;
    public string? FinalNoticeNumber { get; set; }
    public string? FinalNoticeDateJalali { get; set; }
    public decimal AssessedIncome { get; set; }
    public decimal Exemptions { get; set; }
    public decimal TaxableBase { get; set; }
    public decimal AssessedTax { get; set; }
    public decimal NonWaivablePenalties { get; set; }
    public decimal TotalAssessedTax { get; set; }
    public decimal TimelyPaymentBonus { get; set; }
}

public class UpdateTaxAssessmentInfoDto
{
    public bool HasReturnFiled { get; set; }
    public string? ReturnNumber { get; set; }
    public string? ReturnDateJalali { get; set; }
    public FinalizationMethod FinalizationMethod { get; set; }
    public FinalityStage FinalityStage { get; set; } = FinalityStage.Tamkin;
    public string? FinalNoticeNumber { get; set; }
    public string? FinalNoticeDateJalali { get; set; }
    public decimal AssessedIncome { get; set; }
    public decimal Exemptions { get; set; }
    public decimal AssessedTax { get; set; }
    public decimal NonWaivablePenalties { get; set; }
    public decimal TimelyPaymentBonus { get; set; }
}
