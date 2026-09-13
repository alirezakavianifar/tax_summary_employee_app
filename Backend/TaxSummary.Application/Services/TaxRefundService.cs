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
    private readonly IUserRepository _userRepository;
    private readonly IOfficeService _officeService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly RefundCalculationEngine _calculationEngine;
    private readonly IRefundDocumentStorageService _documentStorageService;
    private readonly ILogger<TaxRefundService> _logger;

    public TaxRefundService(
        ITaxRefundRepository repository,
        IUserRepository userRepository,
        IOfficeService officeService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        RefundCalculationEngine calculationEngine,
        IRefundDocumentStorageService documentStorageService,
        ILogger<TaxRefundService> logger)
    {
        _repository = repository;
        _userRepository = userRepository;
        _officeService = officeService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _calculationEngine = calculationEngine;
        _documentStorageService = documentStorageService;
        _logger = logger;
    }

    public async Task<Result<TaxRefundCaseDto>> GetByIdAsync(Guid id, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundCaseDto>("پرونده استرداد مورد نظر یافت نشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure<TaxRefundCaseDto>("شما دسترسی لازم برای مشاهده پرونده‌های این واحد/اداره مالیاتی را ندارید");
            }
        }

        var dto = _mapper.Map<TaxRefundCaseDto>(refundCase);
        dto.Calculation = CalculateForCase(refundCase);

        return Result.Success(dto);
    }

    public async Task<Result<TaxRefundCaseDto>> GetByTrackingNumberAsync(string trackingNumber, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByTrackingNumberAsync(trackingNumber, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundCaseDto>($"پرونده استرداد با کد رهگیری {trackingNumber} یافت نشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure<TaxRefundCaseDto>("شما دسترسی لازم برای مشاهده پرونده‌های این واحد/اداره مالیاتی را ندارید");
            }
        }

        var dto = _mapper.Map<TaxRefundCaseDto>(refundCase);
        dto.Calculation = CalculateForCase(refundCase);

        return Result.Success(dto);
    }

    public async Task<Result<IEnumerable<TaxRefundCaseSummaryDto>>> GetCasesAsync(TaxRefundFilterDto filter, Guid? currentUserId = null, CancellationToken ct = default)
    {
        IEnumerable<string>? allowedCodes = null;

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    var assigned = user.GetAssignedOfficeCodes().ToList();
                    if (!assigned.Any() && user.Employee != null && !string.IsNullOrWhiteSpace(user.Employee.ServiceUnit))
                    {
                        assigned.Add(user.Employee.ServiceUnit.Trim());
                    }
                    allowedCodes = assigned;
                }
            }
        }

        var cases = await _repository.GetCasesAsync(
            filter.TaxYear,
            filter.TaxSource,
            filter.Status,
            filter.SearchTerm,
            filter.OfficeCode,
            filter.GroupCode,
            filter.TaxUnitCode,
            allowedCodes,
            ct);

        var dtos = _mapper.Map<IEnumerable<TaxRefundCaseSummaryDto>>(cases);
        return Result.Success(dtos);
    }

    public async Task<Result<Guid>> CreateAsync(CreateTaxRefundCaseDto dto, Guid currentUserId, CancellationToken ct = default)
    {
        try
        {
            if (currentUserId != Guid.Empty && _userRepository != null)
            {
                var userResult = await _userRepository.GetByIdAsync(currentUserId, ct);
                if (userResult != null && userResult.IsSuccess && userResult.Value != null)
                {
                    var user = userResult.Value;
                    if (!user.HasAccessToTaxHierarchy(dto.TaxUnitCode))
                    {
                        return Result.Failure<Guid>("شما دسترسی لازم برای ثبت پرونده در واحد/اداره مالیاتی انتخاب شده را ندارید");
                    }
                }
            }

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
                    dto.AssessmentInfo.TimelyPaymentBonus,
                    dto.AssessmentInfo.FinalityStage));
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

            await LinkOfficeAsync(refundCase, ct);

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

    public async Task<Result> UpdateAsync(Guid id, UpdateTaxRefundCaseDto dto, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure("شما دسترسی ویرایش پرونده‌های این اداره مالیاتی را ندارید");

                if (!string.IsNullOrWhiteSpace(dto.TaxUnitCode) && !user.HasAccessToTaxHierarchy(dto.TaxUnitCode))
                    return Result.Failure("شما دسترسی انتساب پرونده به این واحد/اداره مالیاتی را ندارید");
            }
        }

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

            await LinkOfficeAsync(refundCase, ct);

            refundCase.UpdateAssignedOfficers(
                dto.AdministrationHeadName,
                dto.GroupHeadName,
                dto.SeniorAuditorName);

            if (dto.TaxYear.HasValue && dto.TaxSource.HasValue)
            {
                refundCase.UpdateScope(dto.TaxYear.Value, dto.TaxSource.Value, dto.Period ?? refundCase.Period);
            }

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> UpdateFullAsync(Guid id, CreateTaxRefundCaseDto dto, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        if (refundCase.Status == RefundCaseStatus.AdministrationHeadApproved || refundCase.Status == RefundCaseStatus.TreasuryDisbursed)
            return Result.Failure("پرونده پس از تایید نهایی رئیس امور یا پرداخت در ذیحسابی قابل ویرایش نمی‌باشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure("شما دسترسی ویرایش پرونده‌های این اداره مالیاتی را ندارید");

                if (!string.IsNullOrWhiteSpace(dto.TaxUnitCode) && !user.HasAccessToTaxHierarchy(dto.TaxUnitCode))
                    return Result.Failure("شما دسترسی انتساب پرونده به این واحد/اداره مالیاتی را ندارید");
            }
        }

        try
        {
            // 1. Update Taxpayer & Officers
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

            await LinkOfficeAsync(refundCase, ct);

            refundCase.UpdateAssignedOfficers(
                dto.AdministrationHeadName,
                dto.GroupHeadName,
                dto.SeniorAuditorName);

            refundCase.UpdateScope(dto.TaxYear, dto.TaxSource, dto.Period);

            // 2. Sync Allocations and Receipts
            var existingAllocations = refundCase.Allocations.ToList();
            foreach (var a in existingAllocations)
            {
                refundCase.RemoveAllocation(a.Id);
            }

            var existingReceipts = refundCase.Receipts.ToList();
            foreach (var r in existingReceipts)
            {
                refundCase.RemoveReceipt(r.Id);
            }

            var receiptMap = new Dictionary<string, Guid>();
            if (dto.Receipts != null)
            {
                foreach (var r in dto.Receipts)
                {
                    var added = refundCase.AddReceipt(
                        r.RowIndex,
                        r.ReceiptNumber,
                        r.IssueDateJalali,
                        r.PaymentDateJalali,
                        r.AmountRials,
                        r.BankBranch,
                        r.City,
                        r.RevenueLedgerRow);

                    if (!string.IsNullOrEmpty(added.ReceiptNumber))
                        receiptMap[added.ReceiptNumber] = added.Id;
                }
            }

            if (dto.Allocations != null)
            {
                foreach (var a in dto.Allocations)
                {
                    var receiptId = a.TaxRefundReceiptId;
                    if (receiptId == Guid.Empty && !string.IsNullOrEmpty(a.ReceiptNumber) && receiptMap.TryGetValue(a.ReceiptNumber, out var mappedId))
                    {
                        receiptId = mappedId;
                    }
                    else if (receiptId == Guid.Empty)
                    {
                        var matchingReceipt = refundCase.Receipts.FirstOrDefault(r => r.ReceiptNumber == a.ReceiptNumber);
                        if (matchingReceipt != null)
                            receiptId = matchingReceipt.Id;
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

            // 3. Sync Letters
            var existingLetters = refundCase.Letters.ToList();
            foreach (var l in existingLetters)
            {
                refundCase.RemoveLetter(l.Id);
            }

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

            // 4. Update Assessment Info
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
                    dto.AssessmentInfo.TimelyPaymentBonus,
                    dto.AssessmentInfo.FinalityStage));
            }

            // 5. Recompute and Update Breakdown
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

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Tax refund case full update succeeded: {Id} - {TrackingNumber}", refundCase.Id, refundCase.CaseTrackingNumber);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing full update on tax refund case {Id}", id);
            return Result.Failure(ex.Message);
        }
    }

    public async Task<Result> DeleteAsync(Guid id, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: false, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد یافت نشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure("شما دسترسی حذف پرونده‌های این اداره مالیاتی را ندارید");
            }
        }

        if (refundCase.Status != RefundCaseStatus.Draft && refundCase.Status != RefundCaseStatus.Rejected)
            return Result.Failure("فقط پرونده‌های در وضعیت پیش‌نویس یا رد شده قابل حذف هستند");

        await _repository.DeleteAsync(id, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        try
        {
            var uploadsFolder = Path.Combine(AppContext.BaseDirectory, "App_Data", "uploads", "refund-documents", id.ToString());
            if (Directory.Exists(uploadsFolder))
            {
                Directory.Delete(uploadsFolder, true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clean up refund documents directory for case {CaseId}", id);
        }

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
                dto.TimelyPaymentBonus,
                dto.FinalityStage);

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

        if (currentUserId != Guid.Empty && _userRepository != null)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId, ct);
            if (userResult != null && userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.CanVerifyStage(dto.NewStatus, refundCase.TaxUnitCode))
                {
                    return Result.Failure($"شما با نقش '{actorRole}' و اداره انتسابی، مجاز به تایید این پرونده در مرحله مربوطه نمی‌باشید.");
                }
            }
        }

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

    public async Task<Result<PrintableDocumentDto>> GetPrintableDocumentAsync(Guid id, string formType, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(id, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<PrintableDocumentDto>("پرونده استرداد یافت نشد");

        if (currentUserId.HasValue && currentUserId.Value != Guid.Empty)
        {
            var userResult = await _userRepository.GetByIdAsync(currentUserId.Value, ct);
            if (userResult.IsSuccess && userResult.Value != null)
            {
                var user = userResult.Value;
                if (!user.HasAccessToTaxHierarchy(refundCase.TaxUnitCode))
                    return Result.Failure<PrintableDocumentDto>("شما دسترسی لازم برای چاپ یا مشاهده مدارک این اداره مالیاتی را ندارید");
            }
        }

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

        // Default Jalali date of the case (FinalizedAt -> SubmittedAt -> CreatedAt -> UtcNow)
        var defaultCaseDateJalali = TaxSummary.Domain.ValueObjects.JalaliDate.FromDateTime(
            refundCase.FinalizedAt ?? refundCase.SubmittedAt ?? (refundCase.CreatedAt != default ? refundCase.CreatedAt : DateTime.UtcNow)
        ).ToString();

        doc.JustificationReport = BuildJustificationReportDto(refundCase, calc, defaultCaseDateJalali);

        // Extract letter numbers & dates with sensible fallbacks to case tracking number & Persian date
        var voucherLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.RefundVoucher);
        doc.RefundVoucherNumber = !string.IsNullOrWhiteSpace(voucherLetter?.LetterNumber)
            ? voucherLetter.LetterNumber
            : refundCase.CaseTrackingNumber;
        doc.RefundVoucherDate = !string.IsNullOrWhiteSpace(voucherLetter?.LetterDateJalali)
            ? voucherLetter.LetterDateJalali
            : defaultCaseDateJalali;

        var reportLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.JustificationReport);
        doc.JustificationReportNumber = !string.IsNullOrWhiteSpace(refundCase.JustificationReport?.ReportNumber)
            ? refundCase.JustificationReport.ReportNumber
            : (!string.IsNullOrWhiteSpace(reportLetter?.LetterNumber) ? reportLetter.LetterNumber : refundCase.CaseTrackingNumber);
        doc.JustificationReportDate = !string.IsNullOrWhiteSpace(refundCase.JustificationReport?.ReportDateJalali)
            ? refundCase.JustificationReport.ReportDateJalali
            : (!string.IsNullOrWhiteSpace(reportLetter?.LetterDateJalali) ? reportLetter.LetterDateJalali : defaultCaseDateJalali);

        var commitLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.OfficeCommitment);
        doc.OfficeCommitmentNumber = !string.IsNullOrWhiteSpace(commitLetter?.LetterNumber)
            ? commitLetter.LetterNumber
            : refundCase.CaseTrackingNumber;
        doc.OfficeCommitmentDate = !string.IsNullOrWhiteSpace(commitLetter?.LetterDateJalali)
            ? commitLetter.LetterDateJalali
            : defaultCaseDateJalali;

        var treasuryLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.TreasuryLetter);
        doc.TreasuryLetterNumber = !string.IsNullOrWhiteSpace(treasuryLetter?.LetterNumber)
            ? treasuryLetter.LetterNumber
            : refundCase.CaseTrackingNumber;
        doc.TreasuryLetterDate = !string.IsNullOrWhiteSpace(treasuryLetter?.LetterDateJalali)
            ? treasuryLetter.LetterDateJalali
            : doc.RefundVoucherDate;

        var requestLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.InboundTaxpayerRequest);
        doc.TaxpayerRequestNumber = requestLetter?.LetterNumber;
        doc.TaxpayerRequestDate = !string.IsNullOrWhiteSpace(requestLetter?.LetterDateJalali)
            ? requestLetter.LetterDateJalali
            : defaultCaseDateJalali;

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

    public async Task<Result<TaxRefundDocumentDto>> UploadDocumentAsync(
        Guid caseId,
        Microsoft.AspNetCore.Http.IFormFile file,
        UploadTaxRefundDocumentDto dto,
        Guid currentUserId,
        string currentUserName,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return Result.Failure<TaxRefundDocumentDto>("لطفاً فایل PDF سند را انتخاب نمایید");

        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<TaxRefundDocumentDto>("پرونده استرداد مورد نظر یافت نشد");

        try
        {
            var (storedFileName, relativePath, fileSize) = await _documentStorageService.SavePdfAsync(file, caseId, ct);
            var jalaliDate = TaxSummary.Domain.ValueObjects.JalaliDate.FromDateTime(DateTime.UtcNow).ToString();

            var document = refundCase.AddDocument(
                dto.DocumentType,
                dto.Title,
                file.FileName,
                storedFileName,
                relativePath,
                fileSize,
                jalaliDate,
                currentUserId,
                currentUserName,
                dto.Description,
                dto.RelatedReceiptId,
                dto.RelatedLetterId,
                "application/pdf");

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            _logger.LogInformation("Document {DocTitle} uploaded successfully for refund case {CaseId}", dto.Title, caseId);

            var documentDto = _mapper.Map<TaxRefundDocumentDto>(document);
            return Result.Success(documentDto);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error during document upload for case {CaseId}", caseId);
            return Result.Failure<TaxRefundDocumentDto>(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error uploading document for case {CaseId}", caseId);
            return Result.Failure<TaxRefundDocumentDto>("خطای سیستمی در ذخیره‌سازی فایل پیوست");
        }
    }

    public async Task<Result<IEnumerable<TaxRefundDocumentDto>>> GetDocumentsAsync(Guid caseId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<IEnumerable<TaxRefundDocumentDto>>("پرونده استرداد مورد نظر یافت نشد");

        var dtos = _mapper.Map<IEnumerable<TaxRefundDocumentDto>>(refundCase.Documents.OrderByDescending(d => d.CreatedAt));
        return Result.Success(dtos);
    }

    public async Task<Result<(Stream Stream, string ContentType, string FileName)>> GetDocumentStreamAsync(
        Guid caseId,
        Guid documentId,
        CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<(Stream Stream, string ContentType, string FileName)>("پرونده استرداد مورد نظر یافت نشد");

        var document = refundCase.Documents.FirstOrDefault(d => d.Id == documentId);
        if (document == null)
            return Result.Failure<(Stream Stream, string ContentType, string FileName)>("سند پیوست مورد نظر یافت نشد");

        try
        {
            var streamResult = await _documentStorageService.GetPdfStreamAsync(document.FilePath, document.OriginalFileName, ct);
            return Result.Success(streamResult);
        }
        catch (FileNotFoundException)
        {
            _logger.LogWarning("Physical document file not found: {Path}", document.FilePath);
            return Result.Failure<(Stream Stream, string ContentType, string FileName)>("فایل فیزیکی سند در سرور یافت نشد");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading document stream {DocId} for case {CaseId}", documentId, caseId);
            return Result.Failure<(Stream Stream, string ContentType, string FileName)>("خطا در بارگذاری فایل سند");
        }
    }

    public async Task<Result> DeleteDocumentAsync(
        Guid caseId,
        Guid documentId,
        Guid currentUserId,
        CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure("پرونده استرداد مورد نظر یافت نشد");

        var document = refundCase.Documents.FirstOrDefault(d => d.Id == documentId);
        if (document == null)
            return Result.Failure("سند پیوست مورد نظر یافت نشد");

        try
        {
            await _documentStorageService.DeletePdfAsync(document.FilePath, ct);
            refundCase.RemoveDocument(documentId);
            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Document {DocId} removed from refund case {CaseId}", documentId, caseId);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocId} for case {CaseId}", documentId, caseId);
            return Result.Failure("خطا در حذف سند پیوست");
        }
    }

    public async Task<Result<JustificationReportDto>> GetJustificationReportAsync(Guid caseId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<JustificationReportDto>("پرونده استرداد مورد نظر یافت نشد");

        if (refundCase.JustificationReport != null && !string.IsNullOrWhiteSpace(refundCase.JustificationReport.ReportNumber))
        {
            return Result.Success(_mapper.Map<JustificationReportDto>(refundCase.JustificationReport));
        }

        return await GenerateDefaultDraftAsync(caseId, ct);
    }

    public async Task<Result<JustificationReportDto>> GenerateDefaultDraftAsync(Guid caseId, CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<JustificationReportDto>("پرونده استرداد مورد نظر یافت نشد");

        var calc = CalculateForCase(refundCase);
        var todayJalali = TaxSummary.Domain.ValueObjects.JalaliDate.FromDateTime(DateTime.UtcNow).ToString();

        var dto = BuildJustificationReportDto(refundCase, calc, todayJalali);
        return Result.Success(dto);
    }

    private JustificationReportDto BuildJustificationReportDto(TaxRefundCase refundCase, RefundCalculationResultDto calc, string todayJalali)
    {
        var requestLetter = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.InboundTaxpayerRequest);
        var inqCollection = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.CollectionAndEnforcementInquiry);
        var inqPayroll = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.WithholdingTaxInquiry);
        var inqVat = refundCase.Letters.FirstOrDefault(l => l.LetterType == TaxRefundLetterType.VatInquiry);

        var findings = $"۱- مودی محترم به موجب تقاضای وارده به شماره {(requestLetter?.LetterNumber ?? "..........")} مورخ {(requestLetter?.LetterDateJalali ?? todayJalali)} ثبت دبیرخانه این اداره، تقاضای استرداد اضافه پرداختی مالیات عملکرد سال {refundCase.TaxYear} خود را مطرح نموده است.\n" +
                       $"۲- {(refundCase.AssessmentInfo.HasReturnFiled ? $"مودی اظهارنامه مالیاتی عملکرد مربوطه را تحت شماره {refundCase.AssessmentInfo.ReturnNumber ?? ".........."} مورخ {refundCase.AssessmentInfo.ReturnDateJalali ?? todayJalali} در موعد قانونی تسلیم نموده است." : "مودی نسبت به تسلیم اظهارنامه مالیاتی در موعد قانونی اقدام ننموده است.")}\n" +
                       $"۳- پس از بررسی اسناد، دفاتر قانونی و سوابق مالیاتی، مالیات عملکرد به موجب «{TaxRefundMappingProfile.GetFinalizationMethodName(refundCase.AssessmentInfo.FinalizationMethod)}» و در مرحله قطعیت «{TaxRefundMappingProfile.GetFinalityStageName(refundCase.AssessmentInfo.FinalityStage)}» به شماره برگ قطعی {refundCase.AssessmentInfo.FinalNoticeNumber ?? ".........."} مورخ {refundCase.AssessmentInfo.FinalNoticeDateJalali ?? todayJalali} تعیین و قطعی گردیده است.";

        var legalBasis = "وفق مفاد ماده ۲۴۲ قانون مالیات‌های مستقیم و تبصره‌های آن، چنانچه در اثر اشتباه در محاسبه یا واریز، مبلغی اضافه بر مالیات مقرر قطعی پرداخت شده باشد، اداره امور مالیاتی مکلف است پس از احراز اضافه دریافتی، نسبت به استرداد آن از محل وصولی‌های جاری اقدام نماید.";

        var debtNarratives = new List<string>();
        if (inqCollection != null && inqCollection.DebtAmount > 0)
            debtNarratives.Add($"اداره وصول و اجرا (شماره {inqCollection.LetterNumber}): مبلغ {inqCollection.DebtAmount:N0} ریال بدهی قطعی سنواتی");
        if (inqPayroll != null && inqPayroll.DebtAmount > 0)
            debtNarratives.Add($"واحد مالیات تکلیفی و حقوق (شماره {inqPayroll.LetterNumber}): مبلغ {inqPayroll.DebtAmount:N0} ریال بدهی");
        if (inqVat != null && inqVat.DebtAmount > 0)
            debtNarratives.Add($"واحد مالیات بر ارزش افزوده (شماره {inqVat.LetterNumber}): مبلغ {inqVat.DebtAmount:N0} ریال بدهی");

        string inquiriesSummary;
        if (debtNarratives.Any())
        {
            inquiriesSummary = "بر اساس پاسخ استعلامات واصله از واحدهای مالیاتی تابعه، بدهی‌های سنواتی زیر شناسایی و از مازاد پرداختی کسر گردید:\n" +
                               string.Join("\n", debtNarratives.Select(d => $"• {d}")) +
                               $"\nجمع کل بدهی‌های کسر شده: {calc.TotalDiscoveredDebts:N0} ریال.";
        }
        else
        {
            inquiriesSummary = "پاسخ استعلامات واصله از کلیه واحدهای مالیاتی تابعه (وصول و اجرا، حقوق، ارزش افزوده) حاکی از عدم وجود هرگونه بدهی قطعی سنواتی برای مودی در پرونده‌های دیگر می‌باشد.";
        }

        var receiptsNotes = $"اصالت و مشخصات تعداد {calc.TotalReceiptsCount} فقره قبوض پرداختی مودی مندرج در جدول (الف) به مبلغ کل {calc.TotalPaidAmount:N0} ریال از طریق سامانه‌های بانکی و وصولی اداره کل بررسی و صحّت واریز آن احراز گردید و تایید می‌شود که قبوض مزبور قبلاً مورد استرداد یا تهاتر واقع نگردیده‌اند.";

        var conclusion = $"با عنایت به مراتب فوق، مازاد پرداختی اولیه مودی مبلغ {calc.GrossSurplus:N0} ریال بوده که پس از کسر بدهی‌های مکشوفه، خالص مبلغ قابل استرداد معادل {calc.PrincipalTaxRefund:N0} ریال (به حروف: {NumberToWords(calc.PrincipalTaxRefund)}) محرز و تایید می‌گردد و جهت صدور دستور استرداد و سیر مراحل قانونی به حضور رئیس محترم گروه مالیاتی ایفاد می‌گردد.";

        var reportNumber = $"{refundCase.TaxUnitCode}/استرداد/{refundCase.TaxYear}";

        return new JustificationReportDto
        {
            ReportNumber = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.ReportNumber) ? reportNumber : refundCase.JustificationReport.ReportNumber,
            ReportDateJalali = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.ReportDateJalali) ? todayJalali : refundCase.JustificationReport.ReportDateJalali,
            AuditExaminationFindings = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.AuditExaminationFindings) ? findings : refundCase.JustificationReport.AuditExaminationFindings,
            LegalGroundsAndReasoning = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.LegalGroundsAndReasoning) ? legalBasis : refundCase.JustificationReport.LegalGroundsAndReasoning,
            InquiriesAndDebtClearanceSummary = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.InquiriesAndDebtClearanceSummary) ? inquiriesSummary : refundCase.JustificationReport.InquiriesAndDebtClearanceSummary,
            ReceiptsVerificationNotes = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.ReceiptsVerificationNotes) ? receiptsNotes : refundCase.JustificationReport.ReceiptsVerificationNotes,
            AuditorConclusion = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.AuditorConclusion) ? conclusion : refundCase.JustificationReport.AuditorConclusion,
            RecommendedRefundAmount = refundCase.JustificationReport?.RecommendedRefundAmount > 0 ? refundCase.JustificationReport.RecommendedRefundAmount : calc.PrincipalTaxRefund,
            AuditorSignatureDate = refundCase.JustificationReport?.AuditorSignatureDate ?? todayJalali,
            AuditorUserId = refundCase.JustificationReport?.AuditorUserId,
            AuditorUserName = string.IsNullOrWhiteSpace(refundCase.JustificationReport?.AuditorUserName) ? refundCase.SeniorAuditorName : refundCase.JustificationReport.AuditorUserName,
            IsFinalized = refundCase.JustificationReport?.IsFinalized ?? false,
            FinalizedAt = refundCase.JustificationReport?.FinalizedAt,
            GroupHeadOpinionText = refundCase.JustificationReport?.GroupHeadOpinionText,
            AdministrationHeadApprovalText = refundCase.JustificationReport?.AdministrationHeadApprovalText
        };
    }

    public async Task<Result<JustificationReportDto>> SaveJustificationReportAsync(
        Guid caseId,
        UpdateJustificationReportDto dto,
        Guid currentUserId,
        string currentUserName,
        CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<JustificationReportDto>("پرونده استرداد مورد نظر یافت نشد");

        try
        {
            var reportInfo = JustificationReportInfo.Create(
                dto.ReportNumber,
                dto.ReportDateJalali,
                dto.AuditExaminationFindings,
                dto.LegalGroundsAndReasoning,
                dto.InquiriesAndDebtClearanceSummary,
                dto.ReceiptsVerificationNotes,
                dto.AuditorConclusion,
                dto.RecommendedRefundAmount,
                refundCase.JustificationReport?.AuditorSignatureDate,
                currentUserId,
                currentUserName,
                refundCase.JustificationReport?.IsFinalized ?? false,
                refundCase.JustificationReport?.FinalizedAt,
                dto.GroupHeadOpinionText,
                dto.AdministrationHeadApprovalText);

            refundCase.UpdateJustificationReport(reportInfo);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Justification report updated for case {CaseId} by {User}", caseId, currentUserName);
            return Result.Success(_mapper.Map<JustificationReportDto>(refundCase.JustificationReport));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving justification report for case {CaseId}", caseId);
            return Result.Failure<JustificationReportDto>(ex.Message);
        }
    }

    public async Task<Result<JustificationReportDto>> FinalizeJustificationReportAsync(
        Guid caseId,
        FinalizeJustificationReportDto dto,
        Guid currentUserId,
        string currentUserName,
        CancellationToken ct = default)
    {
        var refundCase = await _repository.GetByIdAsync(caseId, includeDetails: true, ct);
        if (refundCase == null)
            return Result.Failure<JustificationReportDto>("پرونده استرداد مورد نظر یافت نشد");

        try
        {
            var sigDate = !string.IsNullOrWhiteSpace(dto.SignatureDateJalali)
                ? dto.SignatureDateJalali
                : TaxSummary.Domain.ValueObjects.JalaliDate.FromDateTime(DateTime.UtcNow).ToString();

            // Fallback: if no authenticated user (dev/local mode), use the case's senior auditor identity
            var effectiveUserId = currentUserId == Guid.Empty
                ? (refundCase.JustificationReport?.AuditorUserId ?? new Guid("11111111-1111-1111-1111-111111111111"))
                : currentUserId;
            var effectiveUserName = string.IsNullOrWhiteSpace(currentUserName)
                ? (!string.IsNullOrWhiteSpace(refundCase.SeniorAuditorName) ? refundCase.SeniorAuditorName : "کارشناس ارشد مالیاتی")
                : currentUserName;

            refundCase.FinalizeJustificationReport(effectiveUserId, effectiveUserName, sigDate);

            await _repository.UpdateAsync(refundCase, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Justification report finalized for case {CaseId} by {User}", caseId, currentUserName);
            return Result.Success(_mapper.Map<JustificationReportDto>(refundCase.JustificationReport));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finalizing justification report for case {CaseId}", caseId);
            return Result.Failure<JustificationReportDto>(ex.Message);
        }
    }

    private async Task LinkOfficeAsync(TaxRefundCase refundCase, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refundCase.OfficeCode) || _officeService == null) return;

        try
        {
            var offices = await _officeService.GetAllOfficesAsync(ct);
            if (offices == null) return;

            var targetOffice = offices.FirstOrDefault(o =>
                o.Code.Equals(refundCase.OfficeCode, StringComparison.OrdinalIgnoreCase) ||
                (refundCase.OfficeCode.Length >= 4 && o.Code.Equals(refundCase.OfficeCode.Substring(0, 4), StringComparison.OrdinalIgnoreCase)) ||
                (o.Code.Length >= 4 && refundCase.OfficeCode.StartsWith(o.Code, StringComparison.OrdinalIgnoreCase)));

            if (targetOffice != null)
            {
                refundCase.SetOffice(targetOffice.Id, targetOffice.Code);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to automatically link office for case {TrackingNumber} with office code {OfficeCode}", refundCase.CaseTrackingNumber, refundCase.OfficeCode);
        }
    }
}
