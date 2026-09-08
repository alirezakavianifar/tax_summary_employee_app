using AutoMapper;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Mapping;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

/// <summary>
/// Implementation of Tax Refund Service coordinating domain operations and calculations
/// </summary>
public class TaxRefundService : ITaxRefundService
{
    private readonly ITaxRefundRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly RefundCalculationEngine _calculationEngine;
    private readonly ILogger<TaxRefundService> _logger;

    public TaxRefundService(
        ITaxRefundRepository repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        RefundCalculationEngine calculationEngine,
        ILogger<TaxRefundService> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _calculationEngine = calculationEngine;
        _logger = logger;
    }

    public async Task<Result<TaxRefundCaseDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundCaseDto>("پرونده استرداد مورد نظر یافت نشد");

        var dto = _mapper.Map<TaxRefundCaseDto>(refundCase);
        dto.Calculation = CalculateForCase(refundCase);

        return Result.Success(dto);
    }

    public async Task<Result<TaxRefundCaseDto>> GetByTrackingNumberAsync(string trackingNumber, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByTrackingNumberAsync(trackingNumber, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundCaseDto>($"پرونده استرداد با کد رهگیری {trackingNumber} یافت نشد");

        var dto = _mapper.Map<TaxRefundCaseDto>(refundCase);
        dto.Calculation = CalculateForCase(refundCase);

        return Result.Success(dto);
    }

    public async Task<Result<IEnumerable<TaxRefundCaseSummaryDto>>> GetCasesAsync(TaxRefundFilterDto filter, CancellationToken ct = default)
    {
        var cases = await _repository.GetCasesAsync(
            filter.TaxYear,
            filter.TaxSource,
            filter.Status,
            filter.SearchTerm,
            ct);

        var dtos = _mapper.Map<IEnumerable<TaxRefundCaseSummaryDto>>(cases);
        return Result.Success(dtos);
    }

    public async Task<Result<Guid>> CreateAsync(CreateTaxRefundCaseDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        try
        {
            var trackingNumber = !string.IsNullOrWhiteSpace(dto.CaseTrackingNumber)
                ? dto.CaseTrackingNumber.Trim()
                : $"REF-{dto.TaxYear}-{new Random().Next(1000, 9999)}";

            var refundCase = TaxRefundCase.Create(
                trackingNumber,
                dto.DocketNumber,
                dto.TaxpayerName,
                dto.EconomicCode,
                dto.TaxUnitCode,
                dto.Province,
                dto.City,
                dto.Address,
                dto.BankName,
                dto.ShebaNumber,
                dto.TaxYear,
                dto.Period,
                dto.TaxSource,
                dto.RefundReason,
                dto.AdministrationHeadName,
                dto.GroupHeadName,
                dto.SeniorAuditorName,
                currentUserId,
                dto.NationalId);

            // Add initial receipts if provided
            if (dto.Receipts != null)
            {
                foreach (var r in dto.Receipts)
                {
                    refundCase.AddReceipt(
                        r.RowIndex,
                        r.ReceiptNumber,
                        r.IssueDateJalali,
                        r.PaymentDateJalali,
                        r.AmountRials,
                        r.BankBranch,
                        r.City,
                        r.RevenueLedgerRow);
                }
            }

            // Add initial letters if provided
            if (dto.Letters != null)
            {
                foreach (var l in dto.Letters)
                {
                    refundCase.AddLetter(
                        l.LetterType,
                        l.LetterNumber,
                        l.LetterDateJalali,
                        l.Description,
                        l.DebtAmount,
                        l.DebtYear);
                }
            }

            // Add initial allocations if provided
            if (dto.Allocations != null)
            {
                foreach (var a in dto.Allocations)
                {
                    var receiptId = a.TaxRefundReceiptId;
                    if (receiptId == Guid.Empty)
                    {
                        var matching = refundCase.Receipts.FirstOrDefault(r => r.ReceiptNumber == a.ReceiptNumber)
                                       ?? refundCase.Receipts.FirstOrDefault();
                        if (matching != null)
                        {
                            receiptId = matching.Id;
                        }
                    }

                    if (receiptId != Guid.Empty)
                    {
                        refundCase.AddAllocation(
                            receiptId,
                            a.ReceiptNumber,
                            a.TotalReceiptAmount,
                            a.RefundableAmount,
                            a.BankBranch,
                            a.City,
                            a.RevenueLedgerRow);
                    }
                }
            }

            // Add initial assessment if provided
            if (dto.AssessmentInfo != null)
            {
                refundCase.UpdateAssessmentInfo(TaxAssessmentInfo.Create(
                    dto.AssessmentInfo.HasReturnFiled,
                    dto.AssessmentInfo.ReturnNumber,
                    dto.AssessmentInfo.ReturnDateJalali,
                    dto.AssessmentInfo.FinalizationMethod,
                    dto.AssessmentInfo.FinalNoticeNumber,
                    dto.AssessmentInfo.FinalNoticeDateJalali,
                    dto.AssessmentInfo.AssessedIncome,
                    dto.AssessmentInfo.Exemptions,
                    dto.AssessmentInfo.AssessedTax,
                    dto.AssessmentInfo.NonWaivablePenalties,
                    dto.AssessmentInfo.TimelyPaymentBonus));
            }

            // Perform calculation and store breakdown
            var calc = _calculationEngine.Compute(
                refundCase.AssessmentInfo,
                refundCase.Receipts,
                refundCase.Letters,
                dto.Breakdown?.StampDutyRefund ?? 0,
                dto.Breakdown?.OtherRefund ?? 0,
                dto.Breakdown?.PenaltiesRefund ?? 0,
                (int)(dto.Breakdown?.DelayDamages ?? 0));

            refundCase.UpdateBreakdown(RefundBreakdown.Create(
                calc.PrincipalTaxRefund,
                calc.StampDutyRefund,
                calc.OtherRefund,
                calc.PenaltiesRefund,
                calc.DelayDamages));

            await _repository.CreateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Tax refund case created successfully: {TrackingNumber}", refundCase.CaseTrackingNumber);
            return Result.Success(refundCase.Id);
        }
        catch (ArgumentException ex)
        {
            return Result.Failure<Guid>(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tax refund case");
            return Result.Failure<Guid>("خطا در ثبت پرونده استرداد");
        }
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateTaxRefundCaseDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            refundCase.UpdateTaxpayerInfo(
                dto.TaxpayerName,
                dto.EconomicCode,
                dto.TaxUnitCode,
                dto.Province,
                dto.City,
                dto.Address,
                dto.BankName,
                dto.ShebaNumber,
                dto.DocketNumber,
                dto.NationalId);

            refundCase.UpdateAssignedOfficers(
                dto.AdministrationHeadName,
                dto.GroupHeadName,
                dto.SeniorAuditorName);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: false, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        if (refundCase.Status != RefundCaseStatus.Draft)
            return Result.Failure("فقط پرونده‌های در وضعیت پیش‌نویس قابل حذف هستند");

        await _repository.DeleteAsync(id, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<TaxRefundReceiptDto>> AddReceiptAsync(Guid caseId, CreateTaxRefundReceiptDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundReceiptDto>("پرونده استرداد یافت نشد");

        try
        {
            var receipt = refundCase.AddReceipt(
                dto.RowIndex > 0 ? dto.RowIndex : refundCase.Receipts.Count + 1,
                dto.ReceiptNumber,
                dto.IssueDateJalali,
                dto.PaymentDateJalali,
                dto.AmountRials,
                dto.BankBranch,
                dto.City,
                dto.RevenueLedgerRow);

            RecalculateAndStoreBreakdown(refundCase);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success(_mapper.Map<TaxRefundReceiptDto>(receipt));
        }
        catch (Exception ex)
        {
            return Result.Failure<TaxRefundReceiptDto>(ex.Message);
        }
    }

    public async Task<Result> RemoveReceiptAsync(Guid caseId, Guid receiptId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            refundCase.RemoveReceipt(receiptId);
            RecalculateAndStoreBreakdown(refundCase);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result<RefundableReceiptAllocationDto>> AddAllocationAsync(Guid caseId, CreateRefundableReceiptAllocationDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<RefundableReceiptAllocationDto>("پرونده استرداد یافت نشد");

        try
        {
            var receiptId = dto.TaxRefundReceiptId;
            if (receiptId == Guid.Empty)
            {
                var matching = refundCase.Receipts.FirstOrDefault(r => r.ReceiptNumber == dto.ReceiptNumber)
                               ?? refundCase.Receipts.FirstOrDefault();
                if (matching != null)
                {
                    receiptId = matching.Id;
                }
            }

            if (receiptId == Guid.Empty)
            {
                return Result.Failure<RefundableReceiptAllocationDto>("قبض مرجع معتبری برای این تخصیص در پرونده یافت نشد");
            }

            var alloc = refundCase.AddAllocation(
                receiptId,
                dto.ReceiptNumber,
                dto.TotalReceiptAmount,
                dto.RefundableAmount,
                dto.BankBranch,
                dto.City,
                dto.RevenueLedgerRow);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success(_mapper.Map<RefundableReceiptAllocationDto>(alloc));
        }
        catch (Exception ex)
        {
            return Result.Failure<RefundableReceiptAllocationDto>(ex.Message);
        }
    }

    public async Task<Result> RemoveAllocationAsync(Guid caseId, Guid allocationId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            refundCase.RemoveAllocation(allocationId);
            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result<TaxRefundLetterDto>> AddLetterAsync(Guid caseId, CreateTaxRefundLetterDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundLetterDto>("پرونده استرداد یافت نشد");

        try
        {
            var letter = refundCase.AddLetter(
                dto.LetterType,
                dto.LetterNumber,
                dto.LetterDateJalali,
                dto.Description,
                dto.DebtAmount,
                dto.DebtYear);

            RecalculateAndStoreBreakdown(refundCase);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success(_mapper.Map<TaxRefundLetterDto>(letter));
        }
        catch (Exception ex)
        {
            return Result.Failure<TaxRefundLetterDto>(ex.Message);
        }
    }

    public async Task<Result> RemoveLetterAsync(Guid caseId, Guid letterId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            refundCase.RemoveLetter(letterId);
            RecalculateAndStoreBreakdown(refundCase);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateAssessmentAsync(Guid caseId, UpdateTaxAssessmentInfoDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            var assessment = TaxAssessmentInfo.Create(
                dto.HasReturnFiled,
                dto.ReturnNumber,
                dto.ReturnDateJalali,
                dto.FinalizationMethod,
                dto.FinalNoticeNumber,
                dto.FinalNoticeDateJalali,
                dto.AssessedIncome,
                dto.Exemptions,
                dto.AssessedTax,
                dto.NonWaivablePenalties,
                dto.TimelyPaymentBonus);

            refundCase.UpdateAssessmentInfo(assessment);
            RecalculateAndStoreBreakdown(refundCase);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateBreakdownAsync(Guid caseId, UpdateRefundBreakdownDto dto, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            var breakdown = RefundBreakdown.Create(
                dto.PrincipalTaxRefund,
                dto.StampDutyRefund,
                dto.OtherRefund,
                dto.PenaltiesRefund,
                dto.DelayDamages);

            refundCase.UpdateBreakdown(breakdown);
            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public Task<Result<RefundCalculationResultDto>> CalculateSandboxAsync(CalculateRefundRequestDto dto, CancellationToken ct = default)
    {
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: null,
            returnDateJalali: null,
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: null,
            finalNoticeDateJalali: null,
            assessedIncome: dto.AssessedIncome,
            exemptions: dto.Exemptions,
            assessedTax: dto.AssessedTax,
            nonWaivablePenalties: dto.NonWaivablePenalties,
            timelyPaymentBonus: dto.TimelyPaymentBonus);

        var receipts = new List<TaxRefundReceipt>();
        if (dto.ReceiptAmounts != null && dto.ReceiptAmounts.Any())
        {
            int idx = 1;
            foreach (var amt in dto.ReceiptAmounts)
            {
                receipts.Add(TaxRefundReceipt.Create(Guid.NewGuid(), idx++, $"RCP-{idx}", "1403/01/01", "1403/01/01", amt));
            }
        }
        else if (dto.TotalPaidAmount > 0)
        {
            receipts.Add(TaxRefundReceipt.Create(Guid.NewGuid(), 1, "RCP-TOTAL", "1403/01/01", "1403/01/01", dto.TotalPaidAmount));
        }

        var letters = new List<TaxRefundLetter>();
        if (dto.DebtAmounts != null && dto.DebtAmounts.Any())
        {
            foreach (var debt in dto.DebtAmounts)
            {
                letters.Add(TaxRefundLetter.Create(Guid.NewGuid(), TaxRefundLetterType.CollectionAndEnforcementInquiry, "INQ", "1403/01/01", null, debt));
            }
        }
        else if (dto.TotalDiscoveredDebts > 0)
        {
            letters.Add(TaxRefundLetter.Create(Guid.NewGuid(), TaxRefundLetterType.CollectionAndEnforcementInquiry, "INQ-TOTAL", "1403/01/01", null, dto.TotalDiscoveredDebts));
        }

        var calc = _calculationEngine.Compute(
            assessment,
            receipts,
            letters,
            dto.StampDuty,
            dto.Other,
            dto.Penalties,
            dto.DelayMonths);

        var resultDto = new RefundCalculationResultDto
        {
            TotalReceiptsCount = calc.TotalReceiptsCount,
            TotalPaidAmount = calc.TotalPaidAmount,
            AssessedIncome = calc.AssessedIncome,
            Exemptions = calc.Exemptions,
            TaxableBase = calc.TaxableBase,
            AssessedTax = calc.AssessedTax,
            NonWaivablePenalties = calc.NonWaivablePenalties,
            TotalAssessedTax = calc.TotalAssessedTax,
            TimelyPaymentBonus = calc.TimelyPaymentBonus,
            SurplusPaid = calc.SurplusPaid,
            TotalDiscoveredDebts = calc.TotalDiscoveredDebts,
            GrossSurplus = calc.GrossSurplus,
            PrincipalTaxRefund = calc.PrincipalTaxRefund,
            StampDutyRefund = calc.StampDutyRefund,
            OtherRefund = calc.OtherRefund,
            PenaltiesRefund = calc.PenaltiesRefund,
            DelayMonths = calc.DelayMonths,
            DelayDamages = calc.DelayDamages,
            GrandTotalRefundable = calc.GrandTotalRefundable
        };

        return Task.FromResult(Result.Success(resultDto));
    }

    public async Task<Result> TransitionStatusAsync(
        Guid id,
        TransitionStatusDto dto,
        Guid currentUserId,
        string actorName,
        string actorRole,
        CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        try
        {
            refundCase.TransitionStatus(dto.NewStatus, currentUserId, actorName, actorRole, dto.Notes);
            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result<PrintableDocumentDto>> GetPrintableDocumentAsync(Guid id, string formType, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<PrintableDocumentDto>("پرونده استرداد یافت نشد");

        var calc = CalculateForCase(refundCase);

        var doc = new PrintableDocumentDto
        {
            FormType = formType.ToLowerInvariant(),
            FormTitle = GetFormTitle(formType),
            CaseId = refundCase.Id,
            CaseTrackingNumber = refundCase.CaseTrackingNumber,
            DocketNumber = refundCase.DocketNumber,
            TaxpayerName = refundCase.TaxpayerName,
            EconomicCode = refundCase.EconomicCode,
            NationalId = refundCase.NationalId,
            TaxUnitCode = refundCase.TaxUnitCode,
            Province = refundCase.Province,
            City = refundCase.City,
            Address = refundCase.Address,
            BankName = refundCase.BankName,
            ShebaNumber = refundCase.ShebaNumber,
            TaxYear = refundCase.TaxYear,
            Period = refundCase.Period,
            TaxSourceName = TaxRefundMappingProfile.GetTaxSourceName(refundCase.TaxSource),
            RefundReason = refundCase.RefundReason,
            AdministrationHeadName = refundCase.AdministrationHeadName,
            GroupHeadName = refundCase.GroupHeadName,
            SeniorAuditorName = refundCase.SeniorAuditorName,
            TotalPaidAmountFormatted = $"{calc.TotalPaidAmount:N0}",
            GrandTotalRefundableFormatted = $"{calc.GrandTotalRefundable:N0}",
            GrandTotalRefundableInWords = NumberToWords(calc.GrandTotalRefundable),
            PrincipalTaxRefundFormatted = $"{calc.PrincipalTaxRefund:N0}",
            Assessment = _mapper.Map<TaxAssessmentInfoDto>(refundCase.AssessmentInfo),
            Calculation = calc,
            Receipts = _mapper.Map<List<TaxRefundReceiptDto>>(refundCase.Receipts.OrderBy(r => r.RowIndex).ToList()),
            Allocations = _mapper.Map<List<RefundableReceiptAllocationDto>>(refundCase.Allocations.ToList()),
            Letters = _mapper.Map<List<TaxRefundLetterDto>>(refundCase.Letters.ToList())
        };

        // Extract letter numbers & dates
        var voucherLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.RefundVoucher);
        doc.RefundVoucherNumber = voucherLetter?.LetterNumber;
        doc.RefundVoucherDate = voucherLetter?.LetterDateJalali;

        var reportLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.JustificationReport);
        doc.JustificationReportNumber = reportLetter?.LetterNumber;
        doc.JustificationReportDate = reportLetter?.LetterDateJalali;

        var commitLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.OfficeCommitment);
        doc.OfficeCommitmentNumber = commitLetter?.LetterNumber;
        doc.OfficeCommitmentDate = commitLetter?.LetterDateJalali;

        var treasuryLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.TreasuryLetter);
        doc.TreasuryLetterNumber = treasuryLetter?.LetterNumber;
        doc.TreasuryLetterDate = treasuryLetter?.LetterDateJalali;

        var requestLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.InboundTaxpayerRequest);
        doc.TaxpayerRequestNumber = requestLetter?.LetterNumber;
        doc.TaxpayerRequestDate = requestLetter?.LetterDateJalali;

        return Result.Success(doc);
    }

    private RefundCalculationResultDto CalculateForCase(TaxRefundCase refundCase)
    {
        var calc = _calculationEngine.Compute(
            refundCase.AssessmentInfo,
            refundCase.Receipts,
            refundCase.Letters,
            refundCase.Breakdown.StampDutyRefund,
            refundCase.Breakdown.OtherRefund,
            refundCase.Breakdown.PenaltiesRefund,
            (int)refundCase.Breakdown.DelayDamages);

        return new RefundCalculationResultDto
        {
            TotalReceiptsCount = calc.TotalReceiptsCount,
            TotalPaidAmount = calc.TotalPaidAmount,
            AssessedIncome = calc.AssessedIncome,
            Exemptions = calc.Exemptions,
            TaxableBase = calc.TaxableBase,
            AssessedTax = calc.AssessedTax,
            NonWaivablePenalties = calc.NonWaivablePenalties,
            TotalAssessedTax = calc.TotalAssessedTax,
            TimelyPaymentBonus = calc.TimelyPaymentBonus,
            SurplusPaid = calc.SurplusPaid,
            TotalDiscoveredDebts = calc.TotalDiscoveredDebts,
            GrossSurplus = calc.GrossSurplus,
            PrincipalTaxRefund = calc.PrincipalTaxRefund,
            StampDutyRefund = calc.StampDutyRefund,
            OtherRefund = calc.OtherRefund,
            PenaltiesRefund = calc.PenaltiesRefund,
            DelayMonths = calc.DelayMonths,
            DelayDamages = calc.DelayDamages,
            GrandTotalRefundable = calc.GrandTotalRefundable
        };
    }

    private void RecalculateAndStoreBreakdown(TaxRefundCase refundCase)
    {
        var calc = _calculationEngine.Compute(
            refundCase.AssessmentInfo,
            refundCase.Receipts,
            refundCase.Letters,
            refundCase.Breakdown.StampDutyRefund,
            refundCase.Breakdown.OtherRefund,
            refundCase.Breakdown.PenaltiesRefund,
            (int)refundCase.Breakdown.DelayDamages);

        refundCase.UpdateBreakdown(RefundBreakdown.Create(
            calc.PrincipalTaxRefund,
            calc.StampDutyRefund,
            calc.OtherRefund,
            calc.PenaltiesRefund,
            calc.DelayDamages));
    }

    private static string GetFormTitle(string formType) => formType.ToLowerInvariant() switch
    {
        "cheklist" => "چک‌لیست کنترل اسناد استردادی",
        "form1" => "نامه ذیحسابی جهت پرداخت وجه استرداد",
        "form2" => "استعلام از حوزه‌های مختلف مالیاتی",
        "form3" => "گزارش استرداد مالیات اضافه دریافتی (بخش ۱)",
        "form4" => "ادامه گزارش استرداد مالیات اضافه دریافتی (بخش ۲)",
        "form5" => "برگ استرداد مالیات اضافه دریافتی (موضوع ماده ۲۴۲ ق.م.م)",
        "form6" => "فرم تعهد اداره امور مالیاتی",
        "form7" => "جدول (الف) قبوض پرداختی برگ استرداد",
        _ => "سند استرداد مالیاتی"
    };

    private static string NumberToWords(decimal number)
    {
        if (number == 0) return "صفر ریال";
        return $"{number:N0} ریال";
    }
}
