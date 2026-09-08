using TaxSummary.Domain.ValueObjects;

namespace TaxSummary.Domain.Entities;

/// <summary>
/// Aggregate Root representing an official Tax Refund Case under Articles 242 and 243
/// پرونده استرداد مالیات اضافه دریافتی (موضوع مواد ۲۴۲ و ۲۴۳ قانون مالیات‌های مستقیم)
/// </summary>
public class TaxRefundCase
{
    public Guid Id { get; private set; }

    /// <summary>
    /// شماره پیگیری یکتا در سامانه
    /// </summary>
    public string CaseTrackingNumber { get; private set; } = string.Empty;

    /// <summary>
    /// شماره پرونده مالیاتی
    /// </summary>
    public string DocketNumber { get; private set; } = string.Empty;

    // Taxpayer Information (اطلاعات مودی)
    public string TaxpayerName { get; private set; } = string.Empty;
    public string EconomicCode { get; private set; } = string.Empty;
    public string? NationalId { get; private set; }
    public string TaxUnitCode { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;

    // Banking Details (اطلاعات بانکی مودی جهت استرداد)
    public string BankName { get; private set; } = string.Empty;
    public string ShebaNumber { get; private set; } = string.Empty;

    // Tax Case Scope (دامنه و منبع پرونده)
    public int TaxYear { get; private set; }
    public int Period { get; private set; } = 1;
    public TaxSourceType TaxSource { get; private set; }
    public string RefundReason { get; private set; } = string.Empty;

    // Presiding Officers (مقامات مسئول)
    public string AdministrationHeadName { get; private set; } = string.Empty; // رئیس امور
    public string GroupHeadName { get; private set; } = string.Empty; // رئیس گروه
    public string SeniorAuditorName { get; private set; } = string.Empty; // کارشناس ارشد مالیاتی

    // Workflow Status
    public RefundCaseStatus Status { get; private set; } = RefundCaseStatus.Draft;

    // Owned Complex Objects
    public TaxAssessmentInfo AssessmentInfo { get; private set; } = new();
    public RefundBreakdown Breakdown { get; private set; } = new();

    // Child Collections
    public ICollection<TaxRefundReceipt> Receipts { get; private set; } = new List<TaxRefundReceipt>();
    public ICollection<RefundableReceiptAllocation> Allocations { get; private set; } = new List<RefundableReceiptAllocation>();
    public ICollection<TaxRefundLetter> Letters { get; private set; } = new List<TaxRefundLetter>();
    public ICollection<TaxRefundApprovalAction> Approvals { get; private set; } = new List<TaxRefundApprovalAction>();
    public ICollection<TaxRefundDocument> Documents { get; private set; } = new List<TaxRefundDocument>();

    // Audit Metadata
    public Guid CreatedByUserId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    public DateTime? FinalizedAt { get; private set; }

    // Parameterless constructor for EF Core
    private TaxRefundCase() { }

    public static TaxRefundCase Create(
        string caseTrackingNumber,
        string docketNumber,
        string taxpayerName,
        string economicCode,
        string taxUnitCode,
        string province,
        string city,
        string address,
        string bankName,
        string shebaNumber,
        int taxYear,
        int period,
        TaxSourceType taxSource,
        string refundReason,
        string administrationHeadName,
        string groupHeadName,
        string seniorAuditorName,
        Guid createdByUserId,
        string? nationalId = null)
    {
        if (string.IsNullOrWhiteSpace(caseTrackingNumber))
            throw new ArgumentException("شماره پیگیری پرونده نمی‌تواند خالی باشد", nameof(caseTrackingNumber));

        if (string.IsNullOrWhiteSpace(taxpayerName))
            throw new ArgumentException("عنوان مودی نمی‌تواند خالی باشد", nameof(taxpayerName));

        if (string.IsNullOrWhiteSpace(economicCode))
            throw new ArgumentException("شماره اقتصادی نمی‌تواند خالی باشد", nameof(economicCode));

        if (taxYear < 1300 || taxYear > 1500)
            throw new ArgumentException($"سال استرداد نامعتبر است ({taxYear})", nameof(taxYear));

        var now = DateTime.UtcNow;

        var refundCase = new TaxRefundCase
        {
            Id = Guid.NewGuid(),
            CaseTrackingNumber = caseTrackingNumber.Trim(),
            DocketNumber = docketNumber.Trim(),
            TaxpayerName = taxpayerName.Trim(),
            EconomicCode = ValueObjects.EconomicCode.NormalizeDigits(economicCode.Trim()),
            NationalId = nationalId?.Trim(),
            TaxUnitCode = taxUnitCode.Trim(),
            Province = province.Trim(),
            City = city.Trim(),
            Address = address.Trim(),
            BankName = bankName.Trim(),
            ShebaNumber = shebaNumber.Trim().ToUpperInvariant(),
            TaxYear = taxYear,
            Period = period,
            TaxSource = taxSource,
            RefundReason = refundReason.Trim(),
            AdministrationHeadName = administrationHeadName.Trim(),
            GroupHeadName = groupHeadName.Trim(),
            SeniorAuditorName = seniorAuditorName.Trim(),
            Status = RefundCaseStatus.Draft,
            CreatedByUserId = createdByUserId,
            CreatedAt = now,
            UpdatedAt = now
        };

        return refundCase;
    }

    public void UpdateTaxpayerInfo(
        string taxpayerName,
        string economicCode,
        string taxUnitCode,
        string province,
        string city,
        string address,
        string bankName,
        string shebaNumber,
        string docketNumber,
        string? nationalId = null)
    {
        EnsureModifiable();

        if (string.IsNullOrWhiteSpace(taxpayerName))
            throw new ArgumentException("عنوان مودی نمی‌تواند خالی باشد", nameof(taxpayerName));

        TaxpayerName = taxpayerName.Trim();
        EconomicCode = ValueObjects.EconomicCode.NormalizeDigits(economicCode.Trim());
        TaxUnitCode = taxUnitCode.Trim();
        Province = province.Trim();
        City = city.Trim();
        Address = address.Trim();
        BankName = bankName.Trim();
        ShebaNumber = shebaNumber.Trim().ToUpperInvariant();
        DocketNumber = docketNumber.Trim();
        NationalId = nationalId?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateAssignedOfficers(
        string administrationHeadName,
        string groupHeadName,
        string seniorAuditorName)
    {
        EnsureModifiable();

        AdministrationHeadName = administrationHeadName.Trim();
        GroupHeadName = groupHeadName.Trim();
        SeniorAuditorName = seniorAuditorName.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateAssessmentInfo(TaxAssessmentInfo assessmentInfo)
    {
        EnsureModifiable();
        AssessmentInfo = assessmentInfo ?? throw new ArgumentNullException(nameof(assessmentInfo));
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateBreakdown(RefundBreakdown breakdown)
    {
        EnsureModifiable();
        Breakdown = breakdown ?? throw new ArgumentNullException(nameof(breakdown));
        UpdatedAt = DateTime.UtcNow;
    }

    public TaxRefundReceipt AddReceipt(
        int rowIndex,
        string receiptNumber,
        string issueDateJalali,
        string paymentDateJalali,
        decimal amountRials,
        string? bankBranch = null,
        string? city = null,
        string? revenueLedgerRow = null)
    {
        EnsureModifiable();

        var receipt = TaxRefundReceipt.Create(
            Id,
            rowIndex,
            receiptNumber,
            issueDateJalali,
            paymentDateJalali,
            amountRials,
            bankBranch,
            city,
            revenueLedgerRow);

        Receipts.Add(receipt);
        UpdatedAt = DateTime.UtcNow;
        return receipt;
    }

    public void RemoveReceipt(Guid receiptId)
    {
        EnsureModifiable();

        var receipt = Receipts.FirstOrDefault(r => r.Id == receiptId);
        if (receipt != null)
        {
            // Also remove any allocations pointing to this receipt
            var allocationsToRemove = Allocations.Where(a => a.TaxRefundReceiptId == receiptId).ToList();
            foreach (var alloc in allocationsToRemove)
            {
                Allocations.Remove(alloc);
            }

            Receipts.Remove(receipt);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public RefundableReceiptAllocation AddAllocation(
        Guid taxRefundReceiptId,
        string receiptNumber,
        decimal totalReceiptAmount,
        decimal refundableAmount,
        string? bankBranch = null,
        string? city = null,
        string? revenueLedgerRow = null)
    {
        EnsureModifiable();

        var alloc = RefundableReceiptAllocation.Create(
            Id,
            taxRefundReceiptId,
            receiptNumber,
            totalReceiptAmount,
            refundableAmount,
            bankBranch,
            city,
            revenueLedgerRow);

        Allocations.Add(alloc);
        UpdatedAt = DateTime.UtcNow;
        return alloc;
    }

    public void RemoveAllocation(Guid allocationId)
    {
        EnsureModifiable();

        var alloc = Allocations.FirstOrDefault(a => a.Id == allocationId);
        if (alloc != null)
        {
            Allocations.Remove(alloc);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public TaxRefundLetter AddLetter(
        TaxRefundLetterType letterType,
        string letterNumber,
        string letterDateJalali,
        string? description = null,
        decimal debtAmount = 0,
        string? debtYear = null)
    {
        EnsureModifiable();

        var letter = TaxRefundLetter.Create(
            Id,
            letterType,
            letterNumber,
            letterDateJalali,
            description,
            debtAmount,
            debtYear);

        Letters.Add(letter);
        UpdatedAt = DateTime.UtcNow;
        return letter;
    }

    public void RemoveLetter(Guid letterId)
    {
        EnsureModifiable();

        var letter = Letters.FirstOrDefault(l => l.Id == letterId);
        if (letter != null)
        {
            Letters.Remove(letter);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public TaxRefundDocument AddDocument(
        TaxRefundDocumentType documentType,
        string title,
        string originalFileName,
        string storedFileName,
        string filePath,
        long fileSize,
        string uploadDateJalali,
        Guid uploadedByUserId,
        string uploadedByUserName,
        string? description = null,
        Guid? relatedReceiptId = null,
        Guid? relatedLetterId = null,
        string contentType = "application/pdf")
    {
        var document = TaxRefundDocument.Create(
            Id,
            documentType,
            title,
            originalFileName,
            storedFileName,
            filePath,
            fileSize,
            uploadDateJalali,
            uploadedByUserId,
            uploadedByUserName,
            description,
            relatedReceiptId,
            relatedLetterId,
            contentType);

        Documents.Add(document);
        UpdatedAt = DateTime.UtcNow;
        return document;
    }

    public void RemoveDocument(Guid documentId)
    {
        var doc = Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc != null)
        {
            Documents.Remove(doc);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void TransitionStatus(
        RefundCaseStatus newStatus,
        Guid actorUserId,
        string actorName,
        string actorRole,
        string? notes = null)
    {
        if (Status == RefundCaseStatus.TreasuryDisbursed)
            throw new InvalidOperationException("پرونده‌های پرداخت شده در ذیحسابی غیرقابل تغییر وضعیت هستند");

        if (Status == newStatus)
            return;

        var action = TaxRefundApprovalAction.Create(
            Id,
            Status,
            newStatus,
            actorUserId,
            actorName,
            actorRole,
            notes);

        Approvals.Add(action);

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        if (newStatus == RefundCaseStatus.Audited && SubmittedAt == null)
        {
            SubmittedAt = DateTime.UtcNow;
        }
        else if (newStatus == RefundCaseStatus.TreasuryDisbursed)
        {
            FinalizedAt = DateTime.UtcNow;
        }
    }

    private void EnsureModifiable()
    {
        if (Status == RefundCaseStatus.AdministrationHeadApproved || Status == RefundCaseStatus.TreasuryDisbursed)
        {
            throw new InvalidOperationException("پرونده پس از تایید نهایی رئیس امور یا پرداخت در ذیحسابی قابل ویرایش نمی‌باشد");
        }
    }
}
