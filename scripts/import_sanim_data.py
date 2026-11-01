import sqlite3
import openpyxl
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

EXCEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'sample_data', 'sampleData.xlsx')
DB_PATHS = [
    os.path.join(os.path.dirname(__file__), '..', 'Backend', 'TaxSummary.Api', 'taxsummary.db'),
    os.path.join(os.path.dirname(__file__), '..', 'deployment', 'backend', 'taxsummary.db')
]

TABLE_DDL = """
CREATE TABLE IF NOT EXISTS SanimAuditAssessments (
    Id INTEGER PRIMARY KEY NOT NULL,
    UpdateDateJalali TEXT NOT NULL,
    AuditStatus TEXT NOT NULL,
    FinalOfficeName TEXT NOT NULL,
    InitialOfficeName TEXT NOT NULL,
    DeclarationId TEXT NULL,
    TaxpayerTrackingCode TEXT NULL,
    TaxpayerName TEXT NOT NULL,
    TaxpayerTin TEXT NOT NULL,
    FiscalYear INTEGER NOT NULL,
    TaxSource TEXT NOT NULL,
    TaxPeriod INTEGER NULL,
    RiskLevel TEXT NULL,
    AuditTrackingId TEXT NULL,
    AuditorName TEXT NOT NULL,
    AuditorNationalId TEXT NULL,
    AssessmentNoticeDateJalali TEXT NULL,
    FinalNoticeDateJalali TEXT NULL,
    AssessedTaxAmount REAL NOT NULL,
    DeclaredTaxAmount REAL NOT NULL,
    FinalTaxAmount REAL NOT NULL,
    Stage TEXT NULL,
    YearlyType TEXT NULL,
    CaseType TEXT NULL,
    WarehouseUploadDateJalali TEXT NULL,
    AuditorAssignmentDateJalali TEXT NULL,
    DaysAssignmentToNotice INTEGER NULL,
    DaysAssignmentToFinal INTEGER NULL,
    DaysNoticeToFinal INTEGER NULL,
    CurrentStatus TEXT NULL,
    NextStatus TEXT NULL,
    FinalizationSource TEXT NULL,
    OfficeId TEXT NULL
);

CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_FiscalYear ON SanimAuditAssessments (FiscalYear);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_TaxSource ON SanimAuditAssessments (TaxSource);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_AuditStatus ON SanimAuditAssessments (AuditStatus);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_FinalOfficeName ON SanimAuditAssessments (FinalOfficeName);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_TaxpayerTin ON SanimAuditAssessments (TaxpayerTin);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_AuditorName ON SanimAuditAssessments (AuditorName);
CREATE INDEX IF NOT EXISTS IX_SanimAuditAssessments_OfficeId ON SanimAuditAssessments (OfficeId);
"""

def parse_int(val):
    if val is None or val == '' or str(val).strip().upper() == 'NULL':
        return None
    try:
        return int(float(val))
    except:
        return None

def parse_float(val):
    if val is None or val == '' or str(val).strip().upper() == 'NULL':
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def parse_str(val):
    if val is None:
        return None
    s = str(val).strip()
    return None if s.upper() == 'NULL' or s == '' else s

def load_data_from_excel():
    print(f"Reading Excel: {EXCEL_PATH}...")
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = []
    
    # Header is row 1
    first = True
    for r in ws.iter_rows(values_only=True):
        if first:
            first = False
            continue
        if not r or r[0] is None:
            continue
            
        row_id = parse_int(r[0])
        if row_id is None:
            continue

        item = (
            row_id,
            parse_str(r[1]) or '',
            parse_str(r[2]) or 'رسیدگی شده',
            parse_str(r[3]) or '',
            parse_str(r[4]) or '',
            parse_str(r[5]),
            parse_str(r[6]),
            parse_str(r[7]) or '',
            parse_str(r[8]) or '',
            parse_int(r[9]) or 1403,
            parse_str(r[10]) or 'مالیات بر ارزش افزوده',
            parse_int(r[11]),
            parse_str(r[12]),
            parse_str(r[13]),
            parse_str(r[14]) or '',
            parse_str(r[15]),
            parse_str(r[16]),
            parse_str(r[17]),
            parse_float(r[18]),
            parse_float(r[19]),
            parse_float(r[20]),
            parse_str(r[21]),
            parse_str(r[22]),
            parse_str(r[23]),
            parse_str(r[24]),
            parse_str(r[25]),
            parse_int(r[26]),
            parse_int(r[27]),
            parse_int(r[28]),
            parse_str(r[29]),
            parse_str(r[30]),
            parse_str(r[31]),
            None # OfficeId resolved later
        )
        rows.append(item)
    print(f"Loaded {len(rows)} records from Excel.")
    return rows

def import_into_db(db_path, data):
    if not os.path.exists(os.path.dirname(db_path)):
        print(f"Directory for {db_path} does not exist, skipping.")
        return

    print(f"Importing into {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.executescript(TABLE_DDL)

    # Check if offices exist to resolve OfficeId
    cur.execute("SELECT Id, Code, Name FROM Offices")
    office_lookup = []
    for oid, ocode, oname in cur.fetchall():
        clean_code = str(ocode).strip()
        clean_name = str(oname).strip().replace('اداره', '').strip()
        office_lookup.append((oid, clean_code, clean_name))

    # Resolve OfficeId for records
    resolved_data = []
    for item in data:
        item_list = list(item)
        final_office = item_list[3]
        matched_oid = None
        for oid, code, name in office_lookup:
            if code and code in final_office:
                matched_oid = oid
                break
            if name and name in final_office:
                matched_oid = oid
                break
        item_list[32] = matched_oid
        resolved_data.append(tuple(item_list))

    cur.execute("SELECT COUNT(*) FROM SanimAuditAssessments")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"  Table already has {count} records. Clearing before re-import...")
        cur.execute("DELETE FROM SanimAuditAssessments")

    insert_sql = """
    INSERT INTO SanimAuditAssessments (
        Id, UpdateDateJalali, AuditStatus, FinalOfficeName, InitialOfficeName,
        DeclarationId, TaxpayerTrackingCode, TaxpayerName, TaxpayerTin, FiscalYear,
        TaxSource, TaxPeriod, RiskLevel, AuditTrackingId, AuditorName,
        AuditorNationalId, AssessmentNoticeDateJalali, FinalNoticeDateJalali,
        AssessedTaxAmount, DeclaredTaxAmount, FinalTaxAmount, Stage,
        YearlyType, CaseType, WarehouseUploadDateJalali, AuditorAssignmentDateJalali,
        DaysAssignmentToNotice, DaysAssignmentToFinal, DaysNoticeToFinal,
        CurrentStatus, NextStatus, FinalizationSource, OfficeId
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
    )
    """

    cur.executemany(insert_sql, resolved_data)
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM SanimAuditAssessments")
    final_count = cur.fetchone()[0]
    print(f"  Successfully imported {final_count} records into {db_path}.")
    conn.close()

if __name__ == '__main__':
    data = load_data_from_excel()
    for db in DB_PATHS:
        import_into_db(db, data)
    print("All imports completed successfully.")
