using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for Tax Refund Case operations
/// </summary>
public interface ITaxRefundService
{
    Task<Result<TaxRefundCaseDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result<TaxRefundCaseDto>> GetByTrackingNumberAsync(string trackingNumber, CancellationToken ct = default);
    Task<Result<IEnumerable<TaxRefundCaseSummaryDto>>> GetCasesAsync(TaxRefundFilterDto filter, CancellationToken ct = default);
    Task<Result<Guid>> CreateAsync(CreateTaxRefundCaseDto dto, Guid currentUserId, CancellationToken ct = default);
    Task<Result> UpdateAsync(Guid id, UpdateTaxRefundCaseDto dto, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken ct = default);

    Task<Result<TaxRefundReceiptDto>> AddReceiptAsync(Guid caseId, CreateTaxRefundReceiptDto dto, CancellationToken ct = default);
    Task<Result> RemoveReceiptAsync(Guid caseId, Guid receiptId, CancellationToken ct = default);

    Task<Result<RefundableReceiptAllocationDto>> AddAllocationAsync(Guid caseId, CreateRefundableReceiptAllocationDto dto, CancellationToken ct = default);
    Task<Result> RemoveAllocationAsync(Guid caseId, Guid allocationId, CancellationToken ct = default);

    Task<Result<TaxRefundLetterDto>> AddLetterAsync(Guid caseId, CreateTaxRefundLetterDto dto, CancellationToken ct = default);
    Task<Result> RemoveLetterAsync(Guid caseId, Guid letterId, CancellationToken ct = default);

    Task<Result> UpdateAssessmentAsync(Guid caseId, UpdateTaxAssessmentInfoDto dto, CancellationToken ct = default);
    Task<Result> UpdateBreakdownAsync(Guid caseId, UpdateRefundBreakdownDto dto, CancellationToken ct = default);

    Task<Result<RefundCalculationResultDto>> CalculateSandboxAsync(CalculateRefundRequestDto dto, CancellationToken ct = default);
    Task<Result> TransitionStatusAsync(Guid id, TransitionStatusDto dto, Guid currentUserId, string actorName, string actorRole, CancellationToken ct = default);
    Task<Result<PrintableDocumentDto>> GetPrintableDocumentAsync(Guid id, string formType, CancellationToken ct = default);

    Task<Result<TaxRefundDocumentDto>> UploadDocumentAsync(Guid caseId, Microsoft.AspNetCore.Http.IFormFile file, UploadTaxRefundDocumentDto dto, Guid currentUserId, string currentUserName, CancellationToken ct = default);
    Task<Result<IEnumerable<TaxRefundDocumentDto>>> GetDocumentsAsync(Guid caseId, CancellationToken ct = default);
    Task<Result<(Stream Stream, string ContentType, string FileName)>> GetDocumentStreamAsync(Guid caseId, Guid documentId, CancellationToken ct = default);
    Task<Result> DeleteDocumentAsync(Guid caseId, Guid documentId, Guid currentUserId, CancellationToken ct = default);
}
