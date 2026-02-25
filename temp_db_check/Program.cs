using System;
using Microsoft.Data.Sqlite;

using var connection = new SqliteConnection("Data Source=e:/projects/tax_summary_employee_app/deployment/backend/taxsummary.db");
connection.Open();
var command = connection.CreateCommand();
command.CommandText = "SELECT Id, PersonnelNumber, FirstName, LastName, NationalId FROM Employees";
using var reader = command.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader["PersonnelNumber"]} | {reader["FirstName"]} | {reader["LastName"]} | {reader["NationalId"]}");
}
