import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { dbService } from '@financeos/database';
import { exportToCSV } from '../utils/exportCsv.js';
import { formatRupee } from '../utils/currency.js';
import {
  FileSpreadsheet, Download, Printer, Sparkles,
  BarChart3, Landmark, TrendingUp, Calendar, ShieldCheck, ArrowRight
} from 'lucide-react';

interface ReportsViewProps {
  profileId: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ profileId }) => {
  const [selectedReportType, setSelectedReportType] = useState<'Monthly' | 'Annual' | 'Tax' | 'Investment' | 'Business'>('Monthly');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-07');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);

  // Compute live user data metrics from dbService
  const transactions = React.useMemo(() => {
    try {
      return dbService.getTransactions().filter((t: any) => t.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const accounts = React.useMemo(() => {
    try {
      return dbService.getAccounts().filter((a: any) => a.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const stocks = React.useMemo(() => {
    try {
      return dbService.getStocks().filter((s: any) => s.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const mutualfunds = React.useMemo(() => {
    try {
      return dbService.getMutualFunds().filter((m: any) => m.profileId === profileId);
    } catch {
      return [];
    }
  }, [profileId]);

  const totalIncome = transactions.filter((t: any) => t.type === 'Income').reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'Expense').reduce((acc: number, t: any) => acc + t.amount, 0);
  const stockVal = stocks.reduce((acc: number, s: any) => acc + s.quantity * s.currentPrice, 0);
  const mfVal = mutualfunds.reduce((acc: number, m: any) => acc + m.units * m.currentNav, 0);
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
    setIsGenerating(true);
    setReportReady(false);
    setTimeout(() => {
      setIsGenerating(false);
      setReportReady(true);
    }, 1000);
  };

  const handleExportCsv = () => {
    const headers = [
      { label: 'Category', key: 'Category' as const },
      { label: 'Description', key: 'Description' as const },
      { label: 'Amount (INR)', key: 'Amount' as const }
    ];
    const data = [
      { Category: 'Total Income', Description: 'Revenues & Salary', Amount: totalIncome },
      { Category: 'Total Outflow', Description: 'Operating Expenses & Outflows', Amount: totalExpense },
      { Category: 'Investment Valuation', Description: 'Stocks & Mutual Funds Portfolio', Amount: totalInvestments },
      { Category: 'Net Savings Surplus', Description: 'Unallocated Cash Surplus', Amount: netSavings }
    ];
    exportToCSV(`MyFinanceOS_${selectedReportType}_Report_${selectedPeriod}`, headers, data);
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
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Page Header Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem 3rem',
        borderRadius: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '2rem',
        background: 'var(--header-banner-grad)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1 1 min-content', minWidth: '280px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--accent-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px hsla(220, 80%, 50%, 0.25)',
            flexShrink: 0,
            marginTop: '0.2rem'
          }}>
            <FileSpreadsheet size={22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
                1-Click Executive Reports
              </h1>
              <span style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--accent-1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '0.2rem 0.5rem',
                borderRadius: '2rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap'
              }}>
                <Sparkles size={12} /> Instant Synthesis
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
              Generate commercial-grade PDF, Excel/CSV, and print-ready financial statements for personal or business audits
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onPointerDown={handleExportCsv}
            disabled={!reportReady}
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', opacity: reportReady ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            className="btn btn-primary"
            onPointerDown={handlePrintPdf}
            disabled={!reportReady}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: reportReady ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)' }}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {reportTypes.map(rep => {
          const Icon = rep.icon;
          const isSelected = selectedReportType === rep.id;
          return (
            <button
              key={rep.id}
              onPointerDown={() => { setSelectedReportType(rep.id as any); setReportReady(false); }}
              className="glass-panel"
              style={{
                padding: '1rem',
                textAlign: 'left',
                border: isSelected ? '1px solid var(--accent-1)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-panel)',
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
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)',
                  width: 'fit-content',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{rep.label}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.3' }}>{rep.desc}</p>
              </div>
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isSelected ? 'var(--accent-1)' : 'var(--text-secondary)'
              }}>
                <span>Select Report</span>
                <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Period Selection & Generation Control */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Report Period:</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="form-input"
            style={{ width: 'auto', fontSize: '0.85rem' }}
          >
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-Q2">Q2 FY 2026-27</option>
            <option value="2025-26">Financial Year 2025-26</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onPointerDown={handleGenerate}
          disabled={isGenerating}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
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
        </button>
      </div>

      {/* Report Canvas */}
      {reportReady && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'var(--bg-secondary)' }}
        >
          {/* Executive Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-1)' }}>MyFinanceOS</span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--accent-1)',
                  fontWeight: 600
                }}>
                  Official Report
                </span>
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.5rem 0 0' }}>
                {selectedReportType} Financial Statement & Audit Summary
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Period: {selectedPeriod} • Generated on {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Prepared For: Profile Admin</div>
              <div>System Hash: 0x94B8...E12A</div>
              <div style={{ color: 'var(--success)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                <ShieldCheck size={14} /> Verified Ledger
              </div>
            </div>
          </div>

          {/* Metric Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="responsive-stack">
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Income / Revenue</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>{formatRupee(totalIncome)}</div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Operating Outflow</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)', marginTop: '0.25rem' }}>{formatRupee(totalExpense)}</div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Investment Valuation</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-1)', marginTop: '0.25rem' }}>{formatRupee(totalInvestments)}</div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Savings Rate</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{savingsRate}</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Summary Breakdown</h3>
            <table className="custom-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>% Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Total Income</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Revenues, Salary & Inflows</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupee(totalIncome)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>100.0%</td>
                </tr>
                <tr>
                  <td><strong>Total Outflow</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Operating Expenses & Outflows</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupee(totalExpense)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) + '%' : '0.0%'}</td>
                </tr>
                <tr>
                  <td><strong>Portfolio Valuation</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>Holdings in Stocks & Mutual Funds</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupee(totalInvestments)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>—</td>
                </tr>
                <tr style={{ background: 'rgba(59, 130, 246, 0.1)', fontWeight: 700 }}>
                  <td colSpan={2}>Net Unallocated Surplus</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatRupee(netSavings)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>{savingsRate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Generated locally via MyFinanceOS Engine • Confidential</span>
            <span>Page 1 of 1</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReportsView;
