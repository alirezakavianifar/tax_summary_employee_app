using System.Text.RegularExpressions;
using TaxSummary.Domain.Common;

namespace TaxSummary.Domain.ValueObjects;

/// <summary>
/// Value Object representing a Jalali (Shamsi / Persian) Date.
/// Format: YYYY/MM/DD
/// </summary>
public class JalaliDate : ValueObject, IComparable<JalaliDate>
{
    private static readonly Regex JalaliRegex = new(@"^(13\d{2}|14\d{2})/(0[1-9]|1[0-2]|[1-9])/(0[1-9]|[12]\d|3[01]|[1-9])$", RegexOptions.Compiled);

    public int Year { get; private set; }
    public int Month { get; private set; }
    public int Day { get; private set; }
    public string Value { get; private set; }

    private JalaliDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("تاریخ شمسی نمی‌تواند خالی باشد", nameof(value));

        var normalized = EconomicCode.NormalizeDigits(value.Trim().Replace("-", "/"));

        var match = JalaliRegex.Match(normalized);
        if (!match.Success)
            throw new ArgumentException($"فرمت تاریخ شمسی نامعتبر است ({value}). فرمت صحیح: YYYY/MM/DD", nameof(value));

        var year = int.Parse(match.Groups[1].Value);
        var month = int.Parse(match.Groups[2].Value);
        var day = int.Parse(match.Groups[3].Value);

        ValidateDay(year, month, day);

        Year = year;
        Month = month;
        Day = day;
        Value = $"{year:0000}/{month:00}/{day:00}";
    }

    private static void ValidateDay(int year, int month, int day)
    {
        if (month >= 1 && month <= 6)
        {
            if (day > 31)
                throw new ArgumentException($"در شش ماه اول سال، روز نمی‌تواند بیشتر از ۳۱ باشد (روز وارد شده: {day})");
        }
        else if (month >= 7 && month <= 11)
        {
            if (day > 30)
                throw new ArgumentException($"در پنج ماه دوم سال، روز نمی‌تواند بیشتر از ۳۰ باشد (روز وارد شده: {day})");
        }
        else if (month == 12)
        {
            if (day > 30)
                throw new ArgumentException($"در ماه اسفند، روز نمی‌تواند بیشتر از ۳۰ باشد (روز وارد شده: {day})");
        }
    }

    public static JalaliDate Create(string value) => new(value);

    public static JalaliDate Create(int year, int month, int day) => new($"{year:0000}/{month:00}/{day:00}");

    public int CompareTo(JalaliDate? other)
    {
        if (other is null) return 1;
        return string.Compare(Value, other.Value, StringComparison.Ordinal);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    public static implicit operator string(JalaliDate date) => date.Value;
}
