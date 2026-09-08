using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Services;

namespace TaxSummary.Infrastructure.Data;

/// <summary>
/// Database initializer for seeding initial data
/// </summary>
public static class DbInitializer
{
    /// <summary>
    /// Seeds the database with initial data if empty
    /// </summary>
    /// <summary>
    /// Seeds the database with initial data if empty
    /// </summary>
    public static async Task InitializeAsync(TaxSummaryDbContext context)
    {
        // Ensure database is created
        if (context.Database.IsInMemory())
        {
            await context.Database.EnsureCreatedAsync();
        }
        else
        {
            await context.Database.MigrateAsync();
        }

        // Check if we already have both employees and users
        if (!await context.Employees.AnyAsync() || !await context.Users.AnyAsync())
        {
            // Seed sample data
            await SeedSampleDataAsync(context);
        }

        // Seed Tax Refund benchmark case
        await SeedTaxRefundDataAsync(context);

        // Seed Menu & Module Visibility Settings
        await SeedMenuSettingsAsync(context);
    }

    private static async Task SeedSampleDataAsync(TaxSummaryDbContext context)
    {
        var passwordHasher = new PasswordHasher();

        // 1. Get or Create Employees
        var adminEmployee = await GetOrCreateEmployeeAsync(context, "ADM001", "محمد", "رضایی", "مدیر سیستم");
        var managerEmployee = await GetOrCreateEmployeeAsync(context, "MGR001", "فاطمه", "کریمی", "مدیر گروه");
        var employeeRecord = await GetEmployeeWithDetailsAsync(context, "EMP001");

        // Special handling for the main employee record if it doesn't exist
        if (employeeRecord == null)
        {
            employeeRecord = Employee.Create(
                personnelNumber: "EMP001",
                firstName: "علی",
                lastName: "احمدی",
                education: "کارشناسی ارشد مدیریت مالی",
                serviceUnit: "اداره کل امور مالیاتی تهران",
                currentPosition: "کارشناس مالیاتی",
                appointmentPosition: "کارشناس ارشد مالیاتی",
                previousExperienceYears: 5
            );

            // Add details
            var adminStatus = AdministrativeStatus.Create(
                employeeId: employeeRecord.Id,
                missionDays: 15,
                sickLeaveDays: 2,
                paidLeaveDays: 5,
                overtimeHours: 40,
                delayAndAbsenceHours: 8,
                hourlyLeaveHours: 16
            );
            employeeRecord.SetAdministrativeStatus(adminStatus);

            var capability = PerformanceCapability.Create(
                employeeId: employeeRecord.Id,
                systemRole: "معاون مالیاتی سامانه سنیم",
                detectionOfTaxIssues: true,
                detectionOfTaxEvasion: true,
                companyIdentification: false,
                valueAddedRecognition: true,
                referredOrExecuted: true,
                detectionOfTaxIssuesQuantity: 15,
                detectionOfTaxIssuesAmount: 250000000,
                detectionOfTaxEvasionQuantity: 8,
                detectionOfTaxEvasionAmount: 180000000,
                companyIdentificationQuantity: 0,
                companyIdentificationAmount: 0,
                valueAddedRecognitionQuantity: 12,
                valueAddedRecognitionAmount: 320000000,
                valueAddedRecognitionUndetectedQuantity: 0,
                jobsQuantity: 0,
                jobsAmount: 0,
                jobsUndetectedQuantity: 0,
                otherQuantity: 0,
                otherAmount: 0,
                otherUndetectedQuantity: 0,
                companyIdentificationUndetectedQuantity: 0,
                referredOrExecutedQuantity: 5,
                referredOrExecutedAmount: 95000000
            );
            employeeRecord.AddPerformanceCapability(capability);
            employeeRecord.UpdatePhoto("/uploads/employee-photos/Mehdi_Kazemi_744979.jpg");
            employeeRecord.UpdateStatusDescription("کارمند نمونه با عملکرد مناسب و سوابق مثبت اداری. دارای تجربه کافی در حوزه امور مالیاتی و شناسایی مشاغل مشمول مالیات. سوابق اداری مثبت و بدون مشکل انضباطی.");

            context.Employees.Add(employeeRecord);
        }

        await context.SaveChangesAsync();

        // 2. Get or Create Users
        var defaultPassword = "Admin@123";
        var hashedPassword = passwordHasher.HashPassword(defaultPassword);

        // Admin User
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser == null)
        {
            adminUser = User.Create(
                username: "admin",
                passwordHash: hashedPassword,
                role: "Admin",
                employeeId: adminEmployee.Id
            );
            context.Users.Add(adminUser);
            adminEmployee.AssociateWithUser(adminUser.Id);
        }

