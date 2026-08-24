import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button.js';
import { formatRupee, formatRupeeCompact, downloadBlob, todayStamp } from '@financeos/shared';

export interface TaxExportData {
  /** Financial year label */
  financialYear: string;
  /** Regime chosen */
  regime: 'old' | 'new';
  /** Gross salary */
  grossSalary: number;
  /** Deductions breakdown */
  deductions: Record<string, { claimed: number; limit: number; section: string }>;
  /** Taxable income */
  taxableIncome: number;
  /** Total tax */
  totalTax: number;
  /** Old regime tax */
  oldTax: number;
  /** New regime tax */
  newTax: number;
  /** Savings by choosing optimal regime */
  savings: number;
  /** Optimization actions */
  actions?: Array<{
    title: string;
    section: string;
    amount: number;
    taxSaving?: number;
    completed: boolean;
  }>;
  /** TDS deducted */
  tdsDeducted?: number;
  /** Net advance tax liability */
  netAdvanceTaxLiability?: number;
  /** Advance tax schedule */
  advanceTaxSchedule?: Array<{ quarter: string; amount: number; cumulativePct: number; dueDate: string }>;
  /** Capital gains summary */
  capitalGains?: {
    gain: number;
    type: string;
    rate: number;
    tax: number;
  };
}

export interface TaxExportButtonProps {
  /** Export data */
  data: TaxExportData;
  /** Button label */
  label?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** On export start */
  onExportStart?: () => void;
  /** On export complete */
  onExportComplete?: () => void;
  /** On export error */
  onExportError?: (error: Error) => void;
}

const generatePDFContent = (data: TaxExportData): string => {
  const formatINR = formatRupeeCompact;
  const formatINRExact = formatRupee;

  const regimeLabel = data.regime === 'old' ? 'Old Regime' : 'New Regime';
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let content = `
MYFINANCEOS — INDIA TAX OPTIMIZATION REPORT
Generated: ${date}
Financial Year: ${data.financialYear}
================================================================================

REGIME SELECTION
----------------
Selected Regime: ${regimeLabel}
Gross Annual Income: ${formatINR(data.grossSalary)}
Taxable Income (${regimeLabel}): ${formatINR(data.taxableIncome)}
Total Tax Liability: ${formatINRExact(data.totalTax)}

COMPARISON SUMMARY
------------------
Old Regime Tax: ${formatINRExact(data.oldTax)}
New Regime Tax: ${formatINRExact(data.newTax)}
Optimal Regime: ${data.oldTax < data.newTax ? 'Old Regime' : 'New Regime'}
Annual Savings: ${formatINR(data.savings)}
`;

  if (data.tdsDeducted !== undefined) {
    content += `
TDS & ADVANCE TAX
-----------------
Total TDS Deducted: ${formatINR(data.tdsDeducted)}
Net Advance Tax Liability: ${formatINR(data.netAdvanceTaxLiability || 0)}
`;
    if (data.advanceTaxSchedule && data.advanceTaxSchedule.length > 0) {
      content += '\nAdvance Tax Schedule:\n';
      data.advanceTaxSchedule.forEach(q => {
        content += `  ${q.quarter}: ${formatINR(q.amount)} (Cumulative ${q.cumulativePct}% by ${q.dueDate})\n`;
      });
    }
  }

  content += `
DEDUCTIONS BREAKDOWN
--------------------
`;

  Object.entries(data.deductions).forEach(([key, deduction]) => {
    const pct = deduction.limit > 0 ? ((deduction.claimed / deduction.limit) * 100).toFixed(0) : '0';
    content += `${deduction.section} (${key}):\n`;
    content += `  Claimed: ${formatINR(deduction.claimed)} / Limit: ${formatINR(deduction.limit)} (${pct}% utilized)\n`;
  });

  if (data.capitalGains) {
    content += `
CAPITAL GAINS SUMMARY
---------------------
Total Gains: ${formatINR(data.capitalGains.gain)}
Classification: ${data.capitalGains.type}
Tax Rate: ${data.capitalGains.rate}%
Gains Tax Due: ${formatINRExact(data.capitalGains.tax)}
`;
  }

  if (data.actions && data.actions.length > 0) {
    content += `
OPTIMIZATION ACTIONS
--------------------
`;

    const pendingActions = data.actions.filter(a => !a.completed);
    const completedActions = data.actions.filter(a => a.completed);

    if (pendingActions.length > 0) {
      content += 'PENDING:\n';
      pendingActions.forEach((action, i) => {
        content += `  ${i + 1}. ${action.title} [${action.section}]\n`;
        content += `     Action: ${formatINR(action.amount)}`;
        if (action.taxSaving) content += ` | Tax Saving: ${formatINR(action.taxSaving)}`;
        content += '\n';
      });
    }

    if (completedActions.length > 0) {
      content += '\nCOMPLETED:\n';
      completedActions.forEach((action, i) => {
        content += `  ${i + 1}. ${action.title} [${action.section}] - ${formatINR(action.amount)} ✓\n`;
      });
    }
  }

  content += `
================================================================================
DISCLAIMER
----------
This report is generated by MyFinanceOS for informational purposes only.
It does not constitute professional tax advice. Please consult a qualified
Chartered Accountant or tax advisor before filing your returns.

Tax computations are based on FY 2026-27 (AY 2027-28) slabs and rates
including 4% Health & Education Cess. Section 87A rebates applied where
applicable. Rates and rules subject to change by Government of India.

Generated by MyFinanceOS — Premium Local-First Finance Suite for India
https://myfinanceos.com
`;

  return content;
};

export const TaxExportButton: React.FC<TaxExportButtonProps> = ({
  data,
  label = 'Export Tax Report',
  variant = 'primary',
  className = '',
  style,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [exportState, setExportState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    setExportState('generating');
    onExportStart?.();

    try {
      // Generate PDF content
      const content = generatePDFContent(data);

      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      downloadBlob(
        `MyFinanceOS_Tax_Report_${data.financialYear.replace('/', '-')}_${todayStamp()}.txt`,
        blob
      );

      setExportState('success');
      onExportComplete?.();

      // Reset to idle after 2 seconds
      setTimeout(() => setExportState('idle'), 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Export failed');
      setExportState('error');
      onExportError?.(error);

      // Reset to idle after 3 seconds
      setTimeout(() => setExportState('idle'), 3000);
    }
  };

  const isLoading = exportState === 'generating';
  const isSuccess = exportState === 'success';
  const isError = exportState === 'error';

  return (
    <Button
      variant={variant}
      onClick={handleExport}
      disabled={isLoading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        ...style,
      }}
    >
      {isLoading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={16} />
        </motion.span>
      )}
      {!isLoading && !isSuccess && !isError && <Download size={16} />}
      {isSuccess && <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />}
      {isError && <AlertCircle size={16} style={{ color: 'var(--error)' }} />}
      <span>{isLoading ? 'Generating...' : isSuccess ? 'Exported!' : isError ? 'Failed' : label}</span>
    </Button>
  );
};

/**
 * Generates the tax report as a plain-text blob (report content, not a PDF).
 * Exporting as a real PDF would require a PDF renderer dependency — the text
 * report keeps the API honest about what it produces.
 */
export const generateTaxReport = async (data: TaxExportData): Promise<Blob> => {
  const content = generatePDFContent(data);
  return new Blob([content], { type: 'text/plain;charset=utf-8' });
};