using System;
using System.Linq;
using Microsoft.Data.Sqlite;

class Program
{
    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.Error.WriteLine("Usage: QuerySqlite <dbPath>");
            return 2;
        }

        var db = args[0];
        var connString = $"Data Source={db}";
        try
        {
            using var conn = new SqliteConnection(connString);
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT Id, Username, Email, IsActive, FailedLoginAttempts, LockoutEnd FROM Users;";
            using var reader = cmd.ExecuteReader();

            // Header
            var cols = Enumerable.Range(0, reader.FieldCount).Select(i => reader.GetName(i));
            Console.WriteLine(string.Join(',', cols));

            while (reader.Read())
            {
                var vals = Enumerable.Range(0, reader.FieldCount).Select(i =>
                {
                    if (reader.IsDBNull(i)) return "";
                    var v = reader.GetValue(i)?.ToString() ?? "";
                    return v.Replace('\n', ' ').Replace('\r', ' ').Replace(',', ';');
                });

                Console.WriteLine(string.Join(',', vals));
            }

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex);
            return 3;
        }
    }
}
