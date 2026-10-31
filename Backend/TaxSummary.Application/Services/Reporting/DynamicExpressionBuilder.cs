using System.Globalization;
using System.Linq.Expressions;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Dynamic Expression Tree Builder that constructs strongly-typed LINQ predicates from runtime filter DTOs
/// Enforces a strict field whitelist to prevent reflection attacks and arbitrary code execution
/// </summary>
public static class DynamicExpressionBuilder
{
    public static Expression<Func<T, bool>> BuildFilterPredicate<T>(
        List<DynamicFilterConditionDto> filters,
        Dictionary<string, string> fieldTypeMap)
    {
        var parameter = Expression.Parameter(typeof(T), "x");

        if (filters == null || filters.Count == 0)
        {
            return Expression.Lambda<Func<T, bool>>(Expression.Constant(true), parameter);
        }

        Expression? combinedBody = null;

        foreach (var filter in filters)
        {
            if (string.IsNullOrWhiteSpace(filter.FieldName) || string.IsNullOrWhiteSpace(filter.Value))
                continue;

            // Security guard: Only permitted whitelisted fields are evaluated
            if (!fieldTypeMap.TryGetValue(filter.FieldName, out var expectedType))
                continue;

            var property = typeof(T).GetProperty(filter.FieldName);
            if (property == null)
                continue;

            var propertyAccess = Expression.Property(parameter, property);
            var condition = BuildComparisonExpression(propertyAccess, filter.Operator, filter.Value, filter.SecondValue, expectedType);

            if (condition != null)
            {
                combinedBody = combinedBody == null 
                    ? condition 
                    : Expression.AndAlso(combinedBody, condition);
            }
        }

        if (combinedBody == null)
        {
            return Expression.Lambda<Func<T, bool>>(Expression.Constant(true), parameter);
        }

        return Expression.Lambda<Func<T, bool>>(combinedBody, parameter);
    }

    private static Expression? BuildComparisonExpression(
        MemberExpression property, 
        string op, 
        string value, 
        string? secondValue, 
        string type)
    {
        try
        {
            var targetType = property.Type;
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            object? parsedValue = ParseValue(value, type, underlyingType);
            if (parsedValue == null)
                return null;

            var constant = Expression.Constant(parsedValue, underlyingType);
            Expression leftExpression = property;

            // Handle nullable value conversion for comparisons
            if (property.Type != underlyingType)
            {
                leftExpression = Expression.Convert(property, underlyingType);
            }

            var opNormalized = (op ?? "equals").Trim().ToLowerInvariant();

            Expression comparison = opNormalized switch
            {
                "equals" => Expression.Equal(leftExpression, constant),
                "notequals" => Expression.NotEqual(leftExpression, constant),
                "greaterthan" => Expression.GreaterThan(leftExpression, constant),
                "greaterthanorequal" => Expression.GreaterThanOrEqual(leftExpression, constant),
                "lessthan" => Expression.LessThan(leftExpression, constant),
                "lessthanorequal" => Expression.LessThanOrEqual(leftExpression, constant),
                "contains" when underlyingType == typeof(string) => Expression.Call(
                    leftExpression,
                    typeof(string).GetMethod("Contains", new[] { typeof(string) })!,
                    constant),
                "startswith" when underlyingType == typeof(string) => Expression.Call(
                    leftExpression,
                    typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!,
                    constant),
                "between" when !string.IsNullOrWhiteSpace(secondValue) => BuildBetweenExpression(leftExpression, constant, secondValue, type, underlyingType),
                _ => Expression.Equal(leftExpression, constant)
            };

            // If property is nullable and we're not checking for null, ensure HasValue is true
            if (property.Type != underlyingType)
            {
                var hasValue = Expression.Property(property, "HasValue");
                return Expression.AndAlso(hasValue, comparison);
            }

            return comparison;
        }
        catch
        {
            return null; // Gracefully ignore invalid values that fail parsing
        }
    }

    private static Expression BuildBetweenExpression(
        Expression left, 
        ConstantExpression lowerBound, 
        string secondValue, 
        string type, 
        Type targetType)
    {
        var parsedSecond = ParseValue(secondValue, type, targetType);
        var upperBound = Expression.Constant(parsedSecond, targetType);

        var gte = Expression.GreaterThanOrEqual(left, lowerBound);
        var lte = Expression.LessThanOrEqual(left, upperBound);

        return Expression.AndAlso(gte, lte);
    }

    private static object? ParseValue(string value, string type, Type targetType)
    {
        if (targetType == typeof(string))
            return value.Trim();

        if (targetType == typeof(decimal))
            return decimal.Parse(value, CultureInfo.InvariantCulture);

        if (targetType == typeof(int))
            return int.Parse(value, CultureInfo.InvariantCulture);

        if (targetType == typeof(double))
            return double.Parse(value, CultureInfo.InvariantCulture);

        if (targetType == typeof(bool))
            return bool.Parse(value);

        if (targetType == typeof(DateTime))
            return DateTime.Parse(value, CultureInfo.InvariantCulture);

        if (targetType == typeof(Guid))
            return Guid.Parse(value);

        return Convert.ChangeType(value, targetType, CultureInfo.InvariantCulture);
    }
}
