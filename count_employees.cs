using System;
using Microsoft.Data.Sqlite;

try
{
    using (var connection = new SqliteConnection("Data Source=e:/projects/tax_summary_employee_app/deployment/backend/taxsummary.db"))
    {
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT COUNT(*) FROM Employees";
        var count = command.ExecuteScalar();
        Console.WriteLine($"TOTAL_EMPLOYEES_IN_DB: {count}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: {ex.Message}");
}
