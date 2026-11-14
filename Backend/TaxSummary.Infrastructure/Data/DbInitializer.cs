using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.ValueObjects;
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
            // 1. Ensure required schema columns and tables exist (safeguard for existing production SQLite databases)
            await EnsureSchemaUpToDateAsync(context);

            try
            {
                await context.Database.MigrateAsync();
            }
            catch (Exception ex)
            {
                // Continue if already partially migrated or columns already present in SQLite
                Console.WriteLine($"[DbInitializer] MigrateAsync notice: {ex.Message}");
            }
        }

        // Check if we already have both employees and users
        if (!await context.Employees.AnyAsync() || !await context.Users.AnyAsync())
        {
            // Seed sample data
            await SeedSampleDataAsync(context);
        }

        // Seed default system roles
        await SeedRolesAsync(context);

        // Seed Menu & Module Visibility Settings
        await SeedMenuSettingsAsync(context);

        // Seed System Branding & Global Settings
        await SeedSystemSettingsAsync(context);

        // Seed Tax Sources
        await SeedTaxSourcesAsync(context);

        // Seed Finality Stages
        await SeedFinalityStagesAsync(context);

        // Seed Tax Refund Workflow Steps
        await SeedRefundWorkflowStepsAsync(context);

        // Seed and synchronize Offices and UserOffices
        await SeedOfficesAndUserOfficesAsync(context);

        // Seed Tax Refund benchmark case
        await SeedTaxRefundDataAsync(context);

        // Backfill unique CycleCodes for any existing PayrollCycles
        await BackfillPayrollCycleCodesAsync(context);

        // Seed Reporting & BI standard reports
        await ReportingDataSeeder.SeedReportingAsync(context);

        // Synchronize employee photos from uploads folder if available
        await SyncEmployeePhotosFromDiskAsync(context);
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
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        var adminUserId = adminUser?.Id ?? Guid.NewGuid();

        if (await context.TaxRefundCases.AnyAsync())
        {
            // Backfill unlinked cases
            var unlinkedCases = await context.TaxRefundCases.Where(c => c.OfficeId == null).ToListAsync();
            foreach (var c in unlinkedCases)
            {
                var h = Domain.ValueObjects.TaxHierarchy.Decompose(c.TaxUnitCode);
                var matched = await context.Offices.FirstOrDefaultAsync(o => o.Code == h.OfficeCode || o.Code == h.OfficeCode.Substring(0, 4));
                if (matched != null)
                {
                    c.SetOffice(matched.Id, matched.Code);
                }
            }
            if (unlinkedCases.Any())
            {
                await context.SaveChangesAsync();
            }

            // Backfill DirectorGeneralName for existing cases if empty
            var casesWithoutDg = await context.TaxRefundCases
                .Where(c => string.IsNullOrWhiteSpace(c.DirectorGeneralName))
                .ToListAsync();
            foreach (var c in casesWithoutDg)
            {
                c.SetDirectorGeneralName("علی خورشیدی");
            }
            if (casesWithoutDg.Any())
            {
                await context.SaveChangesAsync();
            }

            var hasKarunCase = await context.TaxRefundCases.AnyAsync(c => c.TaxUnitCode == "160211");
            if (!hasKarunCase)
            {
                var off1602 = await context.Offices.FirstOrDefaultAsync(o => o.Code == "160200" || o.Code == "1602");
                var karunCase = TaxRefundCase.Create(
                    caseTrackingNumber: "TRC-1403-1602",
                    docketNumber: "105",
                    taxpayerName: "شرکت پتروشیمی کارون",
                    economicCode: "411395768531",
                    taxUnitCode: "160211",
                    province: "خوزستان",
                    city: "اهواز",
                    address: "اهواز، سایت منطقه ویژه اقتصادی",
                    bankName: "ملی",
                    shebaNumber: "IR980170000000123456789012",
                    taxYear: 1402,
                    period: 1,
                    taxSource: TaxSourceType.CorporateIncome,
                    refundReason: "اشتباه واریزی و اضافه پرداختی عملکرد سال 1402",
                    administrationHeadName: "غلامرضا اسلامی",
                    groupHeadName: "مسعود بصیر",
                    seniorAuditorName: "مهدی دلفی",
                    createdByUserId: adminUserId,
                    nationalId: "10102345678",
                    directorGeneralName: "علی خورشیدی",
                    activityType: ActivityType.Manufacturing
                );

                if (off1602 != null)
                {
                    karunCase.SetOffice(off1602.Id, off1602.Code);
                }

                karunCase.UpdateAssessmentInfo(TaxAssessmentInfo.Create(
                    hasReturnFiled: true,
                    returnNumber: "777654321",
                    returnDateJalali: "1403/04/28",
                    finalizationMethod: FinalizationMethod.AuditBooks,
                    finalNoticeNumber: "555641789",
                    finalNoticeDateJalali: "1403/09/15",
                    assessedIncome: 2_500_000_000,
                    exemptions: 0,
                    assessedTax: 625_000_000,
                    nonWaivablePenalties: 0,
                    timelyPaymentBonus: 0,
                    finalityStage: FinalityStage.Tamkin
                ));

                karunCase.UpdateBreakdown(RefundBreakdown.Create(
                    principalTaxRefund: 120_000_000,
                    stampDutyRefund: 0,
                    otherRefund: 0,
                    penaltiesRefund: 0,
                    delayDamages: 0
                ));

                karunCase.AddReceipt(
                    rowIndex: 1,
                    receiptNumber: "88997711",
                    issueDateJalali: "1403/03/10",
                    paymentDateJalali: "1403/03/10",
                    amountRials: 745_000_000,
                    bankBranch: "اهواز",
                    city: "اهواز",
                    revenueLedgerRow: "ردیف 1"
                );

                context.TaxRefundCases.Add(karunCase);
                await context.SaveChangesAsync();
            }
            return;
        }

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
            nationalId: "10100000000",
            directorGeneralName: "علی خورشیدی",
            activityType: ActivityType.Commercial
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

        // Synchronize legacy AllowedRoles to include organizational roles
        var nonAdminItems = await context.MenuSettings
            .Where(m => !m.AdminOnly)
            .ToListAsync();

        bool hasModified = false;
        foreach (var item in nonAdminItems)
        {
            if (item.AllowedRoles == "Admin,Manager,Employee" || item.AllowedRoles == "Admin,Employee")
            {
                item.UpdateRoles(TaxSummary.Domain.Common.DefaultMenuSettings.AllGeneralRoles.Split(','));
                hasModified = true;
            }
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
                hasModified = true;
            }
        }

        // Clean up legacy Manager role from action_payroll_create_cycle if OfficeHead is not in AllowedRoles
        var cycleCreateSetting = await context.MenuSettings
            .FirstOrDefaultAsync(m => m.MenuKey == "action_payroll_create_cycle");
        if (cycleCreateSetting != null && cycleCreateSetting.AllowedRoles.Contains("Manager") && !cycleCreateSetting.AllowedRoles.Contains("OfficeHead"))
        {
            var cleanRoles = cycleCreateSetting.AllowedRoles
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(r => !string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase))
                .ToList();
            cycleCreateSetting.UpdateRoles(cleanRoles);
            hasModified = true;
        }

        // Backfill default ColorTheme and BadgeText for existing root modules if empty
        var rootModules = await context.MenuSettings
            .Where(m => m.ParentKey == null)
            .ToListAsync();

        foreach (var root in rootModules)
        {
            var def = defaultMenus.FirstOrDefault(d => string.Equals(d.MenuKey, root.MenuKey, StringComparison.OrdinalIgnoreCase));
            if (def != null && (root.ColorTheme == null || root.BadgeText == null))
            {
                root.UpdateMetadata(
                    root.Title,
                    root.Route,
                    root.Description,
                    root.UpdatedByUserId,
                    root.IconName,
                    root.ColorTheme ?? def.ColorTheme,
                    root.BadgeText ?? def.BadgeText
                );
                hasModified = true;
            }
        }

        if (hasModified)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedOfficesAndUserOfficesAsync(TaxSummaryDbContext context)
    {
        // 1. Gather all distinct department / service unit names from Employees and PayrollDepartmentEntries
        var empUnits = await context.Employees
            .Where(e => !string.IsNullOrWhiteSpace(e.ServiceUnit))
            .Select(e => e.ServiceUnit.Trim())
            .Distinct()
            .ToListAsync();

        var payrollUnits = await context.PayrollDepartmentEntries
            .Where(p => !string.IsNullOrWhiteSpace(p.DepartmentName))
            .Select(p => p.DepartmentName.Trim())
            .Distinct()
            .ToListAsync();

        var allCodes = empUnits.Union(payrollUnits, StringComparer.OrdinalIgnoreCase).ToList();

        // 2. Ensure each exists in Offices table
        var existingOffices = await context.Offices.ToListAsync();
        var existingOfficeMap = existingOffices.ToDictionary(o => o.Code.Trim(), o => o, StringComparer.OrdinalIgnoreCase);

        var newOffices = new List<Office>();

        for (int i = 1; i <= 22; i++)
        {
            var prefix = $"16{i:D2}";
            var officeCode = $"{prefix}00";
            var officeName = $"اداره امور مالیاتی {i} اهواز ({officeCode})";
            if (!existingOfficeMap.ContainsKey(officeCode))
            {
                var off = Office.Create(officeCode, officeName);
                newOffices.Add(off);
                existingOfficeMap[officeCode] = off;
            }

            for (int g = 1; g <= 5; g++)
            {
                var groupCode = $"{prefix}{g}0";
                var groupName = $"گروه {g} رسیدگی - اداره امور مالیاتی {i} اهواز ({groupCode})";
                if (!existingOfficeMap.ContainsKey(groupCode))
                {
                    var grp = Office.Create(groupCode, groupName);
                    newOffices.Add(grp);
                    existingOfficeMap[groupCode] = grp;
                }
            }
        }

        foreach (var code in allCodes)
        {
            if (!existingOfficeMap.ContainsKey(code))
            {
                var name = code.StartsWith("اداره") ? code : $"اداره {code}";
                var office = Office.Create(code, name);
                newOffices.Add(office);
                existingOfficeMap[code] = office;
            }
        }

        if (newOffices.Any())
        {
            await context.Offices.AddRangeAsync(newOffices);
            await context.SaveChangesAsync();
        }

        // 3. Link Employees to OfficeId if not set
        var employeesWithoutOffice = await context.Employees
            .Where(e => e.OfficeId == null && !string.IsNullOrWhiteSpace(e.ServiceUnit))
            .ToListAsync();

        bool hasEmpUpdated = false;
        foreach (var emp in employeesWithoutOffice)
        {
            if (existingOfficeMap.TryGetValue(emp.ServiceUnit.Trim(), out var off))
            {
                emp.SetOffice(off.Id);
                hasEmpUpdated = true;
            }
        }

        if (hasEmpUpdated)
        {
            await context.SaveChangesAsync();
        }

        // 4. Link existing users with an employee to their office if no UserOffices exist
        var usersWithoutOffices = await context.Users
            .Include(u => u.UserOffices)
            .Include(u => u.Employee)
            .Where(u => !u.UserOffices.Any() && u.Employee != null && u.Employee.OfficeId != null)
            .ToListAsync();

        var newUserOffices = new List<UserOffice>();
        foreach (var u in usersWithoutOffices)
        {
            if (u.Employee?.OfficeId != null)
            {
                newUserOffices.Add(UserOffice.Create(u.Id, u.Employee.OfficeId.Value));
            }
        }

        if (newUserOffices.Any())
        {
            await context.UserOffices.AddRangeAsync(newUserOffices);
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedRolesAsync(TaxSummaryDbContext context)
    {
        var defaultRoles = new[]
        {
            (Name: "Admin", Title: "مدیر ارشد سامانه", Description: "دسترسی نامحدود سیستمی به تمامی بخش‌ها و ادارات", Order: 1),
            (Name: "DirectorGeneral", Title: "مدیر کل امور مالیاتی", Description: "مدیر کل امور مالیاتی استان با دسترسی عالیه و نظارت بر کلیه ادارات و امضا نامه‌های ذیحسابی", Order: 2),
            (Name: "Treasury", Title: "ذیحساب", Description: "مسئول تایید پرداخت‌ها و استرداد وجوه در اداره امور مالی و ذیحسابی", Order: 3),
            (Name: "OfficeHead", Title: "رئیس اداره امور مالیاتی", Description: "رئیس امور یا اداره مالیاتی شهرستان با اختیارات صدور و تایید دستور استرداد (سطح ۱)", Order: 4),
            (Name: "GroupHead", Title: "رئیس گروه مالیاتی", Description: "رئیس گروه مالیاتی رسیدگی‌کننده پرونده‌ها (سطح ۲)", Order: 5),
            (Name: "Expert", Title: "کارشناس (ممیز مالیاتی)", Description: "کارشناس ارشد و رسیدگی‌کننده پرونده‌های مالیاتی (سطح ۳)", Order: 6),
            (Name: "ITSpecialist", Title: "کارشناس فناوری اطلاعات", Description: "کارشناس فناوری و پشتیبانی سامانه", Order: 7),
            (Name: "Manager", Title: "معاونت / مدیر", Description: "مدیران اجرایی و معاونت‌های سازمانی", Order: 8),
            (Name: "Employee", Title: "کارمند", Description: "پرسنل و کاربران عمومی سازمان", Order: 9),
        };

        foreach (var def in defaultRoles)
        {
            var existing = await context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == def.Name.ToLower());
            if (existing == null)
            {
                await context.Roles.AddAsync(Role.Create(
                    name: def.Name,
                    title: def.Title,
                    description: def.Description,
                    isSystemRole: true,
                    isActive: true,
                    displayOrder: def.Order));
            }
            else
            {
                existing.Update(def.Title, def.Description, existing.IsActive, def.Order);
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedTaxSourcesAsync(TaxSummaryDbContext context)
    {
        var defaultSources = new[]
        {
            (Id: 1, Code: "CorporateIncome", Title: "عملکرد اشخاص حقوقی (شرکت‌ها)", Description: "مالیات بر درآمد اشخاص حقوقی و شرکت‌ها موضوع فصل پنجم باب سوم قانون مالیات‌های مستقیم", DisplayOrder: 1),
            (Id: 2, Code: "PersonalBusiness", Title: "عملکرد مشاغل و اشخاص حقیقی", Description: "مالیات بر درآمد مشاغل موضوع فصل چهارم باب سوم قانون مالیات‌های مستقیم", DisplayOrder: 2),
            (Id: 3, Code: "SalaryPayroll", Title: "مالیات بر حقوق", Description: "مالیات بر درآمد حقوق موضوع فصل سوم باب سوم قانون مالیات‌های مستقیم", DisplayOrder: 3),
            (Id: 4, Code: "ValueAddedTax", Title: "مالیات بر ارزش افزوده", Description: "مالیات و عوارض بر ارزش افزوده کالاها و خدمات", DisplayOrder: 4),
            (Id: 5, Code: "PropertyRental", Title: "درآمد اجاره املاک", Description: "مالیات بر درآمد املاک و اجاره موضوع فصل اول باب سوم قانون مالیات‌های مستقیم", DisplayOrder: 5),
            (Id: 6, Code: "PropertyTransfer", Title: "نقل و انتقال املاک", Description: "مالیات بر نقل و انتقال قطعی املاک و حق واگذاری موضوع ماده ۵۹", DisplayOrder: 6),
            (Id: 7, Code: "Vehicles", Title: "مالیات بر خودرو", Description: "مالیات بر انواع خودروهای سواری و وانت دوکابین گران‌قیمت و نقل و انتقال", DisplayOrder: 7)
        };

        foreach (var def in defaultSources)
        {
            var existing = await context.TaxSources.FirstOrDefaultAsync(t => t.Id == def.Id);
            if (existing == null)
            {
                await context.TaxSources.AddAsync(TaxSource.Create(
                    id: def.Id,
                    code: def.Code,
                    title: def.Title,
                    description: def.Description,
                    isActive: true,
                    displayOrder: def.DisplayOrder,
                    isSystem: true));
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedFinalityStagesAsync(TaxSummaryDbContext context)
    {
        var defaultStages = new[]
        {
            (Id: 1, Code: "Tamkin", Title: "تمکین", Description: "تمکین مودی به برگ تشخیص مالیات ابلاغی موضوع ماده ۲۳۸ و ۲۳۹ ق.م.م", DisplayOrder: 1),
            (Id: 2, Code: "Agreement", Title: "توافق", Description: "توافق با رئیس امور مالیاتی موضوع ماده ۲۳۸ قانون مالیات‌های مستقیم", DisplayOrder: 2),
            (Id: 3, Code: "PrimaryBoard244", Title: "رای هیات بدوی ۲۴۴", Description: "صدور رای قطعی یا لازم‌الاجرا در هیات حل اختلاف مالیاتی بدوی موضوع ماده ۲۴۴", DisplayOrder: 3),
            (Id: 4, Code: "AppellateBoard247", Title: "رای هیأت تجدیدنظر ۲۴۷", Description: "صدور رای قطعی در هیات حل اختلاف مالیاتی تجدیدنظر موضوع ماده ۲۴۷", DisplayOrder: 4),
            (Id: 5, Code: "SupremeTaxCouncil251", Title: "شورای عالی مالیاتی ۲۵۱", Description: "رسیدگی و نقض یا تایید رای در شعب شورای عالی مالیاتی موضوع ماده ۲۵۱", DisplayOrder: 5),
            (Id: 6, Code: "Board251Repeated", Title: "هیات ۲۵۱ مکرر", Description: "رسیدگی به ادعای غیرعادلانه بودن مالیات در هیات ماده ۲۵۱ مکرر به دستور وزیر امور اقتصادی و دارایی", DisplayOrder: 6),
            (Id: 7, Code: "Board257", Title: "هیات ۲۵۷", Description: "رسیدگی مجدد در هیات حل اختلاف مالیاتی هم‌عرض موضوع ماده ۲۵۷", DisplayOrder: 7),
            (Id: 8, Code: "Board216", Title: "هیات ۲۱۶", Description: "شکایت از اقدامات اجرایی وصول مالیات در هیات حل اختلاف مالیاتی موضوع ماده ۲۱۶", DisplayOrder: 8),
            (Id: 9, Code: "ParallelBoard", Title: "هیات هم عرض", Description: "رسیدگی در هیات هم‌عرض پیرو احکام مراجع قضایی یا دیوان عدالت اداری", DisplayOrder: 9)
        };

        foreach (var def in defaultStages)
        {
            var existing = await context.FinalityStages.FirstOrDefaultAsync(t => t.Id == def.Id);
            if (existing == null)
            {
                await context.FinalityStages.AddAsync(TaxFinalityStage.Create(
                    id: def.Id,
                    code: def.Code,
                    title: def.Title,
                    description: def.Description,
                    isActive: true,
                    displayOrder: def.DisplayOrder,
                    isSystem: true));
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task BackfillPayrollCycleCodesAsync(TaxSummaryDbContext context)
    {
        var cyclesWithoutCode = await context.PayrollCycles
            .Where(c => string.IsNullOrEmpty(c.CycleCode))
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        if (!cyclesWithoutCode.Any()) return;

        var periodGroups = cyclesWithoutCode
            .GroupBy(c => new { c.FiscalYear, c.FiscalMonth, c.ProcessType });

        foreach (var group in periodGroups)
        {
            var prefix = group.Key.ProcessType switch
            {
                "OvertimeWelfareRated" => "OWR",
                "OvertimeWelfareMonetary" => "OWM",
                "HalfPercentBonus" => "HPB",
                _ => "GEN"
            };

            int existingAssigned = await context.PayrollCycles
                .CountAsync(c => c.FiscalYear == group.Key.FiscalYear &&
                                 c.FiscalMonth == group.Key.FiscalMonth &&
                                 c.ProcessType == group.Key.ProcessType &&
                                 !string.IsNullOrEmpty(c.CycleCode));

            int seq = existingAssigned + 1;
            foreach (var cycle in group)
            {
                cycle.SetCycleCode($"PAY-{group.Key.FiscalYear}{group.Key.FiscalMonth:D2}-{prefix}-{seq:D2}");
                seq++;
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedRefundWorkflowStepsAsync(TaxSummaryDbContext context)
    {
        // Safe ensure table exists in SQLite even before or alongside migrations
        if (!context.Database.IsInMemory())
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS RefundWorkflowSteps (
                    Id TEXT PRIMARY KEY NOT NULL,
                    Stage INTEGER NOT NULL,
                    Title TEXT NOT NULL,
                    Description TEXT NULL,
                    StepOrder INTEGER NOT NULL,
                    IsEnabled INTEGER NOT NULL,
                    IsMandatory INTEGER NOT NULL,
                    AllowedRoles TEXT NOT NULL,
                    CreatedAt TEXT NOT NULL,
                    UpdatedAt TEXT NOT NULL,
                    UpdatedByUserId TEXT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS IX_RefundWorkflowSteps_Stage ON RefundWorkflowSteps (Stage);
                CREATE INDEX IF NOT EXISTS IX_RefundWorkflowSteps_StepOrder ON RefundWorkflowSteps (StepOrder);

                INSERT OR IGNORE INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES ('20260916083000_AddCycleCodeToPayrollCycles', '8.0.1');
                INSERT OR IGNORE INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES ('20260920051208_AddRefundWorkflowStepsTable', '8.0.1');
            ");
        }

        var defaults = TaxSummary.Domain.Common.DefaultRefundWorkflowSteps.GetDefaults();

        foreach (var def in defaults)
        {
            var existing = await context.RefundWorkflowSteps.FirstOrDefaultAsync(s => s.Stage == def.Stage);
            if (existing == null)
            {
                await context.RefundWorkflowSteps.AddAsync(def);
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SyncEmployeePhotosFromDiskAsync(TaxSummaryDbContext context)
    {
        try
        {
            var baseDir = AppContext.BaseDirectory;
            var photosDir = Path.Combine(baseDir, "wwwroot", "uploads", "employee-photos");
            if (!Directory.Exists(photosDir))
            {
                var devPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "employee-photos");
                if (Directory.Exists(devPath))
                {
                    photosDir = devPath;
                }
            }

            if (!Directory.Exists(photosDir)) return;

            var existingFiles = Directory.GetFiles(photosDir, "*.*")
                .Select(Path.GetFileName)
                .Where(f => !string.IsNullOrEmpty(f))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var employeesWithoutPhoto = await context.Employees
                .Where(e => e.NationalId != null && (e.PhotoUrl == null || e.PhotoUrl == ""))
                .ToListAsync();

            bool changed = false;
            foreach (var emp in employeesWithoutPhoto)
            {
                var nid = emp.NationalId!.Trim();
                if (existingFiles.Contains($"{nid}.jpg"))
                {
                    emp.UpdatePhoto($"/uploads/employee-photos/{nid}.jpg");
                    changed = true;
                }
                else if (existingFiles.Contains($"{nid}.png"))
                {
                    emp.UpdatePhoto($"/uploads/employee-photos/{nid}.png");
                    changed = true;
                }
            }

            if (changed)
            {
                await context.SaveChangesAsync();
            }
        }
        catch
        {
            // Non-critical, do not block startup
        }
    }

    /// <summary>
    /// Checks and automatically applies missing columns and tables to existing SQLite production databases.
    /// This prevents startup crashes when updating existing databases that already have data.
    /// </summary>
    private static async Task EnsureSchemaUpToDateAsync(TaxSummaryDbContext context)
    {
        if (context.Database.IsInMemory()) return;

        try
        {
            var connection = context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            using var command = connection.CreateCommand();

            // 1. Ensure __EFMigrationsHistory exists
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                    ""MigrationId"" TEXT NOT NULL CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY,
                    ""ProductVersion"" TEXT NOT NULL
                );";
            await command.ExecuteNonQueryAsync();

            // 2. Ensure Employees columns exist
            command.CommandText = "PRAGMA table_info(Employees);";
            var employeeColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    employeeColumns.Add(reader.GetString(1));
                }
            }

            if (employeeColumns.Count > 0)
            {
                if (!employeeColumns.Contains("EmploymentDate"))
                {
                    command.CommandText = "ALTER TABLE Employees ADD COLUMN EmploymentDate TEXT NULL;";
                    await command.ExecuteNonQueryAsync();
                }

                if (!employeeColumns.Contains("AppointmentDate"))
                {
                    command.CommandText = "ALTER TABLE Employees ADD COLUMN AppointmentDate TEXT NULL;";
                    await command.ExecuteNonQueryAsync();
                }

                if (!employeeColumns.Contains("ServiceMonths"))
                {
                    command.CommandText = "ALTER TABLE Employees ADD COLUMN ServiceMonths INTEGER NOT NULL DEFAULT 0;";
                    await command.ExecuteNonQueryAsync();
                }
            }

            // 3. Ensure PerformanceCapabilities columns exist
            command.CommandText = "PRAGMA table_info(PerformanceCapabilities);";
            var perfColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    perfColumns.Add(reader.GetString(1));
                }
            }

            if (perfColumns.Count > 0)
            {
                var perfColumnsToAdd = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Collections1404_Amount"] = "REAL NOT NULL DEFAULT 0",
                    ["Collections1405_Amount"] = "REAL NOT NULL DEFAULT 0",
                    ["TotalObjections_Quantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["IssuedRulings_Quantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["IssuedRulings_Percentage"] = "REAL NOT NULL DEFAULT 0",
                    ["FinalizedObjections_Quantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["FinalizedRulings_Percentage"] = "REAL NOT NULL DEFAULT 0",
                    ["SystemicAudit1399_TotalQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1399_ObjectionQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1399_ObjectionPercentage"] = "REAL NOT NULL DEFAULT 0",
                    ["SystemicAudit1399_FinalizedObjectionQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1399_FinalizedObjectionPercentage"] = "REAL NOT NULL DEFAULT 0",
                    ["SystemicAudit1403_TotalQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1403_ObjectionQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1403_ObjectionPercentage"] = "REAL NOT NULL DEFAULT 0",
                    ["SystemicAudit1403_FinalizedObjectionQuantity"] = "INTEGER NOT NULL DEFAULT 0",
                    ["SystemicAudit1403_FinalizedObjectionPercentage"] = "REAL NOT NULL DEFAULT 0"
                };

                foreach (var (colName, colDef) in perfColumnsToAdd)
                {
                    if (!perfColumns.Contains(colName))
                    {
                        command.CommandText = $"ALTER TABLE PerformanceCapabilities ADD COLUMN {colName} {colDef};";
                        await command.ExecuteNonQueryAsync();
                    }
                }
            }

            // Ensure MenuSettings columns ColorTheme and BadgeText exist
            command.CommandText = "PRAGMA table_info(MenuSettings);";
            var menuColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    menuColumns.Add(reader.GetString(1));
                }
            }

            if (menuColumns.Count > 0)
            {
                if (!menuColumns.Contains("ColorTheme"))
                {
                    command.CommandText = "ALTER TABLE MenuSettings ADD COLUMN ColorTheme TEXT NULL;";
                    await command.ExecuteNonQueryAsync();
                }

                if (!menuColumns.Contains("BadgeText"))
                {
                    command.CommandText = "ALTER TABLE MenuSettings ADD COLUMN BadgeText TEXT NULL;";
                    await command.ExecuteNonQueryAsync();
                }
            }

            // 4. Ensure AuditorPerformanceMetricDefinitions table exists
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS ""AuditorPerformanceMetricDefinitions"" (
                    ""Id"" TEXT NOT NULL CONSTRAINT ""PK_AuditorPerformanceMetricDefinitions"" PRIMARY KEY,
                    ""MetricCode"" TEXT NOT NULL,
                    ""Title"" TEXT NOT NULL,
                    ""Description"" TEXT NOT NULL,
                    ""Category"" INTEGER NOT NULL,
                    ""FormulaType"" INTEGER NOT NULL,
                    ""PrimaryField"" TEXT NOT NULL,
                    ""SecondaryField"" TEXT NULL,
                    ""Multiplier"" decimal(18,4) NOT NULL,
                    ""WeightPercentage"" decimal(18,2) NOT NULL,
                    ""HigherIsBetter"" INTEGER NOT NULL,
                    ""TargetValue"" decimal(18,4) NOT NULL,
                    ""WarningThreshold"" decimal(18,4) NOT NULL,
                    ""CriticalThreshold"" decimal(18,4) NOT NULL,
                    ""Unit"" TEXT NOT NULL,
                    ""DisplayOrder"" INTEGER NOT NULL,
                    ""IsActive"" INTEGER NOT NULL,
                    ""TierThresholdsJson"" TEXT NOT NULL,
                    ""CreatedAt"" TEXT NOT NULL,
                    ""UpdatedAt"" TEXT NULL
                );";
            await command.ExecuteNonQueryAsync();

            // 5. Ensure SanimAuditAssessments table exists
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS ""SanimAuditAssessments"" (
                    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_SanimAuditAssessments"" PRIMARY KEY,
                    ""UpdateDateJalali"" TEXT NOT NULL,
                    ""AuditStatus"" TEXT NOT NULL,
                    ""FinalOfficeName"" TEXT NOT NULL,
                    ""InitialOfficeName"" TEXT NOT NULL,
                    ""DeclarationId"" TEXT NULL,
                    ""TaxpayerTrackingCode"" TEXT NULL,
                    ""TaxpayerName"" TEXT NOT NULL,
                    ""TaxpayerTin"" TEXT NOT NULL,
                    ""FiscalYear"" INTEGER NOT NULL,
                    ""TaxSource"" TEXT NOT NULL,
                    ""TaxPeriod"" INTEGER NULL,
                    ""RiskLevel"" TEXT NULL,
                    ""AuditTrackingId"" TEXT NULL,
                    ""AuditorName"" TEXT NOT NULL,
                    ""AuditorNationalId"" TEXT NULL,
                    ""AssessmentNoticeDateJalali"" TEXT NULL,
                    ""FinalNoticeDateJalali"" TEXT NULL,
                    ""AssessedTaxAmount"" decimal(18,2) NOT NULL,
                    ""DeclaredTaxAmount"" decimal(18,2) NOT NULL,
                    ""FinalTaxAmount"" decimal(18,2) NOT NULL,
                    ""Stage"" TEXT NULL,
                    ""YearlyType"" TEXT NULL,
                    ""CaseType"" TEXT NULL,
                    ""WarehouseUploadDateJalali"" TEXT NULL,
                    ""AuditorAssignmentDateJalali"" TEXT NULL,
                    ""DaysAssignmentToNotice"" INTEGER NULL,
                    ""DaysAssignmentToFinal"" INTEGER NULL,
                    ""DaysNoticeToFinal"" INTEGER NULL,
                    ""CurrentStatus"" TEXT NULL,
                    ""NextStatus"" TEXT NULL,
                    ""FinalizationSource"" TEXT NULL,
                    ""OfficeId"" TEXT NULL
                );";
            await command.ExecuteNonQueryAsync();

            // 7. Ensure SystemSettings table exists
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS ""SystemSettings"" (
                    ""Id"" TEXT NOT NULL CONSTRAINT ""PK_SystemSettings"" PRIMARY KEY,
                    ""SettingKey"" TEXT NOT NULL,
                    ""OrganizationName"" TEXT NOT NULL,
                    ""SystemTitle"" TEXT NOT NULL,
                    ""LogoPath"" TEXT NOT NULL,
                    ""ReportingModuleTitle"" TEXT NOT NULL,
                    ""ReportingModuleSubtitle"" TEXT NOT NULL,
                    ""UpdatedAt"" TEXT NOT NULL,
                    ""UpdatedBy"" TEXT NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_SystemSettings_SettingKey"" ON ""SystemSettings"" (""SettingKey"");";
            await command.ExecuteNonQueryAsync();

            // Record migrations as applied in __EFMigrationsHistory
            command.CommandText = @"
                INSERT OR IGNORE INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES ('20261102050338_AddExecutiveServiceDatesAndPerformanceMetrics', '8.0.0');
                INSERT OR IGNORE INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES ('20261102064430_AddSystemicAuditPerformanceMetrics', '8.0.0');";
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbInitializer] Warning during EnsureSchemaUpToDateAsync: {ex.Message}");
        }
    }

    private static async Task SeedSystemSettingsAsync(TaxSummaryDbContext context)
    {
        if (!await context.SystemSettings.AnyAsync(s => s.SettingKey == SystemSetting.DefaultSettingKey))
        {
            await context.SystemSettings.AddAsync(SystemSetting.CreateDefault());
            await context.SaveChangesAsync();
        }
    }
}

