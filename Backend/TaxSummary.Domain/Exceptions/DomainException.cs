namespace TaxSummary.Domain.Exceptions;

/// <summary>
/// Base exception for domain-specific errors
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message)
        : base(message)
    {
    }

    protected DomainException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// Exception thrown when a domain entity is not found
/// </summary>
public class EntityNotFoundException : DomainException
{
    public EntityNotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found")
    {
    }
}

/// <summary>
/// Exception thrown when a domain validation fails
/// </summary>
public class DomainValidationException : DomainException
{
    public DomainValidationException(string message)
        : base(message)
    {
    }

    public DomainValidationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// Exception thrown when a business rule is violated
/// </summary>
public class BusinessRuleViolationException : DomainException
{
    public BusinessRuleViolationException(string message)
        : base(message)
    {
    }

    public BusinessRuleViolationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
