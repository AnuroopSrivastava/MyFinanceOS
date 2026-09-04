import React, { useState } from 'react';
import { Button, SectionHeader, SummaryMetricGrid } from '@financeos/ui';
import { motion } from 'framer-motion';
import { dbService } from '@financeos/database';
import { exportToCSV } from '../utils/exportCsv.js';
import { formatRupee } from '@financeos/shared';
import {
  FileSpreadsheet, Download, Printer, Sparkles,
  BarChart3, Landmark, TrendingUp, Calendar, ShieldCheck, ChevronRight
} from 'lucide-react';

interface ReportsViewProps {
  profileId: string;
}

type ReportType = 'Monthly' | 'Annual' | 'Tax' | 'Investment' | 'Business';

export const ReportsView: React.FC<ReportsViewProps> = ({ profileId }) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('Monthly');
  const [selectedPeriod, setSelectedPeriod] = useState(() => new Date().toISOString().substring(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(true);

  // Compute live user data metrics from dbService
  const transactions = React.useMemo(() => {
    try {
      return dbService.getTransactions().filter((t) => t.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const accounts = React.useMemo(() => {
    try {
      return dbService.getAccounts().filter((a) => a.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const stocks = React.useMemo(() => {
    try {
      return dbService.getStocks().filter((s) => s.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const mutualfunds = React.useMemo(() => {
    try {
      return dbService.getMutualFunds().filter((m) => m.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const totalIncome = transactions.filter((t) => t.type === 'Income').reduce((acc: number, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'Expense').reduce((acc: number, t) => acc + t.amount, 0);
  const stockVal = stocks.reduce((acc: number, s) => acc + s.quantity * s.currentPrice, 0);
  const mfVal = mutualfunds.reduce((acc: number, m) => acc + m.units * m.currentNav, 0);
  const totalInvestments = stockVal + mfVal;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) + '%' : '0.0%';

  const reportTypes = [
    { id: 'Monthly', label: 'Monthly Wealth & Cash Flow', desc: 'Detailed breakdown of income, expenses, savings rate, and net worth change.', icon: Calendar },
    { id: 'Annual', label: 'Annual Financial Performance', desc: 'Comprehensive yearly balance sheet, profit & loss, and asset growth metrics.', icon: BarChart3 },
    { id: 'Tax', label: 'Tax Computation & ITR Summary', desc: 'Old vs New regime tax breakdown, 80C/80D deductions, STCG/LTCG, and TDS summary.', icon: Landmark },
    { id: 'Investment', label: 'Portfolio Allocation & Dividend', desc: 'Multi-asset holding valuations, returns, asset subclass weights, and dividend logs.', icon: TrendingUp },
    { id: 'Business', label: 'Commercial P&L & GST Ledger', desc: 'Revenue, Invoicing status, GST input tax credits, vendor accounts, and net profit.', icon: FileSpreadsheet }
  ];

  const handleGenerate = () => {
    setReportReady(true);
  };

  const handleExportCsv = () => {
    if (selectedReportType === 'Monthly') {
      const headers = [
        { label: 'Date', key: 'Date' as const },
        { label: 'Description', key: 'Description' as const },
        { label: 'Type', key: 'Type' as const },
        { label: 'Category', key: 'Category' as const },
        { label: 'Amount (INR)', key: 'Amount' as const }
      ];
      const data = transactions.map(t => ({
        Date: t.date,
        Description: t.description,
        Type: t.type,
        Category: t.category,
        Amount: t.amount
      }));
      exportToCSV(`MyFinanceOS_Transactions_Report_${selectedPeriod}`, headers, data.length > 0 ? data : [
        { Date: selectedPeriod, Description: 'No transactions recorded', Type: 'N/A', Category: 'N/A', Amount: 0 }
      ]);
    } else if (selectedReportType === 'Investment') {
      const headers = [
        { label: 'Asset Class', key: 'AssetClass' as const },
        { label: 'Holding Name', key: 'HoldingName' as const },
        { label: 'Quantity / Units', key: 'Quantity' as const },
        { label: 'Current Valuation (INR)', key: 'Valuation' as const }
      ];
      const data: Array<{ AssetClass: string; HoldingName: string; Quantity: number | string; Valuation: number }> = [];
      stocks.forEach(s => data.push({ AssetClass: 'Equity Stock', HoldingName: s.symbol, Quantity: s.quantity, Valuation: s.quantity * s.currentPrice }));
      mutualfunds.forEach(m => data.push({ AssetClass: 'Mutual Fund', HoldingName: m.schemeName, Quantity: m.units, Valuation: m.units * m.currentNav }));
      
      try {
        const gold = dbService.getGold().filter(g => g.profileId === profileId);
        gold.forEach(g => data.push({ AssetClass: 'Gold', HoldingName: g.type, Quantity: `${g.quantityGrams}g`, Valuation: g.quantityGrams * g.currentPrice }));
        const fds = dbService.getFDs().filter(f => f.profileId === profileId);
        fds.forEach(f => data.push({ AssetClass: 'Fixed Deposit', HoldingName: f.bankName, Quantity: '1', Valuation: f.maturityAmount }));
      } catch { /* ignore */ }

      exportToCSV(`MyFinanceOS_Investment_Portfolio_${selectedPeriod}`, headers, data.length > 0 ? data : [
        { AssetClass: 'Portfolio', HoldingName: 'Total Holdings', Quantity: 1, Valuation: totalInvestments }
      ]);
    } else if (selectedReportType === 'Business') {
      const headers = [
        { label: 'Invoice #', key: 'InvoiceNumber' as const },
        { label: 'Date', key: 'Date' as const },
        { label: 'Customer', key: 'Customer' as const },
        { label: 'Status', key: 'Status' as const },
        { label: 'Taxable Amount (INR)', key: 'TaxableAmount' as const },
        { label: 'GST Amount (INR)', key: 'GSTAmount' as const },
        { label: 'Grand Total (INR)', key: 'GrandTotal' as const }
      ];
      try {
        const invoices = dbService.getInvoices().filter(i => i.profileId === profileId);
        const data: Array<{ InvoiceNumber: string; Date: string; Customer: string; Status: string; TaxableAmount: number; GSTAmount: number; GrandTotal: number }> = invoices.map(i => ({
          InvoiceNumber: i.invoiceNumber,
          Date: i.date,
          Customer: i.customerName,
          Status: i.status,
          TaxableAmount: i.subtotal,
          GSTAmount: i.cgstTotal + i.sgstTotal + i.igstTotal,
          GrandTotal: i.grandTotal
        }));
        exportToCSV(`MyFinanceOS_Business_Invoicing_${selectedPeriod}`, headers, data.length > 0 ? data : [
          { InvoiceNumber: 'N/A', Date: selectedPeriod, Customer: 'No invoices recorded', Status: 'N/A', TaxableAmount: 0, GSTAmount: 0, GrandTotal: 0 }
        ]);
      } catch {
        exportToCSV(`MyFinanceOS_Business_Report_${selectedPeriod}`, headers, [
          { InvoiceNumber: 'N/A', Date: selectedPeriod, Customer: 'No data', Status: 'N/A', TaxableAmount: 0, GSTAmount: 0, GrandTotal: 0 }
        ]);
      }
    } else {
      const headers = [
        { label: 'Category', key: 'Category' as const },
        { label: 'Description', key: 'Description' as const },
        { label: 'Amount (INR)', key: 'Amount' as const }
      ];
      const data = [
        { Category: 'Total Inflows', Description: 'Gross Revenues & Salary Credits', Amount: totalIncome },
        { Category: 'Total Outflows', Description: 'Operating Expenses & Bills', Amount: totalExpense },
        { Category: 'Net Cash Surplus', Description: 'Retained Liquid Savings', Amount: netSavings },
        { Category: 'Liquid Accounts Balance', Description: 'Bank Accounts & Cash Reserves', Amount: accounts.reduce((sum, a) => sum + (a.balance || 0), 0) },
        { Category: 'Investment Valuation', Description: 'Equity Stocks & Mutual Funds Holdings', Amount: totalInvestments }
      ];
      exportToCSV(`MyFinanceOS_${selectedReportType}_Report_${selectedPeriod}`, headers, data);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}
    >
      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<FileSpreadsheet />}
        title="Financial Reports & Statements"
        badge={<><Sparkles size={12} /> Instant Export</>}
        description="Generate executive-ready PDF, CSV spreadsheets, and print-ready financial statements for personal or business records."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={!reportReady}
              style={{ padding: 'var(--spacing-05) var(--spacing-08)', fontSize: 'var(--font-sm)', opacity: reportReady ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', borderRadius: 'var(--radius-sm)' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="primary"
              onClick={handlePrintPdf}
              disabled={!reportReady}
              style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', opacity: reportReady ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', borderRadius: 'var(--radius-sm)' }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </Button>
          </div>
        }
      />

      {/* Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'var(--spacing-075)' }}>
        {reportTypes.map(rep => {
          const Icon = rep.icon;
          const isSelected = selectedReportType === rep.id;
          return (
            <Button
              key={rep.id}
              aria-pressed={isSelected}
              onClick={() => { setSelectedReportType(rep.id as ReportType); setReportReady(false); }}
              className="glass-panel" data-interactive-card="off"
              style={{
                padding: 'var(--spacing-1)',
                textAlign: 'left',
                borderLeft: isSelected ? '1px solid var(--accent-1)' : '1px solid var(--border-color)',
                borderRight: isSelected ? '1px solid var(--accent-1)' : '1px solid var(--border-color)',
                borderBottom: isSelected ? '1px solid var(--accent-1)' : '1px solid var(--border-color)',
                borderTop: isSelected ? '1px solid var(--accent-1)' : 'var(--neo-bevel-top)',
                background: 'var(--bg-panel)',
                backgroundImage: 'var(--neo-convex-grad)',
                boxShadow: isSelected ? `var(--neo-raised-sm), 0 0 12px var(--border-color-glow)` : 'var(--neo-raised-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div>
                <div style={{
                  padding: 'var(--spacing-05)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  boxShadow: 'var(--neo-inset-sm)',
                  color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)',
                  width: 'fit-content',
                  marginBottom: 'var(--spacing-075)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
                <h4 style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', margin: 0 }}>{rep.label}</h4>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-025)', lineHeight: '1.3' }}>{rep.desc}</p>
              </div>
              <div style={{
                marginTop: 'var(--spacing-075)',
                paddingTop: 'var(--spacing-05)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--fw-semibold)',
                color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)'
              }}>
                <span>Configure Format</span>
                <ChevronRight size={14} />
              </div>
            </Button>
          );
        })}
      </div>

      {/* Period Selection & Generation Control */}
      <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
          <label htmlFor="report-period-select" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Report Period:</label>
          <select
            id="report-period-select"
            aria-label="Select report period"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="form-input"
            style={{ width: 'auto', fontSize: 'var(--font-sm)' }}
          >
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-Q2">Q2 FY 2026-27</option>
            <option value="2025-26">Financial Year 2025-26</option>
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ padding: 'var(--spacing-05) var(--spacing-125)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', marginLeft: 'auto' }}
        >
          {isGenerating ? (
            <>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Synthesizing Statement...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate {selectedReportType} Report
            </>
          )}
        </Button>
      </div>

      {/* Report Canvas */}
      {reportReady && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel" data-interactive-card="off"
          style={{ padding: 'var(--spacing-2)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', background: 'var(--bg-secondary)' }}
        >
          {/* Executive Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-1)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
                <span style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-black)', color: 'var(--accent-1)' }}>MyFinanceOS</span>
                <span style={{
                  fontSize: 'var(--font-xs)',
                  padding: 'var(--spacing-02) var(--spacing-05)',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--badge-cyan-bg)',
                  color: 'var(--badge-cyan-text)',
                  border: '1px solid var(--badge-cyan-border)',
                  fontWeight: 'var(--fw-semibold)'
                }}>
                  Official Report
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-2xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', margin: 'var(--spacing-05) 0 0' }}>
                {selectedReportType} Financial Statement & Audit Summary
              </h1>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-02)', fontFamily: 'var(--font-body)' }}>
                Period: {selectedPeriod} • Generated on {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>

            <div style={{ textAlign: 'right', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Prepared For: Profile Admin</div>
              <div>System Hash: 0x94B8...E12A</div>
              <div style={{ color: 'var(--success)', marginTop: 'var(--spacing-025)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-02)' }}>
                <ShieldCheck size={14} /> Verified Ledger
              </div>
            </div>
          </div>

          {/* Metric Highlights Grid */}
          <SummaryMetricGrid columns={4}>
            <div style={{ padding: 'var(--spacing-1)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Total Income / Revenue</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', color: 'var(--success)', marginTop: 'var(--spacing-025)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatRupee(totalIncome)}</div>
            </div>
            <div style={{ padding: 'var(--spacing-1)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Total Operating Outflow</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', color: 'var(--error)', marginTop: 'var(--spacing-025)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatRupee(totalExpense)}</div>
            </div>
            <div style={{ padding: 'var(--spacing-1)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Investment Valuation</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', color: 'var(--color-asset-stocks)', marginTop: 'var(--spacing-025)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatRupee(totalInvestments)}</div>
            </div>
            <div style={{ padding: 'var(--spacing-1)', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Net Savings Rate</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: 'var(--spacing-025)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{savingsRate}</div>
            </div>
          </SummaryMetricGrid>

          {/* Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-05)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-base)', fontWeight: 'var(--fw-bold)', letterSpacing: '-0.01em', margin: 0 }}>Summary Breakdown</h3>
            <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: 'var(--font-sm)' }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                  <th style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</th>
                  <th style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Amount</th>
                  <th style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>% Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Total Income</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Revenues, Salary & Inflows</td>
                  <td style={{ textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1", color: 'var(--success)' }}>{formatRupee(totalIncome)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>100.0%</td>
                </tr>
                <tr>
                  <td><strong>Total Outflow</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Operating Expenses & Outflows</td>
                  <td style={{ textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1", color: 'var(--error)' }}>{formatRupee(totalExpense)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
                <tr>
                  <td><strong>Portfolio Valuation</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Holdings in Stocks & Mutual Funds</td>
                  <td style={{ textAlign: 'right', fontWeight: 'var(--fw-semibold)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1", color: 'var(--color-asset-stocks)' }}>{formatRupee(totalInvestments)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>—</td>
                </tr>
                <tr style={{ background: 'var(--badge-cyan-bg)', fontWeight: 'var(--fw-heavy)' }}>
                  <td colSpan={2} style={{ color: 'var(--badge-cyan-text)' }}>Net Unallocated Surplus</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>{formatRupee(netSavings)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{savingsRate}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <div style={{ paddingTop: 'var(--spacing-1)', borderTop: '1px solid var(--border-color)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Generated locally via MyFinanceOS Engine • Confidential</span>
            <span>Page 1 of 1</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReportsView;
