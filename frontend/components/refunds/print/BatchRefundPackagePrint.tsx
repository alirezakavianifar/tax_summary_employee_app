'use client'

import React from 'react'
import type { PrintableDocument } from '@/types/taxRefund'
import { ChecklistPrint } from './ChecklistPrint'
import { TreasuryLetterPrint } from './TreasuryLetterPrint'
import { InquiryCircularPrint } from './InquiryCircularPrint'
import { JustificationReportPart1Print } from './JustificationReportPart1Print'
import { JustificationReportPart2Print } from './JustificationReportPart2Print'
import { StatutoryRefundVoucherPrint } from './StatutoryRefundVoucherPrint'
import { AuditorCommitmentPrint } from './AuditorCommitmentPrint'
import { TableAPrint } from './TableAPrint'

interface BatchRefundPackagePrintProps {
  data: PrintableDocument
}

export function BatchRefundPackagePrint({ data }: BatchRefundPackagePrintProps) {
  return (
    <div className="batch-refund-package">
      {/* 1. Checklist (cheklist) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <ChecklistPrint data={data} />
      </div>

      {/* 2. Treasury Letter (form1) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <TreasuryLetterPrint data={data} />
      </div>

      {/* 3. Inquiry Circular (form2) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <InquiryCircularPrint data={data} />
      </div>

      {/* 4. Justification Report Part 1 (form3) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <JustificationReportPart1Print data={data} />
      </div>

      {/* 5. Justification Report Part 2 (form4) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <JustificationReportPart2Print data={data} />
      </div>

      {/* 6. Statutory Refund Voucher (form5) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <StatutoryRefundVoucherPrint data={data} />
      </div>

      {/* 7. Auditor Commitment (form6) */}
      <div className="print:break-after-page page-break mb-8 print:mb-0">
        <AuditorCommitmentPrint data={data} />
      </div>

      {/* 8. Table A Schedule (form7) */}
      <div className="mb-8 print:mb-0">
        <TableAPrint data={data} />
      </div>
    </div>
  )
}
