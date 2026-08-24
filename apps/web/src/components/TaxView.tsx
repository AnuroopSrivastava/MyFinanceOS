import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '@financeos/database';
import { useDbVersion } from '../hooks/useDbSync.js';
import { Calculator, Percent, FileText, AlertCircle, Edit2, Trash2, Plus, X, Download, Calendar, Clock, Target, TrendingUp, Shield, Wallet } from 'lucide-react';
import { TDSSummary } from '@financeos/shared';
import { formatRupee } from '@financeos/shared';
import { calculateTaxOldRegime, calculateTaxNewRegime } from '../utils/financialCalculations.js';
import { exportToCSV } from '../utils/exportCsv.js';
import { ConfirmModal, useConfirmModal } from './ConfirmModal.js';
import {
  Button,
  IconButton, FormField, TaxRegimeToggle,
  DeductionCard,
  OptimizationActionList,
  TaxExportButton,
  CurrencyInput,
  Modal,
  FileDropzone,
  FormRow,
  FormActions,
  type TaxRegime,
  type OptimizationAction,
} from '@financeos/ui';

interface TaxViewProps {
  activeProfileId: string;
}

interface CapGainsResult {
  gain: number;
  type: 'Long Term (LTCG)' | 'Short Term (STCG)' | 'Loss';
  rate: number;
  tax: number;
  description?: string;
}

interface DeductionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  value: number;
  setValue: (v: number) => void;
  maxLimit: number;
  description: string;
  formula: string;
  source?: string;
  helpUrl?: string;
  enabled: boolean;
}

