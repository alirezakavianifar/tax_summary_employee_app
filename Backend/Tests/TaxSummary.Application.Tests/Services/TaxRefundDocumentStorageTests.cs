using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;
using TaxSummary.Infrastructure.Services;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class TaxRefundDocumentStorageTests
{
    private readonly Mock<IHostEnvironment> _mockEnv;
    private readonly IConfiguration _config;
    private readonly Mock<ILogger<RefundDocumentStorageService>> _mockLogger;
    private readonly RefundDocumentStorageService _service;

    public TaxRefundDocumentStorageTests()
    {
        _mockEnv = new Mock<IHostEnvironment>();
        _mockLogger = new Mock<ILogger<RefundDocumentStorageService>>();

        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FileStorage:RefundDocumentsPath"] = "Test_Uploads/refund-documents",
                ["FileStorage:MaxDocumentFileSizeInMB"] = "25"
            })
            .Build();

        _service = new RefundDocumentStorageService(
            _mockEnv.Object,
            _config,
            _mockLogger.Object);
    }

    [Fact]
    public async Task SavePdfAsync_WithNonPdfExtension_ThrowsArgumentException()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("document.docx");
        mockFile.Setup(f => f.Length).Returns(1024);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.SavePdfAsync(mockFile.Object, Guid.NewGuid()));

        Assert.Contains("فرمت PDF", ex.Message);
    }

    [Fact]
    public async Task SavePdfAsync_WithInvalidMagicBytes_ThrowsArgumentException()
    {
        // Arrange
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("fake.pdf");
        mockFile.Setup(f => f.Length).Returns(100);

        // Header does not start with %PDF-
        var invalidContent = Encoding.UTF8.GetBytes("This is plain text, not a PDF!");
        var stream = new MemoryStream(invalidContent);
        mockFile.Setup(f => f.OpenReadStream()).Returns(stream);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.SavePdfAsync(mockFile.Object, Guid.NewGuid()));

        Assert.Contains("فاقد ساختار استاندارد PDF", ex.Message);
    }

    [Fact]
    public async Task SavePdfAsync_WithValidPdfSignature_SavesSuccessfully()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("valid_test.pdf");

        // Real PDF magic bytes header: %PDF-1.4 ...
        var pdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
        mockFile.Setup(f => f.Length).Returns(pdfBytes.Length);

        var stream = new MemoryStream(pdfBytes);
        mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
        mockFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SavePdfAsync(mockFile.Object, caseId);

        // Assert
        Assert.EndsWith(".pdf", result.StoredFileName);
        Assert.Contains(caseId.ToString(), result.RelativePath);
        Assert.Equal(pdfBytes.Length, result.FileSize);
    }
}
