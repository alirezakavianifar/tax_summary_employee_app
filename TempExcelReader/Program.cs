using System;
using System.IO;
using System.Linq;
using MiniExcelLibs;

namespace TempExcelReader
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                Console.OutputEncoding = System.Text.Encoding.UTF8;
                var filePath = @"E:\projects\tax_summary_employee_app\sample.xlsx";
                var validPath = @"E:\projects\tax_summary_employee_app\headers.txt";
                
                if (!File.Exists(filePath))
                {
                    File.WriteAllText(validPath, $"File not found: {filePath}");
                    return;
                }

                var rows = MiniExcel.Query(filePath).ToList();

                if (rows.Any())
                {
                    using (var writer = new StreamWriter(validPath, false, System.Text.Encoding.UTF8))
                    {
                        writer.WriteLine("Columns detected:");
                        var firstRow = rows.First() as IDictionary<string, object>;
                        if (firstRow != null)
                        {
                            foreach (var key in firstRow.Keys)
                            {
                                writer.WriteLine(key);
                            }
                            
                            writer.WriteLine("\nFirst row data:");
                             foreach (var kvp in firstRow)
                            {
                                writer.WriteLine($"{kvp.Key}: {kvp.Value}");
                            }
                        }
                        else
                        {
                             writer.WriteLine("Row type: " + rows.First().GetType().Name);
                        }
                    }
                    Console.WriteLine("Headers written to headers.txt");
                }
                else
                {
                    File.WriteAllText(validPath, "No data found in Excel file.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}