export const TaxView: React.FC<TaxViewProps> = ({ activeProfileId }) => {
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();

  const [refresh, setRefresh] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const dbVersion = useDbVersion();

  // Input parameters for comparison
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [ded80C, setDed80C] = useState<number>(0);
  const [ded80D, setDed80D] = useState<number>(0);
  const [dedNps, setDedNps] = useState<number>(0);
  const [dedHomeLoan, setDedHomeLoan] = useState<number>(0);
  const [hraExempt, setHraExempt] = useState<number>(0);

  // Capital Gains parameters
  const [assetType, setAssetType] = useState<'Equity' | 'Debt' | 'Property'>('Equity');
  const [buyValue, setBuyValue] = useState<number>(0);
  const [sellValue, setSellValue] = useState<number>(0);
  const [holdingMonths, setHoldingMonths] = useState<number>(0);
  const [capGainsResult, setCapGainsResult] = useState<CapGainsResult | null>(null);

  // Regime selection
  const [selectedRegime, setSelectedRegime] = useState<TaxRegime>('old');

  // Expanded deduction cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // TDS Modal state
  const [showTdsModal, setShowTdsModal] = useState(false);
  const [editTdsId, setEditTdsId] = useState<string | null>(null);
  const [tdsDeductorName, setTdsDeductorName] = useState('');
  const [tdsTan, setTdsTan] = useState('');
  const [tdsAmountPaid, setTdsAmountPaid] = useState<number>(0);
  const [tdsTaxDeducted, setTdsTaxDeducted] = useState<number>(0);
  const [tdsFY, setTdsFY] = useState('2026-27');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved Tax Inputs on activeProfileId change
  useEffect(() => {
    try {
      const saved = dbService.getTaxInputs?.(activeProfileId);
      if (saved) {
        setGrossSalary(saved.grossSalary || 0);
        setDed80C(saved.ded80C || 0);
        setDed80D(saved.ded80D || 0);
        setDedNps(saved.dedNps || 0);
        setDedHomeLoan(saved.dedHomeLoan || 0);
        setHraExempt(saved.hraExempt || 0);
        setAssetType(saved.assetType || 'Equity');
        setBuyValue(saved.buyValue !== undefined ? saved.buyValue : 0);
        setSellValue(saved.sellValue !== undefined ? saved.sellValue : 0);
        setHoldingMonths(saved.holdingMonths !== undefined ? saved.holdingMonths : 0);
      } else {
        // Infer from profile transactions & holdings if available, else reset to 0
        const profileTxs = dbService.getTransactions().filter(t => t.profileId === activeProfileId);
        const incomeTxs = profileTxs.filter(t => t.type === 'Income');
        const inferredIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

        const profileMfs = dbService.getMutualFunds().filter(m => m.profileId === activeProfileId);
        const elssInvested = profileMfs
          .filter(m => m.schemeName?.toUpperCase().includes('ELSS') || m.schemeName?.toUpperCase().includes('TAX SAVER'))
          .reduce((sum, m) => sum + (m.units * m.averageNav), 0);

        setGrossSalary(inferredIncome);
        setDed80C(Math.min(150000, Math.round(elssInvested)));
        setDed80D(0);
        setDedNps(0);
        setDedHomeLoan(0);
        setHraExempt(0);
        setAssetType('Equity');
        setBuyValue(0);
        setSellValue(0);
        setHoldingMonths(0);
      }
      setCapGainsResult(null);
    } catch (e) {
      console.error('Failed to load saved tax inputs', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProfileId, dbVersion]);

  // Auto-Save Tax Inputs on change
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      dbService.updateTaxInputs(activeProfileId, {
        grossSalary,
        ded80C,
        ded80D,
        dedNps,
        dedHomeLoan,
        hraExempt,
        assetType,
        buyValue,
        sellValue,
        holdingMonths
      }).catch(console.error);
    }, 150);
    return () => clearTimeout(timer);
  }, [grossSalary, ded80C, ded80D, dedNps, dedHomeLoan, hraExempt, assetType, buyValue, sellValue, holdingMonths, activeProfileId, isLoaded]);

  const tdsRecords = useMemo(() => dbService.getTDSRecords().filter(r => r.profileId === activeProfileId), [refresh, activeProfileId, dbVersion]);
  const totalTdsDeducted = useMemo(() => tdsRecords.reduce((sum, record) => sum + record.taxDeducted, 0), [tdsRecords]);

  // --- Regimes Calculator Logic (FY 2026-27 Slabs) ---
  const taxCalculations = useMemo(() => {
    const stdDeductionOld = 50000;
    const stdDeductionNew = 75000;

    const totalDeductionsOld = Math.min(150000, ded80C) +
      Math.min(50000, ded80D) +
      Math.min(50000, dedNps) +
      Math.min(200000, dedHomeLoan) +
      hraExempt +
      stdDeductionOld;

    const taxableOld = Math.max(0, grossSalary - totalDeductionsOld);

    const oldRegime = calculateTaxOldRegime(taxableOld);
    const newRegime = calculateTaxNewRegime(grossSalary);

    const optimal: TaxRegime = oldRegime.totalTax < newRegime.totalTax ? 'old' : 'new';
    const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

    // Auto-select optimal regime if user hasn't explicitly chosen
    // (We track this via a ref or could use a separate state)
    
    return {
      taxableOld,
      taxableNew: newRegime.taxableIncome,
      totalDeductionsOld,
      stdDeductionNew,
      totalTaxOld: oldRegime.totalTax,
      totalTaxNew: newRegime.totalTax,
      savings,
      optimal,
      oldRegimeBreakdown: oldRegime,
      newRegimeBreakdown: newRegime,
    };
  }, [grossSalary, ded80C, ded80D, dedNps, dedHomeLoan, hraExempt]);

  // Auto-select optimal regime on first load or when calculations change significantly
  useEffect(() => {
    if (taxCalculations.optimal === 'old' && selectedRegime === 'new') {
      // Only auto-switch if the difference is significant (>₹1000)
      if (taxCalculations.savings > 1000) {
        setSelectedRegime('old');
      }
    } else if (taxCalculations.optimal === 'new' && selectedRegime === 'old') {
      if (taxCalculations.savings > 1000) {
        setSelectedRegime('new');
      }
    }
  }, [taxCalculations.optimal, taxCalculations.savings]);

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
        taxRate = 12.5;
        const taxableGain = Math.max(0, gain - 125000);
        taxAmount = taxableGain * 0.125;
        description = 'LTCG Equity: 12.5% tax on gains above ₹1,25,000 exemption (FY 2026-27)';
      } else {
        taxRate = 20;
        taxAmount = gain * 0.20;
        description = 'STCG Equity: 20% flat tax on gains (FY 2026-27)';
      }
    } else if (assetType === 'Debt') {
      taxRate = 30;
      taxAmount = gain * 0.30;
      description = 'Debt: Taxed at marginal slab rates (estimated at highest slab 30%)';
    } else {
      isLongTerm = holdingMonths >= 24;
      if (isLongTerm) {
        taxRate = 12.5;
        taxAmount = gain * 0.125;
        description = 'LTCG Property: 12.5% flat tax without indexation benefit (FY 2026-27)';
      } else {
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

  // Total TDS already deducted
  const optimalTaxAmount = taxCalculations.optimal === 'old' ? taxCalculations.totalTaxOld : taxCalculations.totalTaxNew;
  const selectedTaxAmount = selectedRegime === 'old' ? taxCalculations.totalTaxOld : taxCalculations.totalTaxNew;
  const netAdvanceTaxLiability = Math.max(0, selectedTaxAmount - totalTdsDeducted);

  // Deduction sections configuration
  const deductionSections: DeductionSection[] = useMemo(() => [
    {
      id: '80c',
      title: 'Section 80C',
      icon: <Shield size={18} />,
      value: ded80C,
      setValue: setDed80C,
      maxLimit: 150000,
      description: 'PPF, ELSS, EPF, LIC, NSC, Tuition fees, Home loan principal',
      formula: 'Max ₹1.5L across all 80C instruments. Includes EPF (employer + employee), PPF, ELSS, NSC, life insurance premiums, 5-year FD, home loan principal repayment, children tuition fees.',
      source: 'From Investments',
      helpUrl: 'https://www.incometaxindia.gov.in/Pages/acts/section-80c.aspx',
      enabled: true,
    },
    {
      id: '80d',
      title: 'Section 80D',
      icon: <Shield size={18} />,
      value: ded80D,
      setValue: setDed80D,
      maxLimit: 50000,
      description: 'Health insurance premium (Self, Family, Parents)',
      formula: 'Self + Family: ₹25k (₹50k if senior). Parents: ₹25k (₹50k if senior). Preventive health checkup: ₹5k within limit. Max ₹1L if both taxpayer and parents are seniors.',
      source: 'From Insurance',
      helpUrl: 'https://www.incometaxindia.gov.in/Pages/acts/section-80d.aspx',
      enabled: true,
    },
    {
      id: '80ccd1b',
      title: 'Section 80CCD(1B)',
      icon: <Target size={18} />,
      value: dedNps,
      setValue: setDedNps,
      maxLimit: 50000,
      description: 'Additional NPS contribution (over 80C limit)',
      formula: 'Additional ₹50k deduction for NPS Tier I contribution over and above ₹1.5L 80C limit. Only for Tier I (non-withdrawable). Tier II not eligible.',
      helpUrl: 'https://www.incometaxindia.gov.in/Pages/acts/section-80ccd.aspx',
      enabled: true,
    },
    {
      id: '24b',
      title: 'Section 24(b)',
      icon: <Wallet size={18} />,
      value: dedHomeLoan,
      setValue: setDedHomeLoan,
      maxLimit: 200000,
      description: 'Home loan interest on self-occupied property',
      formula: 'Max ₹2L interest on home loan for self-occupied property. For let-out property: no limit (actual interest). Pre-construction interest deductible in 5 equal installments from year of completion.',
      helpUrl: 'https://www.incometaxindia.gov.in/Pages/acts/section-24.aspx',
      enabled: true,
    },
    {
      id: 'hra',
      title: 'HRA Exemption',
      icon: <TrendingUp size={18} />,
      value: hraExempt,
      setValue: setHraExempt,
      maxLimit: 999999999,
      description: 'House Rent Allowance exemption calculation',
      formula: 'Min of: (1) Actual HRA received, (2) 50% of salary (metro) / 40% (non-metro), (3) Rent paid - 10% of salary. Requires rent receipts & landlord PAN if rent > ₹1L/yr.',
      helpUrl: 'https://www.incometaxindia.gov.in/Pages/acts/section-10-13A.aspx',
      enabled: true,
    },
  ], [ded80C, ded80D, dedNps, dedHomeLoan, hraExempt]);

  // Build optimization actions
  const optimizationActions = useMemo((): OptimizationAction[] => {
    const actions: OptimizationAction[] = [];

    // If profile has no income and no capital gains, no optimization actions should be displayed.
    // Optimization actions are tax-saving recommendations which only apply when there is taxable income/salary to save tax on.
    if (grossSalary <= 0 && (!capGainsResult || capGainsResult.tax <= 0) && netAdvanceTaxLiability <= 0) {
      return actions;
    }

    // Only recommend tax deductions if user has a positive tax liability under Old Regime to save on
    if (grossSalary > 0 && taxCalculations.totalTaxOld > 0) {
      // 80C gap
      const gap80C = Math.min(150000 - ded80C, taxCalculations.taxableOld);
      if (gap80C > 1000) {
        const potentialSaving = Math.min(Math.round(gap80C * 0.312), taxCalculations.totalTaxOld);
        if (potentialSaving > 0) {
          actions.push({
            id: 'action-80c',
            title: 'Invest in ELSS / PPF to max 80C',
            description: `You have ₹${(150000 - ded80C).toLocaleString('en-IN')} remaining in your 80C limit. Invest in ELSS (3-yr lock-in) or PPF (15-yr) to claim full deduction.`,
            amount: 150000 - ded80C,
            section: '80C',
            priority: 'high',
            category: 'investment',
            deadline: '2027-03-31',
            deepLink: '/investments',
            deepLinkLabel: 'Open Investments',
            taxSaving: potentialSaving,
            formula: 'Tax saving = Gap × Marginal tax rate (including cess). At 30% slab + 4% cess = 31.2%.',
          });
        }
      }

      // 80D gap (assuming self+family, non-senior)
      const max80D = 25000;
      const gap80D = Math.min(max80D - ded80D, taxCalculations.taxableOld);
      if (gap80D > 1000) {
        const potentialSaving = Math.min(Math.round(gap80D * 0.312), taxCalculations.totalTaxOld);
        if (potentialSaving > 0) {
          actions.push({
            id: 'action-80d',
            title: 'Buy health insurance to max 80D',
            description: `Health insurance premium gap of ₹${(max80D - ded80D).toLocaleString('en-IN')}. Covers self, spouse, dependent children. Parents additional ₹25k/₹50k.`,
            amount: max80D - ded80D,
            section: '80D',
            priority: 'high',
            category: 'insurance',
            deadline: '2027-03-31',
            deepLink: '/insurance',
            deepLinkLabel: 'View Insurance',
            taxSaving: potentialSaving,
            formula: 'Tax saving = Premium paid × Marginal tax rate. Max ₹25k (₹50k if senior) for self+family.',
          });
        }
      }

      // NPS 80CCD(1B) gap
      const gapNps = Math.min(50000 - dedNps, taxCalculations.taxableOld);
      if (gapNps > 1000) {
        const potentialSaving = Math.min(Math.round(gapNps * 0.312), taxCalculations.totalTaxOld);
        if (potentialSaving > 0) {
          actions.push({
            id: 'action-nps',
            title: 'Contribute to NPS Tier I for extra ₹50k',
            description: `Additional NPS deduction of ₹${(50000 - dedNps).toLocaleString('en-IN')} available. Only Tier I contributions qualify. Lock-in till age 60.`,
            amount: 50000 - dedNps,
            section: '80CCD(1B)',
            priority: 'medium',
            category: 'investment',
            deadline: '2027-03-31',
            deepLink: '/investments',
            deepLinkLabel: 'Open NPS',
            taxSaving: potentialSaving,
            formula: 'Tax saving = Contribution × Marginal rate. Pure tax deferral - corpus taxed at withdrawal (60% taxable).',
          });
        }
      }

      // Home loan interest gap
      if (dedHomeLoan > 0 && dedHomeLoan < 200000) {
        const gapHL = Math.min(200000 - dedHomeLoan, taxCalculations.taxableOld);
        if (gapHL > 1000) {
          const potentialSaving = Math.min(Math.round(gapHL * 0.312), taxCalculations.totalTaxOld);
          actions.push({
            id: 'action-hl',
            title: 'Claim full home loan interest (Sec 24b)',
            description: `₹${(200000 - dedHomeLoan).toLocaleString('en-IN')} interest deduction remaining. Ensure you have interest certificate from bank. Pre-construction interest claimable in 5 installments.`,
            amount: 200000 - dedHomeLoan,
            section: '24(b)',
            priority: 'medium',
            category: 'deduction',
            deadline: '2027-03-31',
            taxSaving: potentialSaving > 0 ? potentialSaving : undefined,
            formula: 'Tax saving = Interest paid × Marginal rate. Max ₹2L for self-occupied. No limit for let-out property.',
          });
        }
      }
    }

    // Regime switch suggestion
    if (grossSalary > 0 && selectedRegime !== taxCalculations.optimal && taxCalculations.savings > 1000) {
      actions.push({
        id: 'action-regime',
        title: `Switch to ${taxCalculations.optimal === 'old' ? 'Old' : 'New'} Regime`,
        description: `You save ${formatRupee(taxCalculations.savings)} by filing under ${taxCalculations.optimal === 'old' ? 'Old' : 'New'} Regime. ${taxCalculations.optimal === 'old' ? 'Requires maintaining deductions.' : 'Simpler - only ₹75k standard deduction.'}`,
        amount: taxCalculations.savings,
        section: 'Regime Choice',
        priority: 'high',
        category: 'structural',
        deepLink: '#regime-toggle',
        deepLinkLabel: 'Switch Now',
        taxSaving: taxCalculations.savings,
        formula: `Current regime tax: ${formatRupee(selectedTaxAmount)}. Optimal regime tax: ${formatRupee(optimalTaxAmount)}.`,
      });
    }

    // Advance tax reminder
    if (grossSalary > 0 && netAdvanceTaxLiability > 10000) {
      actions.push({
        id: 'action-advance-tax',
        title: 'Pay Advance Tax to avoid interest',
        description: `Net liability ₹${netAdvanceTaxLiability.toLocaleString('en-IN')} exceeds ₹10k threshold. Pay quarterly installments to avoid Sec 234B/234C interest (1%/month).`,
        amount: netAdvanceTaxLiability,
        section: 'Advance Tax',
        priority: 'high',
        category: 'compliance',
        deadline: '2027-03-15',
        deepLink: '/tax',
        deepLinkLabel: 'View Schedule',
        formula: 'Sec 234B: 1%/month on unpaid tax if <90% paid by Mar 31. Sec 234C: 1%/month on quarterly shortfall.',
      });
    }

    // Capital gains planning
    if (capGainsResult && capGainsResult.tax > 0) {
      actions.push({
        id: 'action-capgains',
        title: 'Plan capital gains harvesting',
        description: `${capGainsResult.type} gains of ${formatRupee(capGainsResult.gain)} attract ${capGainsResult.rate}% tax. Consider tax-loss harvesting or holding for LTCG benefit.`,
        amount: capGainsResult.gain,
        section: 'Capital Gains',
        priority: 'medium',
        category: 'investment',
        formula: `${capGainsResult.description}. Tax = ${capGainsResult.rate}% × taxable gain.`,
      });
    }

    // Standard deduction note for new regime
    if (grossSalary > 0 && selectedRegime === 'new' && taxCalculations.totalDeductionsOld > 75000 && taxCalculations.totalTaxNew > 0) {
      actions.push({
        id: 'action-std-ded',
        title: 'Evaluate Old vs New regime trade-off',
        description: `Old regime deductions (₹${taxCalculations.totalDeductionsOld.toLocaleString('en-IN')}) exceed new regime std deduction (₹75k). You lose ₹${(taxCalculations.totalDeductionsOld - 75000).toLocaleString('en-IN')} deductions by choosing New Regime.`,
        amount: taxCalculations.totalDeductionsOld - 75000,
        section: 'Regime Analysis',
        priority: 'medium',
        category: 'structural',
        formula: 'Old regime taxable = Gross - Deductions. New regime taxable = Gross - ₹75k. Compare resulting tax.',
      });
    }

    return actions;
  }, [grossSalary, ded80C, ded80D, dedNps, dedHomeLoan, selectedRegime, taxCalculations, netAdvanceTaxLiability, capGainsResult, selectedTaxAmount, optimalTaxAmount]);

  // TDS handlers
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
          profileId: activeProfileId,
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
      console.error('Failed to save TDS record.', err);
    }
  };

  const deleteTdsRecord = async (id: string) => {
    const record = tdsRecords.find(r => r.id === id);
    const details = record ? ` from "${record.deductorName}" (${formatRupee(record.taxDeducted)})` : '';
    openConfirm({
      title: 'Delete TDS Record',
      message: `Permanently delete this TDS entry${details}? This will remove it from your Form 26AS reconciliation total.`,
      confirmLabel: 'Delete TDS Record',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteTDSRecord(id); setRefresh(r => r + 1); }
    });
  };

  const handleAisUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const entries = Array.isArray(json) ? json : json.tdsRecords || json.tds || [];
        for (const entry of entries) {
          if (entry.deductorName && entry.taxDeducted) {
            await dbService.addTDSRecord({
              profileId: activeProfileId,
              deductorName: entry.deductorName,
              tanOfDeductor: entry.tanOfDeductor || entry.tan || 'MOCKTAN123',
              amountPaid: Number(entry.amountPaid || entry.amount || 0),
              taxDeducted: Number(entry.taxDeducted || entry.tds || 0),
              financialYear: entry.financialYear || '2026-27'
            });
          }
        }
        setRefresh(r => r + 1);
      } catch (err) {
        console.error('Failed to parse AIS/26AS JSON', err);
      }
    };
    reader.readAsText(file);
  };

  // Export data preparation
  const exportData = useMemo(() => ({
    financialYear: '2026-27',
    regime: selectedRegime,
    grossSalary,
    deductions: {
      '80C': { claimed: ded80C, limit: 150000, section: 'Section 80C' },
      '80D': { claimed: ded80D, limit: 50000, section: 'Section 80D' },
      '80CCD(1B)': { claimed: dedNps, limit: 50000, section: 'Section 80CCD(1B)' },
      '24(b)': { claimed: dedHomeLoan, limit: 200000, section: 'Section 24(b)' },
      'HRA': { claimed: hraExempt, limit: 0, section: 'HRA Exemption' },
    },
    taxableIncome: selectedRegime === 'old' ? taxCalculations.taxableOld : taxCalculations.taxableNew,
    totalTax: selectedTaxAmount,
    oldTax: taxCalculations.totalTaxOld,
    newTax: taxCalculations.totalTaxNew,
    savings: taxCalculations.savings,
    actions: optimizationActions.map(a => ({ ...a, completed: a.completed ?? false })),
    tdsDeducted: totalTdsDeducted,
    netAdvanceTaxLiability,
    advanceTaxSchedule: [
      { quarter: 'Q1 (Jun 15)', amount: Math.round(netAdvanceTaxLiability * 0.15), cumulativePct: 15, dueDate: '15 Jun 2026' },
      { quarter: 'Q2 (Sep 15)', amount: Math.round(netAdvanceTaxLiability * 0.30), cumulativePct: 45, dueDate: '15 Sep 2026' },
      { quarter: 'Q3 (Dec 15)', amount: Math.round(netAdvanceTaxLiability * 0.30), cumulativePct: 75, dueDate: '15 Dec 2026' },
      { quarter: 'Q4 (Mar 15)', amount: Math.round(netAdvanceTaxLiability * 0.25), cumulativePct: 100, dueDate: '15 Mar 2027' },
    ],
    capitalGains: capGainsResult ? {
      gain: capGainsResult.gain,
      type: capGainsResult.type,
      rate: capGainsResult.rate,
      tax: capGainsResult.tax,
    } : undefined,
  }), [selectedRegime, grossSalary, ded80C, ded80D, dedNps, dedHomeLoan, hraExempt, taxCalculations, selectedTaxAmount, optimizationActions, totalTdsDeducted, netAdvanceTaxLiability, capGainsResult]);

  const handleExportCSV = () => {
    const reportData = [
      { Parameter: 'Financial Year', Value: '2026-27' },
      { Parameter: 'Gross Annual Income', Value: formatRupee(grossSalary) },
      { Parameter: 'Selected Regime', Value: selectedRegime === 'old' ? 'Old Regime' : 'New Regime' },
      { Parameter: 'Old Regime Taxable Income', Value: formatRupee(taxCalculations.taxableOld) },
      { Parameter: 'New Regime Taxable Income', Value: formatRupee(taxCalculations.taxableNew) },
      { Parameter: 'Total Tax (Old Regime incl Cess)', Value: formatRupee(taxCalculations.totalTaxOld) },
      { Parameter: 'Total Tax (New Regime incl Cess)', Value: formatRupee(taxCalculations.totalTaxNew) },
      { Parameter: 'Recommended Optimal Regime', Value: taxCalculations.optimal === 'old' ? 'Old Regime' : 'New Regime' },
      { Parameter: 'Total TDS Already Deducted', Value: formatRupee(totalTdsDeducted) },
      { Parameter: 'Net Advance Tax Payable', Value: formatRupee(netAdvanceTaxLiability) }
    ];

    exportToCSV('india_tax_summary', [
      { label: 'Tax Parameter', key: 'Parameter' },
      { label: 'Amount / Details', key: 'Value' }
    ], reportData);
  };

  return (
    <>
    <ConfirmModal state={confirmModal} onClose={closeConfirm} />
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="gap-stack-lg"
    >
      {/* Page Header Banner */}
      <div className="glass-panel" data-interactive-card="off" style={{
        padding: 'var(--spacing-15) var(--spacing-2)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--spacing-15)',
        background: 'var(--header-banner-grad)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-banner)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-1)', flex: '1 1 min-content', minWidth: 'min(100%, 280px)' }}>
          <div style={{
            width: 'var(--spacing-30)',
            height: 'var(--spacing-30)',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0,
          }}>
            <FileText size={24} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="type-display" style={{ margin: 0 }}>
              India Tax Optimizer (FY 2026-27 / AY 2027-28)
            </h2>
            <p className="type-body-sm" style={{ marginTop: 'var(--spacing-04)', margin: 0 }}>
              Regime comparison, deduction optimizer, advance tax scheduler & TDS reconciliation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-075)', flexWrap: 'wrap', alignItems: 'center' }}>
          <TaxExportButton
            data={exportData}
            label="Export Report"
            variant="secondary"
            style={{ padding: 'var(--spacing-06) var(--spacing-1)', fontSize: 'var(--font-sm)' }}
          />
          <Button
            variant="primary"
            onClick={handleExportCSV}
            style={{ padding: 'var(--spacing-06) var(--spacing-1)', fontSize: 'var(--font-sm)', gap: 'var(--spacing-04)', display: 'flex', alignItems: 'center' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Regime Selector + Liability Readout (Sticky Top) */}
      <div className="glass-panel gap-stack-lg" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
        <TaxRegimeToggle
          value={selectedRegime}
          onChange={setSelectedRegime}
          oldTax={taxCalculations.totalTaxOld}
          newTax={taxCalculations.totalTaxNew}
          optimal={taxCalculations.optimal}
        />
        
        {/* Liability Summary Row */}
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-085)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
            <div className="type-label-upper" style={{ marginBottom: 'var(--spacing-04)', color: 'var(--text-secondary)' }}>
              Gross Income
            </div>
            <div className="type-title tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-black)' }}>
              {formatRupee(grossSalary)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-085)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
            <div className="type-label-upper" style={{ marginBottom: 'var(--spacing-04)', color: 'var(--text-secondary)' }}>
              Taxable Income
            </div>
            <div className="type-title tabular-nums" style={{ color: selectedRegime === 'old' ? 'var(--text-primary)' : 'var(--accent-1)', fontWeight: 'var(--fw-black)' }}>
              {formatRupee(selectedRegime === 'old' ? taxCalculations.taxableOld : taxCalculations.taxableNew)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-085)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
            <div className="type-label-upper" style={{ marginBottom: 'var(--spacing-04)', color: 'var(--text-secondary)' }}>
              Total Tax Liability
            </div>
            <div className="type-title tabular-nums" style={{ color: 'var(--error)', fontWeight: 'var(--fw-black)' }}>
              {formatRupee(selectedTaxAmount)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-085)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
            <div className="type-label-upper" style={{ marginBottom: 'var(--spacing-04)', color: 'var(--text-secondary)' }}>
              Net After TDS
            </div>
            <div className="type-title tabular-nums" style={{ color: netAdvanceTaxLiability > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 'var(--fw-black)' }}>
              {formatRupee(netAdvanceTaxLiability)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Deduction Engine (Left) + Optimization Actions (Right) */}
      <div className="card-grid responsive-stack" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Deduction Engine */}
        <div className="gap-stack-lg">
          <div className="flex-between flex-wrap gap-stack-sm">
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Calculator size={18} color="var(--accent-1)" />
              Deduction Engine
            </h3>
            <span style={{ fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-semibold)', padding: 'var(--spacing-02) var(--spacing-06)', borderRadius: 'var(--radius-pill)', background: 'var(--badge-cyan-bg)', color: 'var(--badge-cyan-text)', border: '1px solid var(--badge-cyan-border)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {deductionSections.filter(s => s.value > 0).length}/{deductionSections.length} sections filled
            </span>
          </div>

          <div className="gap-stack-md">
            {deductionSections.map((section) => (
              <DeductionCard
                key={section.id}
                id={section.id}
                title={section.title}
                icon={section.icon}
                value={section.value}
                maxLimit={section.maxLimit}
                description={section.description}
                formula={section.formula}
                source={section.source}
                helpUrl={section.helpUrl}
                expanded={expandedCards.has(section.id)}
                onExpand={() => setExpandedCards(prev => {
                  const next = new Set(prev);
                  if (next.has(section.id)) next.delete(section.id);
                  else next.add(section.id);
                  return next;
                })}
                onChange={section.setValue}
                isComplete={section.value >= section.maxLimit * 0.95 && section.maxLimit < 999999999}
                isDirty={false}
                enabled={section.enabled}
                intensity="normal"
              />
            ))}

            {/* Gross Salary Input */}
            <DeductionCard
              id="salary"
              title="Gross Annual Salary"
              icon={<Target size={18} />}
              value={grossSalary}
              maxLimit={999999999}
              description="Total taxable salary including bonus, perquisites, allowances"
              formula="Gross Salary = Basic + HRA + Special Allowance + Bonus + Perquisites - Exempt Allowances (LTA, etc.)"
              expanded={expandedCards.has('salary')}
              onExpand={() => setExpandedCards(prev => {
                const next = new Set(prev);
                if (next.has('salary')) next.delete('salary');
                else next.add('salary');
                return next;
              })}
              onChange={setGrossSalary}
              isComplete={grossSalary > 0}
              enabled={true}
              intensity="interactive"
            />
          </div>
        </div>

        {/* Optimization Action List (Sticky on Mobile) */}
        <div className="sticky-top-125">
          <OptimizationActionList
            actions={optimizationActions}
            title="Optimization Actions"
            subtitle={grossSalary > 0 && optimizationActions.length > 0 ? `${optimizationActions.filter(a => !a.completed).length} pending • ${optimizationActions.filter(a => a.completed).length} done` : undefined}
            emptyMessage={grossSalary > 0
              ? 'No optimization actions needed. Your tax plan is optimal!'
              : 'No income or deduction data recorded for this profile. Enter your Gross Annual Salary above to generate personalized tax optimization actions.'}
            onActionClick={(action) => {
              if (action.deepLink === '#regime-toggle') {
                setSelectedRegime(taxCalculations.optimal);
              }
            }}
            showCompleted={true}
          />

          {/* Capital Gains Estimator */}
          <div className="glass-panel gap-stack-lg" data-interactive-card="off" style={{ marginTop: 'var(--spacing-15)', padding: 'var(--spacing-15)' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--spacing-075)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
              <Percent size={18} color="var(--accent-1)" /> Capital Gains Tax Estimator
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>
              Calculate tax on stocks, mutual funds, and property sales.
            </p>

            <form onSubmit={calculateCapitalGains}>
              <FormRow gap="var(--spacing-075)">
                <FormField label="Asset Category" htmlFor="tax-asset-category">
                  <select id="tax-asset-category" value={assetType} onChange={(e) => setAssetType(e.target.value as 'Equity' | 'Debt' | 'Property')} style={{ padding: 'var(--spacing-06)' }}>
                    <option value="Equity">Equity (Shares / MFs)</option>
                    <option value="Debt">Debt (Bonds / Funds)</option>
                    <option value="Property">Real Estate Property</option>
                  </select>
                </FormField>
                <FormField label="Holding Period (Months)" htmlFor="tax-holding-months">
                  <input id="tax-holding-months" type="number" className="form-input" value={holdingMonths} onChange={(e) => setHoldingMonths(parseInt(e.target.value) || 0)} />
                </FormField>
              </FormRow>
              <FormRow gap="var(--spacing-075)">
                <FormField label="Total Purchase Cost (₹)" htmlFor="tax-purchase-cost" style={{ margin: 0 }}>
                  <CurrencyInput id="tax-purchase-cost" className="form-input" value={buyValue} onChange={(e) => setBuyValue(parseInt(e.target.value) || 0)} />
                </FormField>
                <FormField label="Total Redemption Value (₹)" htmlFor="tax-redemption-val" style={{ margin: 0 }}>
                  <CurrencyInput id="tax-redemption-val" className="form-input" value={sellValue} onChange={(e) => setSellValue(parseInt(e.target.value) || 0)} />
                </FormField>
              </FormRow>
              <Button
                type="submit"
                variant="secondary"
                style={{ width: '100%', padding: 'var(--spacing-06)', marginTop: 'var(--spacing-05)' }}
              >
                Estimate Gains Tax
              </Button>
            </form>

            <AnimatePresence>
              {capGainsResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-panel" data-interactive-card="off" style={{
                    marginTop: 'var(--spacing-1)', padding: 'var(--spacing-1)', background: 'var(--surface-faint)', borderColor: 'var(--border-focus)', overflow: 'hidden'
                  }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-05)', fontSize: 'var(--font-sm)' }}>
                    <div>Total Gains: <strong className="tabular-nums">{formatRupee(capGainsResult.gain)}</strong></div>
                    <div>Classification: <strong>{capGainsResult.type}</strong></div>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-04)', marginTop: 'var(--spacing-04)' }}>
                      Gains Tax Due: <strong className="tabular-nums" style={{ color: 'var(--error)', fontSize: 'var(--font-base)' }}>{formatRupee(capGainsResult.tax)}</strong> ({capGainsResult.rate}%)
                    </div>
                    <span style={{ gridColumn: 'span 2', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {capGainsResult.description}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advance Tax Quarterly Tracker */}
          <div className="glass-panel gap-stack-lg" data-interactive-card="off" style={{ marginTop: 'var(--spacing-15)', padding: 'var(--spacing-15)' }}>
            <div className="flex-between flex-wrap gap-stack-sm">
              <h3 style={{ fontSize: 'var(--font-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', fontWeight: 'var(--fw-bold)' }}>
                <Calendar size={18} color="var(--accent-1)" /> Advance Tax Schedule (Sec 208)
              </h3>
              <span style={{ fontSize: 'var(--font-sm)', color: netAdvanceTaxLiability > 10000 ? 'var(--error)' : 'var(--success)', fontWeight: 'var(--fw-semibold)' }}>
                {netAdvanceTaxLiability > 10000 ? `⚠️ Net Liability: ${formatRupee(netAdvanceTaxLiability)}` : '✓ Below ₹10k threshold'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>
              Mandatory quarterly tax installment schedule for individuals and businesses with net tax liability exceeding ₹10,000 to prevent penal interest under Sections 234B and 234C.
            </p>

            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {[
                { q: 'Q1 (Jun 15)', targetPct: 15, date: '15 Jun 2026' },
                { q: 'Q2 (Sep 15)', targetPct: 45, date: '15 Sep 2026' },
                { q: 'Q3 (Dec 15)', targetPct: 75, date: '15 Dec 2026' },
                { q: 'Q4 (Mar 15)', targetPct: 100, date: '15 Mar 2027' }
              ].map(q => {
                const installmentAmount = Math.round((netAdvanceTaxLiability * q.targetPct) / 100);
                const isPaid = false; // Could track from TDS/advance tax payments
                return (
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    key={q.q}
                    className="glass-panel"
                    data-interactive-card="off"
                    style={{ padding: 'var(--spacing-1)', borderLeft: `1px solid ${isPaid ? 'var(--success)' : 'var(--accent-1)'}`, opacity: isPaid ? 0.6 : 1 }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{q.q}</div>
                    <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', margin: 'var(--spacing-04) 0', color: 'var(--text-primary)' }}>
                      {formatRupee(installmentAmount)}
                    </div>
                    <div style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-02)' }}>
                      <Clock size={12} />
                      <span>Cumulative {q.targetPct}% by {q.date}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TDS Summary Log */}
      <div className="glass-panel gap-stack-lg" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
        <div className="flex-between flex-wrap gap-stack-sm">
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
            <FileText size={18} color="var(--accent-2)" /> TDS Summary (Form 26AS Reconciliation)
          </h3>
          <Button
            variant="primary"
            style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', borderRadius: 'var(--radius-sm)' }}
            onClick={() => openTdsModal()}
          >
            <Plus size={14} /> Add TDS Record
          </Button>
        </div>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>
          Tax Deducted at Source records reconciled from AIS/26AS. Total TDS: <strong>{formatRupee(totalTdsDeducted)}</strong>
        </p>

        <div className="gap-stack-md">
          {tdsRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-2)', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              No tax deduction entries recorded. Add employer salary TDS, bank interest TDS, or client contractor TDS entries above, or import your annual AIS / Form 26AS JSON file.
            </div>
          ) : tdsRecords.map((r) => (
            <div key={r.id} style={{
              padding: 'var(--spacing-085)', background: 'var(--surface-faint)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)', fontSize: 'var(--font-sm)', position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-1)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-075)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{r.deductorName}</span>
                    <span style={{ fontSize: 'var(--font-2xs)', fontWeight: 'var(--fw-semibold)', padding: 'var(--spacing-02) var(--spacing-04)', borderRadius: 'var(--radius-pill)', background: 'var(--surface-tint)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      FY {r.financialYear}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-04)', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
                    <span>TAN: <code style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.tanOfDeductor}</code></span>
                    <span>Gross Paid: {formatRupee(r.amountPaid)}</span>
                    <span style={{ color: 'var(--error)' }}>TDS: {formatRupee(r.taxDeducted)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-04)' }}>
                  <IconButton label="Edit TDS record" icon={<Edit2 size={16} />} onClick={() => openTdsModal(r)} />
                  <IconButton variant="danger" label="Delete TDS record" icon={<Trash2 size={16} />} onClick={() => deleteTdsRecord(r.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <FileDropzone
          accept=".json"
          label="Upload AIS / Form 26AS JSON"
          sublabel="Drag & drop Annual Information Statement (AIS) JSON or click to browse"
          variant="compact"
          onFileSelect={handleAisUpload}
          style={{ marginTop: 'var(--spacing-05)' }}
        />
      </div>

      {/* Footer Disclaimer */}
      <div className="flex-start flex-wrap gap-inline-sm" style={{ fontSize: 'var(--font-2xs)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-075)' }}>
        <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 'var(--spacing-02)' }} />
        <span style={{ lineHeight: 1.6 }}>
          Computations include standard 4% Education &amp; Health Cess. Rebates under Section 87A applied (Old: ≤₹5L taxable, New: ≤₹12L taxable).
          FY 2026-27 slabs: Old 0-2.5L:0%, 2.5-5L:5%, 5-10L:20%, &gt;10L:30% | New 0-4L:0%, 4-8L:5%, 8-12L:10%, 12-16L:15%, 16-20L:20%, 20-24L:25%, &gt;24L:30%.
          This tool provides estimates only — consult a Chartered Accountant for filing.
        </span>
      </div>

      {/* TDS Modal */}
      <Modal
        isOpen={showTdsModal}
        onClose={closeTdsModal}
        title={editTdsId ? 'Edit TDS Record' : 'Add TDS Record'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); saveTdsRecord(); }} className="gap-stack-lg">
          <FormField label="Deductor Name" htmlFor="tds-deductor-name">
            <input id="tds-deductor-name" type="text" className="form-input" value={tdsDeductorName} onChange={(e) => setTdsDeductorName(e.target.value)} placeholder="e.g. Tech Corp India Pvt Ltd" />
          </FormField>

          <FormField label="TAN of Deductor" htmlFor="tds-tan">
            <input id="tds-tan" type="text" className="form-input" value={tdsTan} onChange={(e) => setTdsTan(e.target.value)} placeholder="e.g. MUMT03829A" />
          </FormField>

          <FormRow>
            <FormField label="Gross Amount Paid" htmlFor="tds-gross-paid">
              <CurrencyInput id="tds-gross-paid" className="form-input" value={tdsAmountPaid} onChange={(e) => setTdsAmountPaid(parseFloat(e.target.value) || 0)} />
            </FormField>
            <FormField label="Tax Deducted (TDS)" htmlFor="tds-tax-deducted">
              <CurrencyInput id="tds-tax-deducted" className="form-input" value={tdsTaxDeducted} onChange={(e) => setTdsTaxDeducted(parseFloat(e.target.value) || 0)} />
            </FormField>
          </FormRow>

          <FormField label="Financial Year" htmlFor="tds-financial-year">
            <select id="tds-financial-year" className="form-input" value={tdsFY} onChange={(e) => setTdsFY(e.target.value)}>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
            </select>
          </FormField>

          <FormActions
            onCancel={closeTdsModal}
            submitLabel={editTdsId ? 'Save TDS Entry Changes' : 'Save TDS Entry'}
          />
        </form>
      </Modal>
    </motion.div>
    </>
  );
};

export default TaxView;