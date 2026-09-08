using System.Text;
using Microsoft.AspNetCore.Http;
using Moq;
using TaxSummary.Application.Validators;
using Xunit;

namespace TaxSummary.Application.Tests.Validators;

public class PhotoUploadValidatorTests
{
    private readonly PhotoUploadValidator _validator = new();

    private static IFormFile CreateMockFormFile(string fileName, string contentType, byte[] content)
    {
        var stream = new MemoryStream(content);
        var mock = new Mock<IFormFile>();
        mock.Setup(f => f.FileName).Returns(fileName);
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.Length).Returns(content.Length);
        mock.Setup(f => f.OpenReadStream()).Returns(() => new MemoryStream(content));
        return mock.Object;
    }

    [Fact]
    public void Validate_ValidJpegWithMagicBytes_ReturnsSuccess()
    {
        // Arrange: JPEG starts with 0xFF, 0xD8, 0xFF + dummy data
        var jpegBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
        var file = CreateMockFormFile("photo.jpg", "image/jpeg", jpegBytes);

        // Act
        var result = _validator.Validate(file);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Validate_ValidPngWithMagicBytes_ReturnsSuccess()
    {
        // Arrange: PNG 8-byte signature + dummy chunk
        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 };
        var file = CreateMockFormFile("avatar.png", "image/png", pngBytes);

        // Act
        var result = _validator.Validate(file);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Validate_FakePngWithMaliciousText_FailsMagicBytesCheck()
    {
        // Arrange: Text content masquerading as PNG
        var textBytes = Encoding.UTF8.GetBytes("<?php echo 'malicious code'; ?>");
        var file = CreateMockFormFile("exploit.png", "image/png", textBytes);

        // Act
        var result = _validator.Validate(file);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Contains("PNG", result.Error);
    }

    [Fact]
    public void Validate_FakeJpegWithMaliciousPayload_FailsMagicBytesCheck()
    {
        // Arrange: Windows PE executable header or text payload masquerading as JPG
        var payload = Encoding.UTF8.GetBytes("<script>alert('xss')</script>");
        var file = CreateMockFormFile("exploit.jpg", "image/jpeg", payload);

        // Act
        var result = _validator.Validate(file);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Contains("JPEG", result.Error);
    }

    [Fact]
    public void Validate_TooSmallFile_FailsValidation()
    {
        // Arrange: Only 4 bytes
        var tinyBytes = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        var file = CreateMockFormFile("tiny.jpg", "image/jpeg", tinyBytes);

        // Act
        var result = _validator.Validate(file);

        // Assert
        Assert.True(result.IsFailure);
    }
}
