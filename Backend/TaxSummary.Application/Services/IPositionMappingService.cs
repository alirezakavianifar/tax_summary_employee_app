namespace TaxSummary.Application.Services;

/// <summary>
/// Provides position title standardization and mapping according to official organizational rules
/// </summary>
public interface IPositionMappingService
{
    /// <summary>
    /// Maps a raw or legacy position title to a standardized position title.
    /// Returns "حسابرس" if the input is null, empty, whitespace, or unmapped.
    /// </summary>
    string GetStandardizedPosition(string? rawPosition);

    /// <summary>
    /// Resolves the position tier ('GroupHead', 'SeniorExpert', 'OtherStaff') based on the standardized position title.
    /// </summary>
    string ResolveTierFromPosition(string? standardizedOrRawPosition);
}