        // Manager User
        var managerUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "manager");
        if (managerUser == null)
        {
            managerUser = User.Create(
                username: "manager",
                passwordHash: hashedPassword,
                role: "Manager",
                employeeId: managerEmployee.Id
            );
            context.Users.Add(managerUser);
            managerEmployee.AssociateWithUser(managerUser.Id);
        }

        // Employee User
        var employeeUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "employee");
        if (employeeUser == null)
        {
            employeeUser = User.Create(
                username: "employee",
                passwordHash: hashedPassword,
                role: "Employee",
                employeeId: employeeRecord.Id
            );
            context.Users.Add(employeeUser);
            employeeRecord.AssociateWithUser(employeeUser.Id);
        }

        // Clear email from any existing users
        var usersWithEmail = await context.Users.Where(u => u.Email != null).ToListAsync();
        foreach (var u in usersWithEmail)
        {
            u.UpdateDetails(null, u.Role, u.IsActive, u.EmployeeId);
        }

        await context.SaveChangesAsync();
    }

    private static async Task<Employee> GetOrCreateEmployeeAsync(
        TaxSummaryDbContext context, 
        string personnelNumber, 
        string firstName, 
        string lastName, 
        string position)
    {
        var employee = await context.Employees.FirstOrDefaultAsync(e => e.PersonnelNumber == personnelNumber);
        
        if (employee == null)
        {
            employee = Employee.Create(
                personnelNumber: personnelNumber,
                firstName: firstName,
                lastName: lastName,
                education: "کارشناسی",
                serviceUnit: "اداره کل امور مالیاتی تهران",
                currentPosition: position,
                appointmentPosition: position,
                previousExperienceYears: 5
            );
            context.Employees.Add(employee);
        }

        return employee;
    }

    private static async Task<Employee?> GetEmployeeWithDetailsAsync(TaxSummaryDbContext context, string personnelNumber)
    {
        return await context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .FirstOrDefaultAsync(e => e.PersonnelNumber == personnelNumber);
    }

    private static async Task SeedTaxRefundDataAsync(TaxSummaryDbContext context)
    {
        if (await context.TaxRefundCases.AnyAsync())
        {
            return;
        }

        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        var adminUserId = adminUser?.Id ?? Guid.NewGuid();

        var refundCase = TaxRefundCase.Create(
            caseTrackingNumber: "TRC-1403-0001",
            docketNumber: "87",
            taxpayerName: "شرکت نمونه",
            economicCode: "1234567890",
            taxUnitCode: "160300",
            province: "خوزستان",
            city: "اهواز",
            address: "اهواز کیانپارس خ 17",
            bankName: "ملی",
            shebaNumber: "IR160120000000001234567890",
            taxYear: 1402,
            period: 1,
            taxSource: TaxSourceType.CorporateIncome,
            refundReason: "اشتباه واریزی و اضافه پرداختی عملکرد سال 1402",
            administrationHeadName: "غلامرضا اسلامی",
            groupHeadName: "مسعود بصیر",
            seniorAuditorName: "مهدی دلفی",
            createdByUserId: adminUserId,
            nationalId: "10100000000"
        );

        // Assessment Info
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "654321987",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "326541789",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 250_000_000,
            nonWaivablePenalties: 0,
            timelyPaymentBonus: 0
        );
        refundCase.UpdateAssessmentInfo(assessment);

        // Breakdown
        var breakdown = RefundBreakdown.Create(
            principalTaxRefund: 65_000_000,
            stampDutyRefund: 0,
            otherRefund: 0,
            penaltiesRefund: 0,
            delayDamages: 0
        );
        refundCase.UpdateBreakdown(breakdown);

        // Receipts (Table A)
        var receipt1 = refundCase.AddReceipt(
            rowIndex: 1,
            receiptNumber: "987654321",
            issueDateJalali: "1403/05/01",
            paymentDateJalali: "1403/05/01",
            amountRials: 300_000_000,
            bankBranch: "اهواز",
            city: "اهواز",
            revenueLedgerRow: "ردیف 1"
        );

        var receipt2 = refundCase.AddReceipt(
            rowIndex: 2,
            receiptNumber: "654321987",
            issueDateJalali: "1403/05/02",
            paymentDateJalali: "1403/05/02",
            amountRials: 15_000_000,
            bankBranch: "اهواز",
            city: "اهواز",
            revenueLedgerRow: "ردیف 2"
        );

        // Allocations (Table B) - Refunding from receipt 1
        refundCase.AddAllocation(
            taxRefundReceiptId: receipt1.Id,
            receiptNumber: receipt1.ReceiptNumber,
            totalReceiptAmount: receipt1.AmountRials,
            refundableAmount: 65_000_000,
            bankBranch: receipt1.BankBranch,
            city: receipt1.City,
            revenueLedgerRow: receipt1.RevenueLedgerRow
        );

        // Official Letters
        refundCase.AddLetter(
            letterType: TaxRefundLetterType.InboundTaxpayerRequest,
            letterNumber: "526314",
            letterDateJalali: "1405/01/25",
            description: "درخواست استرداد مودی همراه با مدارک مثبته و تاییدیه حساب بانکی"
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.CollectionAndEnforcementInquiry,
            letterNumber: "1235465",
            letterDateJalali: "1405/02/01",
            description: "استعلام بدهی از واحد وصول و اجرا - فاقد بدهی قطعی",
            debtAmount: 0
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.WithholdingTaxInquiry,
            letterNumber: "6532487",
            letterDateJalali: "1405/02/01",
            description: "استعلام بدهی از واحد مالیات تکلیفی و حقوق - فاقد بدهی قطعی",
            debtAmount: 0
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.RefundVoucher,
            letterNumber: "526",
            letterDateJalali: "1405/02/01",
            description: "برگ استرداد صادره موضوع ماده ۲۴۲ قانون مالیات‌های مستقیم"
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.JustificationReport,
            letterNumber: "123456",
            letterDateJalali: "1405/02/01",
            description: "گزارش توجیه استرداد اضافه دریافتی اداره امور مالیاتی"
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.OfficeCommitment,
            letterNumber: "123456",
            letterDateJalali: "1405/02/01",
            description: "فرم تعهد کارشناس ارشد امور مالیاتی موضوع عدم استرداد قبلی قبوض"
        );

        refundCase.AddLetter(
            letterType: TaxRefundLetterType.TreasuryLetter,
            letterNumber: "4444412",
            letterDateJalali: "1405/02/05",
            description: "نامه ارسالی به ذیحسابی و اداره کل امور مالی جهت پرداخت وجه استرداد"
        );

        // Approval History (Workflow Actions)
        refundCase.TransitionStatus(
            RefundCaseStatus.Audited,
            adminUserId,
            "مهدی دلفی",
            "کارشناس ارشد مالیاتی",
            "رسیدگی انجام و مازاد پرداختی ۶۵،۰۰۰،۰۰۰ ریال تایید گردید."
        );

        refundCase.TransitionStatus(
            RefundCaseStatus.GroupHeadApproved,
            adminUserId,
            "مسعود بصیر",
            "رئیس گروه مالیاتی",
            "گزارش استرداد و مستندات قبوض و استعلامات بررسی و مورد موافقت است."
        );

        context.TaxRefundCases.Add(refundCase);
        await context.SaveChangesAsync();
    }

    private static async Task SeedMenuSettingsAsync(TaxSummaryDbContext context)
    {
        var defaultMenus = TaxSummary.Domain.Common.DefaultMenuSettings.GetDefaults();

        if (!await context.MenuSettings.AnyAsync())
        {
            await context.MenuSettings.AddRangeAsync(defaultMenus);
            await context.SaveChangesAsync();
            return;
        }

        // Add any newly introduced default menu items that are not yet in the database
        var existingKeys = await context.MenuSettings.Select(m => m.MenuKey.ToLower()).ToListAsync();
        var missingMenus = defaultMenus
            .Where(m => !existingKeys.Contains(m.MenuKey.ToLower()))
            .ToList();

        if (missingMenus.Any())
        {
            await context.MenuSettings.AddRangeAsync(missingMenus);
            await context.SaveChangesAsync();
        }

        // Ensure admin-only menu items are properly restricted
        var adminItems = await context.MenuSettings
            .Where(m => m.AdminOnly && m.AllowedRoles != "Admin")
            .ToListAsync();

        if (adminItems.Any())
        {
            foreach (var item in adminItems)
            {
                item.UpdateRoles(new[] { "Admin" });
            }
            await context.SaveChangesAsync();
        }
    }
}
