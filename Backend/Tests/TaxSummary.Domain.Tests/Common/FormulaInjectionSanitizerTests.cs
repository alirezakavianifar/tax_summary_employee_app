using TaxSummary.Domain.Common;
using Xunit;

namespace TaxSummary.Domain.Tests.Common;

public class FormulaInjectionSanitizerTests
{
    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("شرکت نمونه آزمایشی", "شرکت نمونه آزمایشی")]
    [InlineData("Taxpayer 123", "Taxpayer 123")]
    [InlineData("1234567890", "1234567890")]
    public void SanitizeForExport_SafeInputs_ReturnsUnchangedOrEmpty(string? input, string expected)
    {
        var result = FormulaInjectionSanitizer.SanitizeForExport(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("=SUM(A1:A10)", "'=SUM(A1:A10)")]
    [InlineData("=cmd|' /C calc'!A0", "'=cmd|' /C calc'!A0")]
    [InlineData("+2+5+cmd|' /C calc'!A0", "'+2+5+cmd|' /C calc'!A0")]
    [InlineData("-2+5+cmd|' /C calc'!A0", "'-2+5+cmd|' /C calc'!A0")]
    [InlineData("@SUM(1+1)*cmd|' /C calc'!A0", "'@SUM(1+1)*cmd|' /C calc'!A0")]
    [InlineData("\t=DANGEROUS", "'\t=DANGEROUS")]
    [InlineData("\r=DANGEROUS", "'\r=DANGEROUS")]
    public void SanitizeForExport_FormulaPrefixes_PrependsSingleQuote(string input, string expected)
    {
        var result = FormulaInjectionSanitizer.SanitizeForExport(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(null, "")]
    [InlineData("", "")]
    [InlineData("   ", "")]
    [InlineData("علی رضایی", "علی رضایی")]
    [InlineData("  محمد محمدی  ", "محمد محمدی")]
    public void SanitizeForImport_SafeInputs_ReturnsTrimmed(string? input, string expected)
    {
        var result = FormulaInjectionSanitizer.SanitizeForImport(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("=SUM(A1:A10)", "SUM(A1:A10)")]
    [InlineData("==malicious", "malicious")]
    [InlineData("@malicious", "malicious")]
    [InlineData("=@payload", "payload")]
    public void SanitizeForImport_FormulaTriggers_StripsPrefixes(string input, string expected)
    {
        var result = FormulaInjectionSanitizer.SanitizeForImport(input);
        Assert.Equal(expected, result);
    }
}
