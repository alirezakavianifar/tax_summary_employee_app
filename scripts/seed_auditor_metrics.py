import sqlite3
import uuid
import datetime

conn = sqlite3.connect('Backend/TaxSummary.Api/taxsummary.db')
cur = conn.cursor()

cur.execute('''
CREATE TABLE IF NOT EXISTS AuditorPerformanceMetricDefinitions (
    Id TEXT PRIMARY KEY NOT NULL,
    MetricCode TEXT NOT NULL UNIQUE,
    Title TEXT NOT NULL,
    Description TEXT,
    Category INTEGER NOT NULL,
    FormulaType INTEGER NOT NULL,
    PrimaryField TEXT NOT NULL,
    SecondaryField TEXT,
    Multiplier TEXT NOT NULL,
    WeightPercentage TEXT NOT NULL,
    HigherIsBetter INTEGER NOT NULL,
    TargetValue TEXT NOT NULL,
    WarningThreshold TEXT NOT NULL,
    CriticalThreshold TEXT NOT NULL,
    Unit TEXT NOT NULL,
    DisplayOrder INTEGER NOT NULL,
    IsActive INTEGER NOT NULL,
    TierThresholdsJson TEXT,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT
)
''')

cur.execute('CREATE UNIQUE INDEX IF NOT EXISTS IX_AuditorPerformanceMetricDefinitions_MetricCode ON AuditorPerformanceMetricDefinitions (MetricCode)')
cur.execute('CREATE INDEX IF NOT EXISTS IX_AuditorPerformanceMetricDefinitions_IsActive ON AuditorPerformanceMetricDefinitions (IsActive)')

now = datetime.datetime.utcnow().isoformat()

cur.execute('SELECT COUNT(*) FROM AuditorPerformanceMetricDefinitions')
if cur.fetchone()[0] == 0:
    defaults = [
        (
            str(uuid.uuid4()).upper(),
            'METRIC_DEFENSIBILITY',
            'ضریب تثبیت و استحکام برگ تشخیص',
            'نسبت مالیات قطعی به مالیات تشخیصی جهت سنجش استواری حقوقی برگ‌های تشخیص صادره حسابرس',
            1, # Quality
            1, # Ratio
            'FinalTaxAmount',
            'AssessedTaxAmount',
            '100',
            '30', # 30%
            1,
            '85',
            '70',
            '50',
            '%',
            1,
            1,
            '{"A": 85, "B": 70, "C": 50}',
            now,
            None
        ),
        (
            str(uuid.uuid4()).upper(),
            'METRIC_TAX_GAP_DISCOVERY',
            'مابه‌التفاوت ابراز تا تشخیص (کشف ماخذ)',
            'میزان مالیات اضافه تشخیصی نسبت به ابراز مودی ناشی از ممیزی دقیق و کشف فرار مالیاتی',
            2, # Financial
            2, # Difference
            'AssessedTaxAmount',
            'DeclaredTaxAmount',
            '1',
            '25', # 25%
            1,
            '20000000000',
            '5000000000',
            '0',
            'ریال',
            2,
            1,
            '{"A": 20000000000, "B": 5000000000, "C": 0}',
            now,
            None
        ),
        (
            str(uuid.uuid4()).upper(),
            'METRIC_SPEED_NOTICE',
            'سرعت صدور برگ تشخیص (تخصیص تا ابلاغ)',
            'میانگین روزهای سپری‌شده از زمان ارجاع پرونده تا صدور و ابلاغ برگ تشخیص مالیات',
            3, # Speed
            3, # Average
            'DaysAssignmentToNotice',
            None,
            '1',
            '25', # 25%
            0, # Lower is better
            '45',
            '70',
            '90',
            'روز',
            3,
            1,
            '{"A": 45, "B": 70, "C": 90}',
            now,
            None
        ),
        (
            str(uuid.uuid4()).upper(),
            'METRIC_THROUGHPUT',
            'حجم پرونده‌های رسیدگی‌شده (مختومه)',
            'تعداد کل پرونده‌های رسیدگی‌شده توسط حسابرس در دوره مالیاتی',
            4, # Productivity
            4, # Count
            'AuditStatus',
            None,
            '1',
            '10', # 10%
            1,
            '80',
            '50',
            '30',
            'فقره',
            4,
            1,
            '{"A": 80, "B": 50, "C": 30}',
            now,
            None
        ),
        (
            str(uuid.uuid4()).upper(),
            'METRIC_RISK_COMPLEXITY',
            'سهم رسیدگی به پرونده‌های پرریسک',
            'درصد پرونده‌های پرریسک حسابرسی‌شده از کل پرونده‌های تخصیصی حسابرس',
            1, # Quality
            5, # Percentage
            'RiskLevel',
            None,
            '1',
            '10', # 10%
            1,
            '30',
            '15',
            '5',
            '%',
            5,
            1,
            '{"A": 30, "B": 15, "C": 5}',
            now,
            None
        )
    ]
    cur.executemany('''
    INSERT INTO AuditorPerformanceMetricDefinitions (
        Id, MetricCode, Title, Description, Category, FormulaType,
        PrimaryField, SecondaryField, Multiplier, WeightPercentage,
        HigherIsBetter, TargetValue, WarningThreshold, CriticalThreshold,
        Unit, DisplayOrder, IsActive, TierThresholdsJson, CreatedAt, UpdatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', defaults)
    conn.commit()
    print('Seeded 5 default metrics successfully!')
else:
    print('AuditorPerformanceMetricDefinitions already has data.')

conn.close()
