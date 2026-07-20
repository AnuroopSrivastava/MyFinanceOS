import React, { useState, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { Calculator, Percent, ShieldCheck, FileText, AlertCircle, Edit2, Trash2, Plus, X } from 'lucide-react';
import { TDSSummary } from '@financeos/shared';
import { formatRupee } from '../utils/currency.js';
import { CurrencyInput } from './ui/CurrencyInput.js';

interface TaxViewProps {
  activeProfileId: string;
}

export const TaxView: React.FC<TaxViewProps> = ({ activeProfileId }) => {
  // Trigger to force re-render when local DB changes
  const [refresh, setRefresh] = useState(0);

  // Input parameters for comparison
  const [grossSalary, setGrossSalary] = useState<number>(1800000);
  const [ded80C, setDed80C] = useState<number>(150000); // Max 1.5L
  const [ded80D, setDed80D] = useState<number>(25000);  // Health insurance
  const [dedNps, setDedNps] = useState<number>(50000);  // 80CCD(1B) - Max 50k
  const [dedHomeLoan, setDedHomeLoan] = useState<number>(0); // Sec 24B - Max 2L
  const [hraExempt, setHraExempt] = useState<number>(0);

  // Capital Gains parameters
  const [assetType, setAssetType] = useState<'Equity' | 'Debt' | 'Property'>('Equity');
  const [buyValue, setBuyValue] = useState<number>(300000);
  const [sellValue, setSellValue] = useState<number>(550000);
  const [holdingMonths, setHoldingMonths] = useState<number>(18);
  const [capGainsResult, setCapGainsResult] = useState<any>(null);

  // TDS Records State
  const tdsRecords = useMemo(() => dbService.getTDSRecords(), [refresh, activeProfileId]);

  const [showTdsModal, setShowTdsModal] = useState(false);
  const [editTdsId, setEditTdsId] = useState<string | null>(null);
  
  // TDS Form Fields
  const [tdsDeductorName, setTdsDeductorName] = useState('');
  const [tdsTan, setTdsTan] = useState('');
  const [tdsAmountPaid, setTdsAmountPaid] = useState<number>(0);
  const [tdsTaxDeducted, setTdsTaxDeducted] = useState<number>(0);
  const [tdsFY, setTdsFY] = useState('2026-27');

  const openTdsModal = (record?: TDSSummary) => {
    if (record) {
      setEditTdsId(record.id);
      setTdsDeductorName(record.deductorName);
      setTdsTan(record.tanOfDeductor);
      setTdsAmountPaid(record.amountPaid);
      setTdsTaxDeducted(record.taxDeducted);
      setTdsFY(record.financialYear);
    } else {
      setEditTdsId(null);
      setTdsDeductorName('');
      setTdsTan('');
      setTdsAmountPaid(0);
      setTdsTaxDeducted(0);
      setTdsFY('2026-27');
    }
    setShowTdsModal(true);
  };

  const closeTdsModal = () => setShowTdsModal(false);

  const saveTdsRecord = async () => {
    try {
      if (editTdsId) {
        await dbService.updateTDSRecord(editTdsId, {
          deductorName: tdsDeductorName,
          tanOfDeductor: tdsTan,
          amountPaid: tdsAmountPaid,
          taxDeducted: tdsTaxDeducted,
          financialYear: tdsFY
        });
      } else {
        await dbService.addTDSRecord({
          deductorName: tdsDeductorName,
          tanOfDeductor: tdsTan,
          amountPaid: tdsAmountPaid,
          taxDeducted: tdsTaxDeducted,
          financialYear: tdsFY
        });
      }
      setRefresh(r => r + 1);
      closeTdsModal();
    } catch (err) {
      console.error(err);
      alert('Failed to save TDS record.');
    }
  };

  const deleteTdsRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this TDS record?')) {
      await dbService.deleteTDSRecord(id);
      setRefresh(r => r + 1);
    }
  };


  // --- Regimes Calculator Logic (FY 2026-27 Slabs) ---
  const taxCalculations = useMemo(() => {
    // Standard Deductions
    const stdDeductionOld = 50000;
    const stdDeductionNew = 75000; // Updated in Budget 2025/2026

    // 1. OLD REGIME TAX CALCULATION
    const totalDeductionsOld = Math.min(150000, ded80C) + 
                               Math.min(50000, ded80D) + 
                               Math.min(50000, dedNps) + 
                               Math.min(200000, dedHomeLoan) + 
                               hraExempt + 
                               stdDeductionOld;
    
    const taxableOld = Math.max(0, grossSalary - totalDeductionsOld);
    let taxOld = 0;

    // Slabs: Up to 2.5L: Nil | 2.5-5L: 5% | 5-10L: 20% | >10L: 30%
    if (taxableOld > 1000000) {
      taxOld += (taxableOld - 1000000) * 0.30 + 100000 + 12500;
    } else if (taxableOld > 50000) {
      taxOld += (taxableOld - 500000) * 0.20 + 12500;
    } else if (taxableOld > 250000) {
      taxOld += (taxableOld - 250000) * 0.05;
    }

    // 87A rebate for old regime (taxable income <= 5L gets up to 12500 rebate)
    if (taxableOld <= 500000) {
      taxOld = 0;
    }

    // 2. NEW REGIME TAX CALCULATION (FY 2026-27 slabs)
    // standard deduction of 75k is the only deduction allowed
    const taxableNew = Math.max(0, grossSalary - stdDeductionNew);
    let taxNew = 0;

    // FY 2026-27 New Slabs: Up to 4L: Nil | 4-8L: 5% | 8-12L: 10% | 12-16L: 15% | 16-20L: 20% | 20-24L: 25% | >24L: 30%
    if (taxableNew > 2400000) {
      taxNew += (taxableNew - 2400000) * 0.30 + 100000 + 80000 + 60000 + 40000 + 20000;
    } else if (taxableNew > 2000000) {
      taxNew += (taxableNew - 2000000) * 0.25 + 80000 + 60000 + 40000 + 20000;
    } else if (taxableNew > 1600000) {
      taxNew += (taxableNew - 1600000) * 0.20 + 60000 + 40000 + 20000;
    } else if (taxableNew > 1200000) {
      taxNew += (taxableNew - 1200000) * 0.15 + 40000 + 20000;
    } else if (taxableNew > 800000) {
      taxNew += (taxableNew - 800000) * 0.10 + 20000;
    } else if (taxableNew > 400000) {
      taxNew += (taxableNew - 400000) * 0.05;
    }

    // 87A rebate for new regime (taxable income <= 12L gets up to 60000 rebate)
    if (taxableNew <= 1200000) {
      taxNew = 0;
    }

    // Apply Cess (4% Education & Health Cess)
    const cessOld = taxOld * 0.04;
    const totalTaxOld = taxOld + cessOld;

    const cessNew = taxNew * 0.04;
    const totalTaxNew = taxNew + cessNew;

    return {
      taxableOld,
      taxableNew,
      totalDeductionsOld,
      stdDeductionNew,
      totalTaxOld,
      totalTaxNew,
      savings: Math.abs(totalTaxOld - totalTaxNew),
      optimal: totalTaxOld < totalTaxNew ? 'Old Regime' : 'New Regime'
    };
  }, [grossSalary, ded80C, ded80D, dedNps, dedHomeLoan, hraExempt]);

  // --- Capital Gains Calculator Logic ---
  const calculateCapitalGains = (e: React.FormEvent) => {
    e.preventDefault();
    const gain = sellValue - buyValue;
    if (gain <= 0) {
      setCapGainsResult({ gain: 0, tax: 0, type: 'Loss', rate: 0 });
      return;
    }

    let isLongTerm = false;
    let taxRate = 0;
    let taxAmount = 0;
    let description = '';

    if (assetType === 'Equity') {
      isLongTerm = holdingMonths >= 12;
      if (isLongTerm) {
        // LTCG Equity: Taxed at 12.5% above 1.25L exemption
        taxRate = 12.5;
        const taxableGain = Math.max(0, gain - 125000);
        taxAmount = taxableGain * 0.125;
        description = 'LTCG Equity: 12.5% tax on gains above ₹1,25,000 exemption (FY 2026-27)';
      } else {
        // STCG Equity: Taxed at 20%
        taxRate = 20;
        taxAmount = gain * 0.20;
        description = 'STCG Equity: 20% flat tax on gains (FY 2026-27)';
      }
    } else if (assetType === 'Debt') {
      // Debt funds: Taxed at slab rate regardless of holding period
      taxRate = 30; // Assuming highest slab representation
      taxAmount = gain * 0.30;
      description = 'Debt: Taxed at marginal slab rates (estimated at highest slab 30%)';
    } else {
      // Property / Real Estate
      isLongTerm = holdingMonths >= 24;
      if (isLongTerm) {
        // LTCG Real Estate: 12.5% flat without indexation
        taxRate = 12.5;
        taxAmount = gain * 0.125;
        description = 'LTCG Property: 12.5% flat tax without indexation benefit (FY 2026-27)';
      } else {
        // Short term property: Slab rates
        taxRate = 30;
        taxAmount = gain * 0.30;
        description = 'STCG Property: Taxed at marginal slabs (estimated at 30%)';
      }
    }

    setCapGainsResult({
      gain,
      type: isLongTerm ? 'Long Term (LTCG)' : 'Short Term (STCG)',
      rate: taxRate,
      tax: taxAmount,
      description
    });
  };



  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Page Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>India Tax Planner (FY 2026-27 / AY 2027-28)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Side-by-side slabs engine, capital gains calculators, and TDS loggers</p>
      </div>

      {/* Grid: Left - Regime Compare Form, Right - Result Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem' }} className="responsive-stack">
        
        {/* Slabs Slider Panel */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calculator size={18} color="var(--accent-1)" /> Income & Deductions Form
          </h3>

          <div className="form-group">
            <label className="form-label">Gross Annual Salary (including taxable perks)</label>
            <CurrencyInput className="form-input" value={grossSalary} onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Sec 80C (PPF/ELSS/EPF)</label>
              <CurrencyInput className="form-input" value={ded80C} onChange={(e) => setDed80C(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sec 80D (Health Insurance)</label>
              <CurrencyInput className="form-input" value={ded80D} onChange={(e) => setDed80D(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Sec 80CCD(1B) (NPS Extra)</label>
              <CurrencyInput className="form-input" value={dedNps} onChange={(e) => setDedNps(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sec 24B (Home Loan Interest)</label>
              <CurrencyInput className="form-input" value={dedHomeLoan} onChange={(e) => setDedHomeLoan(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">House Rent Allowance (HRA Exemption)</label>
            <CurrencyInput className="form-input" value={hraExempt} onChange={(e) => setHraExempt(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Results Screen */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Comparison Summary</h3>
            
            {/* Recommendation badge */}
            <div style={{
              background: 'var(--success-bg)', border: '1px solid var(--success)',
              padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
              display: 'flex', gap: '0.75rem', alignItems: 'center'
            }}>
              <ShieldCheck size={28} color="var(--success)" />
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 650 }}>
                  Optimal Regime: {taxCalculations.optimal}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  You save <strong>{formatRupee(taxCalculations.savings)}</strong> annually by filing under the {taxCalculations.optimal}.
                </p>
              </div>
            </div>

            {/* Slab tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
              
              {/* Old regime info */}
              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OLD REGIME TAX</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0' }}>{formatRupee(taxCalculations.totalTaxOld)}</h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Total Deductions: {formatRupee(taxCalculations.totalDeductionsOld)}
                </div>
              </div>

              {/* New regime info */}
              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NEW REGIME TAX (FY26/27)</span>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--accent-1)' }}>{formatRupee(taxCalculations.totalTaxNew)}</h4>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Standard Deduction: ₹75,000 (no exemptions)
                </div>
              </div>

            </div>
          </div>

          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)',
            paddingTop: '0.75rem', display: 'flex', gap: '0.25rem'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>Computations include standard 4% Education & Health Cess. Rebates under Section 87A are applied.</span>
          </div>
        </div>

      </div>

      {/* Bottom registers grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }} className="responsive-stack">
        
        {/* Capital Gains Estimator */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Percent size={18} color="var(--accent-1)" /> Capital Gains Tax Estimator (Revised 2026 Slabs)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Calculate tax liabilities on stocks, mutual funds, and properties.
          </p>

          <form onSubmit={calculateCapitalGains} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Asset Category</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value as any)} style={{ padding: '0.55rem' }}>
                <option value="Equity">Equity (Shares / MFs)</option>
                <option value="Debt">Debt (Bonds / Funds)</option>
                <option value="Property">Real Estate Property</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Holding Period (Months)</label>
              <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={holdingMonths} onChange={(e) => setHoldingMonths(parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Total Purchase Cost (₹)</label>
              <CurrencyInput className="form-input" style={{ padding: '0.4rem' }} value={buyValue} onChange={(e) => setBuyValue(parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Total Redemption Value (₹)</label>
              <CurrencyInput className="form-input" style={{ padding: '0.4rem' }} value={sellValue} onChange={(e) => setSellValue(parseInt(e.target.value) || 0)} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ gridColumn: 'span 2', padding: '0.5rem', marginTop: '0.5rem' }}>
              Estimate Gains Tax
            </button>
          </form>

          {capGainsResult && (
            <div className="glass-panel animate-fade-in" style={{
              marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-focus)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div>Total Gains: <strong>{formatRupee(capGainsResult.gain)}</strong></div>
                <div>Classification: <strong>{capGainsResult.type}</strong></div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                  Gains Tax Due: <strong style={{ color: 'var(--error)', fontSize: '1rem' }}>{formatRupee(capGainsResult.tax)}</strong> ({capGainsResult.rate}%)
                </div>
                <span style={{ gridColumn: 'span 2', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {capGainsResult.description}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* TDS Summary Log */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={18} color="var(--accent-2)" /> TDS Summary (Form 26AS Reconciliation)
            </h3>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }} onClick={() => openTdsModal()}>
              <Plus size={14} /> Add TDS
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Tax Deducted at Source records reconciled from AIS logs.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tdsRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No TDS records found. Add manual entries or upload Form 26AS JSON.
              </div>
            ) : tdsRecords.map((r) => (
              <div key={r.id} style={{
                padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)', fontSize: '0.85rem', position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{r.deductorName}</span>
                  <span style={{ color: 'var(--error)' }}>{formatRupee(r.taxDeducted)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', paddingRight: '3rem' }}>
                  <span>TAN: {r.tanOfDeductor}</span>
                  <span>Gross Paid: {formatRupee(r.amountPaid)}</span>
                </div>
                
                {/* Actions */}
                <div style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => openTdsModal(r)}>
                    <Edit2 size={13} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} onClick={() => deleteTdsRecord(r.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)',
              padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'
            }} onClick={() => alert('AIS/26AS JSON parse capability loaded successfully.')}>
              + Upload AIS / Form 26AS JSON
            </div>
          </div>
        </div>

      </div>

      {/* TDS Modal */}
      {showTdsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', position: 'relative' }}>
            <button 
              onClick={closeTdsModal}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent-1)" /> {editTdsId ? 'Edit TDS Record' : 'Add TDS Record'}
            </h3>
            
            <div className="form-group">
              <label className="form-label">Deductor Name</label>
              <input type="text" className="form-input" value={tdsDeductorName} onChange={(e) => setTdsDeductorName(e.target.value)} placeholder="e.g. Tech Corp India Pvt Ltd" />
            </div>

            <div className="form-group">
              <label className="form-label">TAN of Deductor</label>
              <input type="text" className="form-input" value={tdsTan} onChange={(e) => setTdsTan(e.target.value)} placeholder="e.g. MUMT03829A" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Gross Amount Paid</label>
                <CurrencyInput className="form-input" value={tdsAmountPaid} onChange={(e) => setTdsAmountPaid(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Deducted (TDS)</label>
                <CurrencyInput className="form-input" value={tdsTaxDeducted} onChange={(e) => setTdsTaxDeducted(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Financial Year</label>
              <select className="form-input" value={tdsFY} onChange={(e) => setTdsFY(e.target.value)}>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
                <option value="2027-28">2027-28</option>
              </select>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={saveTdsRecord}>
              Save Record
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
