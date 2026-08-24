import React, { useState, useMemo, useEffect } from 'react';
import { Button, CurrencyInput, Modal, Tabs, IconButton, StatRow, EmptyState, PanelHeader, FormField, FormActions, SummaryMetricGrid, FormRow, InfoCallout, Slider, chartTooltipStyle, chartTooltipItemStyle } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { useDbSyncCallback } from '../hooks/useDbSync.js';
import {
  TrendingUp, BarChart2,
  HelpCircle, Layers, Sliders, Play, Trash2, Plus, Edit2
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, AreaChart, Area
} from 'recharts';
import {
  FixedDeposit, StockHolding, MutualFundHolding, GoldHolding,
  NPSHolding, ProvidentFundHolding, BankAccount
} from '@financeos/shared';
import { formatRupee } from '@financeos/shared';
import { ConfirmModal, useConfirmModal } from './ConfirmModal.js';
import { calculateFdAccruedValue, solveXIRR, CashFlow } from '../utils/financialCalculations.js';

interface InvestmentsViewProps {
  activeProfileId: string;
}

interface MonteCarloPoint {
  year: string;
  WorstCase: number;
  Expected: number;
  BestCase: number;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({ activeProfileId }) => {
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const [activeTab, setActiveTab] = useState<'holdings' | 'rebalance' | 'sim'>('holdings');

  // Dynamic DB States as React State
  const [accounts, setAccounts] = useState<BankAccount[]>(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId));
  const [stocks, setStocks] = useState<StockHolding[]>(() => dbService.getStocks().filter(s => s.profileId === activeProfileId));
  const [mfs, setMfs] = useState<MutualFundHolding[]>(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
  const [fds, setFds] = useState<FixedDeposit[]>(() => dbService.getFDs().filter(f => f.profileId === activeProfileId));
  const [gold, setGold] = useState<GoldHolding[]>(() => dbService.getGold().filter(g => g.profileId === activeProfileId));
  const [nps, setNps] = useState<NPSHolding[]>(() => dbService.getNPS().filter(n => n.profileId === activeProfileId));
  const [pf, setPf] = useState<ProvidentFundHolding[]>(() => dbService.getPF().filter(p => p.profileId === activeProfileId));

  // Modal Open/Close Toggles
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddMF, setShowAddMF] = useState(false);
  const [showAddFD, setShowAddFD] = useState(false);
  const [showAddGold, setShowAddGold] = useState(false);
  const [showAddNPS, setShowAddNPS] = useState(false);
  const [showAddPF, setShowAddPF] = useState(false);

  // Edit IDs
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [editMFId, setEditMFId] = useState<string | null>(null);
  const [editFDId, setEditFDId] = useState<string | null>(null);
  const [editGoldId, setEditGoldId] = useState<string | null>(null);
  const [editNPSId, setEditNPSId] = useState<string | null>(null);
  const [editPFId, setEditPFId] = useState<string | null>(null);

  // Form Fields: Stocks
  const [stkSymbol, setStkSymbol] = useState('');
  const [stkName, setStkName] = useState('');
  const [stkQty, setStkQty] = useState('');
  const [stkAvgPrice, setStkAvgPrice] = useState('');
  const [stkCurrentPrice, setStkCurrentPrice] = useState('');
  const [stkNominee, setStkNominee] = useState('');

  // Form Fields: Mutual Funds
  const [mfSchemeName, setMfSchemeName] = useState('');
  const [mfUnits, setMfUnits] = useState('');
  const [mfAvgNav, setMfAvgNav] = useState('');
  const [mfCurrentNav, setMfCurrentNav] = useState('');
  const [mfNominee, setMfNominee] = useState('');

  // SIP Setup
  const [mfAutoSIP, setMfAutoSIP] = useState(false);
  const [mfSIPAmount, setMfSIPAmount] = useState('');
  const [mfSIPAccount, setMfSIPAccount] = useState('');
  const [mfSIPStepUp, setMfSIPStepUp] = useState('');
  const [mfSIPStartDate, setMfSIPStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Form Fields: FDs
  const [fdBankName, setFdBankName] = useState('');
  const [fdPrincipal, setFdPrincipal] = useState('');
  const [fdInterestRate, setFdInterestRate] = useState('');
  const [fdStartDate, setFdStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [fdMaturityDate, setFdMaturityDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [fdMaturityAmount, setFdMaturityAmount] = useState('');
  const [fdNominee, setFdNominee] = useState('');

  // Form Fields: Gold
  const [gldType, setGldType] = useState<'Physical' | 'SGB' | 'Digital'>('Physical');
  const [gldQty, setGldQty] = useState('');
  const [gldBuyPrice, setGldBuyPrice] = useState('');
  const [gldCurrentPrice, setGldCurrentPrice] = useState('');
  const [gldNominee, setGldNominee] = useState('');

  // Form Fields: NPS
  const [npsPran, setNpsPran] = useState('');
  const [npsBalance, setNpsBalance] = useState('');
  const [npsE, setNpsE] = useState('50');
  const [npsC, setNpsC] = useState('25');
  const [npsG, setNpsG] = useState('20');
  const [npsA, setNpsA] = useState('5');
  const [npsNominee, setNpsNominee] = useState('');

  // Form Fields: PF
  const [pfType, setPfType] = useState<'EPF' | 'PPF'>('EPF');
  const [pfAccNum, setPfAccNum] = useState('');
  const [pfBalance, setPfBalance] = useState('');
  const [pfContrib, setPfContrib] = useState('');
  const [pfNominee, setPfNominee] = useState('');

  // Monte Carlo parameters
  const [horizonYears, setHorizonYears] = useState(25);
  const [monthlyContribution, setMonthlyContribution] = useState(30000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [inflationRate, setInflationRate] = useState(6);
  const [volatility, setVolatility] = useState(15);
  const [simResults, setSimResults] = useState<MonteCarloPoint[]>([]);

  // Target allocations for rebalancing
  const [targetEquity, setTargetEquity] = useState(50);
  const [targetDebt, setTargetDebt] = useState(30);
  const [targetGold, setTargetGold] = useState(20);

  const refreshData = () => {
    setAccounts(dbService.getAccounts().filter(a => a.profileId === activeProfileId));
    setStocks(dbService.getStocks().filter(s => s.profileId === activeProfileId));
    setMfs(dbService.getMutualFunds().filter(m => m.profileId === activeProfileId));
    setFds(dbService.getFDs().filter(f => f.profileId === activeProfileId));
    setGold(dbService.getGold().filter(g => g.profileId === activeProfileId));
    setNps(dbService.getNPS().filter(n => n.profileId === activeProfileId));
    setPf(dbService.getPF().filter(p => p.profileId === activeProfileId));
  };

  useDbSyncCallback(refreshData);

  useEffect(() => {
    refreshData();
  }, [activeProfileId]);

  // Computations
  const stockVal = useMemo(() => stocks.reduce((sum: number, s) => sum + (s.quantity * s.currentPrice), 0), [stocks]);
  const stockCost = useMemo(() => stocks.reduce((sum: number, s) => sum + (s.quantity * s.averagePrice), 0), [stocks]);

  const mfVal = useMemo(() => mfs.reduce((sum: number, m) => sum + (m.units * m.currentNav), 0), [mfs]);
  const mfCost = useMemo(() => mfs.reduce((sum: number, m) => sum + (m.units * m.averageNav), 0), [mfs]);

  const goldVal = useMemo(() => gold.reduce((sum: number, g) => sum + (g.quantityGrams * g.currentPrice), 0), [gold]);
  const goldCost = useMemo(() => gold.reduce((sum: number, g) => sum + (g.quantityGrams * g.purchasePrice), 0), [gold]);

  const npsVal = useMemo(() => nps.reduce((sum: number, n) => sum + n.balance, 0), [nps]);
  const pfVal = useMemo(() => pf.reduce((sum: number, p) => sum + p.balance, 0), [pf]);
  const fdVal = useMemo(() => fds.filter((f) => !f.isMatured).reduce((sum: number, f) => sum + calculateFdAccruedValue(f), 0), [fds]);

  const totalPortfolioVal = stockVal + mfVal + goldVal + npsVal + pfVal + fdVal;
  const investedCost = stockCost + mfCost + goldCost + npsVal + pfVal + fdVal;
  const netReturns = totalPortfolioVal - investedCost;
  const returnPct = investedCost > 0 ? (netReturns / investedCost) * 100 : 0;

  const calculatedXIRR = useMemo(() => {
    if (investedCost === 0 || totalPortfolioVal === 0) return 0;

    // Aggregate authentic cash outflows by holding start/creation dates
    const flows: CashFlow[] = [];
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Add individual FDs with their start dates
    fds.forEach(f => {
      flows.push({ date: new Date(f.startDate || oneYearAgo), amount: -f.principalAmount });
    });

    // Add direct stocks
    stocks.forEach(s => {
      const cost = s.quantity * s.averagePrice;
      if (cost > 0) {
        flows.push({ date: new Date((s as any).createdAt || oneYearAgo), amount: -cost });
      }
    });

    // Add mutual funds
    mfs.forEach(m => {
      const cost = m.units * m.averageNav;
      if (cost > 0) {
        flows.push({ date: new Date((m as any).createdAt || oneYearAgo), amount: -cost });
      }
    });

    // Add gold holdings
    gold.forEach(g => {
      const cost = g.quantityGrams * g.purchasePrice;
      if (cost > 0) {
        flows.push({ date: new Date((g as any).createdAt || oneYearAgo), amount: -cost });
      }
    });

    // Add NPS balance
    nps.forEach(n => {
      if (n.balance > 0) {
        flows.push({ date: new Date((n as any).createdAt || oneYearAgo), amount: -n.balance });
      }
    });

    // Add PF balance
    pf.forEach(p => {
      if (p.balance > 0) {
        flows.push({ date: new Date((p as any).createdAt || oneYearAgo), amount: -p.balance });
      }
    });

    // Fallback if no individual flows populated
    if (flows.length === 0) {
      flows.push({ date: oneYearAgo, amount: -investedCost });
    }

    // Terminal value today
    flows.push({ date: new Date(), amount: totalPortfolioVal });

    return solveXIRR(flows) * 100;
  }, [fds, stocks, mfs, gold, nps, pf, investedCost, totalPortfolioVal]);

  const closeAllModals = () => {
    setShowAddStock(false); setEditStockId(null);
    setShowAddMF(false); setEditMFId(null);
    setShowAddFD(false); setEditFDId(null);
    setShowAddGold(false); setEditGoldId(null);
    setShowAddNPS(false); setEditNPSId(null);
    setShowAddPF(false); setEditPFId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const rebalanceData = useMemo(() => {
    const currentEquityVal = stockVal + mfVal;
    const currentDebtVal = fdVal + npsVal + pfVal;
    const currentGoldVal = goldVal;

    const actualEqPct = totalPortfolioVal > 0 ? (currentEquityVal / totalPortfolioVal) * 100 : 0;
    const actualDbPct = totalPortfolioVal > 0 ? (currentDebtVal / totalPortfolioVal) * 100 : 0;
    const actualGdPct = totalPortfolioVal > 0 ? (currentGoldVal / totalPortfolioVal) * 100 : 0;

    const targetEqVal = (targetEquity / 100) * totalPortfolioVal;
    const targetDbVal = (targetDebt / 100) * totalPortfolioVal;
    const targetGdVal = (targetGold / 100) * totalPortfolioVal;

    return [
      { name: 'Equity (Stocks + MFs)', actualPct: actualEqPct, targetPct: targetEquity, deviation: targetEqVal - currentEquityVal },
      { name: 'Debt (FDs + NPS + PF)', actualPct: actualDbPct, targetPct: targetDebt, deviation: targetDbVal - currentDebtVal },
      { name: 'Gold & Alternatives', actualPct: actualGdPct, targetPct: targetGold, deviation: targetGdVal - currentGoldVal }
    ];
  }, [stockVal, mfVal, fdVal, npsVal, pfVal, goldVal, totalPortfolioVal, targetEquity, targetDebt, targetGold]);

  // Submission Triggers
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkSymbol || !stkQty || !stkAvgPrice) return;
    const stockData = {
      profileId: activeProfileId,
      symbol: stkSymbol.toUpperCase(),
      name: stkName || stkSymbol.toUpperCase(),
      quantity: parseFloat(stkQty),
      averagePrice: parseFloat(stkAvgPrice),
      currentPrice: parseFloat(stkCurrentPrice) || parseFloat(stkAvgPrice),
      nomineeName: stkNominee || undefined
    };

    if (editStockId) {
      await dbService.updateStock(editStockId, stockData);
    } else {
      await dbService.addStock(stockData);
    }

    setStkSymbol(''); setStkName(''); setStkQty(''); setStkAvgPrice(''); setStkCurrentPrice(''); setStkNominee('');
    setEditStockId(null);
    setShowAddStock(false); refreshData();
  };

  const handleDeleteStock = async (id: string) => {
    openConfirm({ title: 'Delete Stock Holding', message: 'Permanently remove this stock holding from your portfolio? Portfolio valuation and returns will be recalculated.', confirmLabel: 'Delete Holding', isDanger: true, onConfirm: async () => { await dbService.deleteStock(id); refreshData(); } });
  };

  const handleEditStock = (s: StockHolding) => {
    setEditStockId(s.id);
    setStkSymbol(s.symbol);
    setStkName(s.name);
    setStkQty(s.quantity.toString());
    setStkAvgPrice(s.averagePrice.toString());
    setStkCurrentPrice(s.currentPrice.toString());
    setStkNominee(s.nomineeName || '');
    setShowAddStock(true);
  };

  const handleAddMF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfSchemeName || !mfUnits || !mfAvgNav) return;

    const mfData = {
      profileId: activeProfileId,
      schemeCode: 'custom',
      schemeName: mfSchemeName,
      units: parseFloat(mfUnits),
      averageNav: parseFloat(mfAvgNav),
      currentNav: parseFloat(mfCurrentNav) || parseFloat(mfAvgNav),
      nomineeName: mfNominee || undefined
    };

    let savedId = editMFId;
    if (editMFId) {
      await dbService.updateMutualFund(editMFId, mfData);
    } else {
      const newMF = await dbService.addMutualFund(mfData);
      savedId = newMF.id;
    }

    if (mfAutoSIP && mfSIPAmount && savedId) {
      const accId = mfSIPAccount || accounts[0]?.id;
      if (accId) {
        await dbService.addRecurringTransaction({
          profileId: activeProfileId,
          description: mfSchemeName + ' SIP',
          amount: parseFloat(mfSIPAmount),
          type: 'Transfer',
          category: 'Investments',
          accountId: accId,
          frequency: 'Monthly',
          nextDueDate: mfSIPStartDate,
          startDate: mfSIPStartDate,
          stepUpPct: parseFloat(mfSIPStepUp) || undefined,
          targetAssetId: savedId,
          isActive: true
        });
      }
    }

    setMfSchemeName(''); setMfUnits(''); setMfAvgNav(''); setMfCurrentNav(''); setMfNominee('');
    setMfAutoSIP(false); setMfSIPAmount(''); setMfSIPAccount(''); setMfSIPStepUp(''); setMfSIPStartDate(new Date().toISOString().split('T')[0]);
    setEditMFId(null);
    setShowAddMF(false); refreshData();
  };

  const handleDeleteMF = async (id: string) => {
    openConfirm({ title: 'Delete Mutual Fund Holding', message: 'Permanently remove this mutual fund holding from your portfolio? Portfolio returns and XIRR will be updated.', confirmLabel: 'Delete Fund', isDanger: true, onConfirm: async () => { await dbService.deleteMutualFund(id); refreshData(); } });
  };

  const handleEditMF = (m: MutualFundHolding) => {
    setEditMFId(m.id);
    setMfSchemeName(m.schemeName);
    setMfUnits(m.units.toString());
    setMfAvgNav(m.averageNav.toString());
    setMfCurrentNav(m.currentNav.toString());
    setMfNominee(m.nomineeName || '');
    setShowAddMF(true);
  };

  const handleAddFD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fdBankName || !fdPrincipal || !fdInterestRate) return;
    const principal = parseFloat(fdPrincipal);
    const rate = parseFloat(fdInterestRate);
    const maturity = parseFloat(fdMaturityAmount) || principal * Math.pow(1 + (rate / 100), 1);

    const fdData = {
      profileId: activeProfileId,
      bankName: fdBankName,
      principalAmount: principal,
      interestRate: rate,
      startDate: fdStartDate,
      maturityDate: fdMaturityDate,
      maturityAmount: maturity,
      nomineeName: fdNominee || undefined,
      isMatured: false
    };

    if (editFDId) {
      await dbService.updateFD(editFDId, fdData);
    } else {
      await dbService.addFD(fdData);
    }

    setFdBankName(''); setFdPrincipal(''); setFdInterestRate(''); setFdMaturityAmount(''); setFdNominee('');
    setEditFDId(null);
    setShowAddFD(false); refreshData();
  };

  const handleDeleteFD = async (id: string) => {
    openConfirm({ title: 'Delete Fixed Deposit', message: 'Permanently remove this fixed deposit from your records? Interest accruals and maturity reminders will be removed.', confirmLabel: 'Delete Deposit', isDanger: true, onConfirm: async () => { await dbService.deleteFD(id); refreshData(); } });
  };

  const handleEditFD = (f: FixedDeposit) => {
    setEditFDId(f.id);
    setFdBankName(f.bankName);
    setFdPrincipal(f.principalAmount.toString());
    setFdInterestRate(f.interestRate.toString());
    setFdStartDate(f.startDate);
    setFdMaturityDate(f.maturityDate);
    setFdMaturityAmount(f.maturityAmount.toString());
    setFdNominee(f.nomineeName || '');
    setShowAddFD(true);
  };

  const handleAddGold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gldQty || !gldBuyPrice) return;

    const goldData = {
      profileId: activeProfileId,
      type: gldType,
      quantityGrams: parseFloat(gldQty),
      purchasePrice: parseFloat(gldBuyPrice),
      currentPrice: parseFloat(gldCurrentPrice) || parseFloat(gldBuyPrice),
      nomineeName: gldNominee || undefined
    };

    if (editGoldId) {
      await dbService.updateGold(editGoldId, goldData);
    } else {
      await dbService.addGold(goldData);
    }

    setGldQty(''); setGldBuyPrice(''); setGldCurrentPrice(''); setGldNominee('');
    setEditGoldId(null);
    setShowAddGold(false); refreshData();
  };

  const handleDeleteGold = async (id: string) => {
    openConfirm({ title: 'Delete Gold Asset', message: 'Permanently remove this gold holding from your portfolio valuation?', confirmLabel: 'Delete Asset', isDanger: true, onConfirm: async () => { await dbService.deleteGold(id); refreshData(); } });
  };

  const handleEditGold = (g: GoldHolding) => {
    setEditGoldId(g.id);
    setGldType(g.type);
    setGldQty(g.quantityGrams.toString());
    setGldBuyPrice(g.purchasePrice.toString());
    setGldCurrentPrice(g.currentPrice.toString());
    setGldNominee(g.nomineeName || '');
    setShowAddGold(true);
  };

  const handleAddNPS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npsBalance) return;
    const allocSum = (parseInt(npsE) || 0) + (parseInt(npsC) || 0) + (parseInt(npsG) || 0) + (parseInt(npsA) || 0);
    if (allocSum !== 100) {
      return;
    }
    const npsData = {
      profileId: activeProfileId,
      pranNumber: npsPran || 'N/A',
      balance: parseFloat(npsBalance),
      allocationTier1: {
        E: parseInt(npsE) || 50,
        C: parseInt(npsC) || 25,
        G: parseInt(npsG) || 20,
        A: parseInt(npsA) || 5
      },
      nomineeName: npsNominee || undefined
    };

    if (editNPSId) {
      await dbService.updateNPS(editNPSId, npsData);
    } else {
      await dbService.addNPS(npsData);
    }

    setNpsPran(''); setNpsBalance(''); setNpsNominee('');
    setEditNPSId(null);
    setShowAddNPS(false); refreshData();
  };

  const handleDeleteNPS = async (id: string) => {
    openConfirm({ title: 'Delete NPS Account', message: 'Permanently remove this National Pension System (NPS) record from your portfolio?', confirmLabel: 'Delete Account', isDanger: true, onConfirm: async () => { await dbService.deleteNPS(id); refreshData(); } });
  };

  const handleEditNPS = (n: NPSHolding) => {
    setEditNPSId(n.id);
    setNpsPran(n.pranNumber);
    setNpsBalance(n.balance.toString());
    setNpsE(n.allocationTier1.E.toString());
    setNpsC(n.allocationTier1.C.toString());
    setNpsG(n.allocationTier1.G.toString());
    setNpsA(n.allocationTier1.A.toString());
    setNpsNominee(n.nomineeName || '');
    setShowAddNPS(true);
  };

  const handleAddPF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfBalance) return;
    const pfData = {
      profileId: activeProfileId,
      type: pfType,
      accountNumber: pfAccNum || 'N/A',
      balance: parseFloat(pfBalance),
      yearlyContribution: parseFloat(pfContrib) || 0,
      nomineeName: pfNominee || undefined
    };

    if (editPFId) {
      await dbService.updatePF(editPFId, pfData);
    } else {
      await dbService.addPF(pfData);
    }

    setPfAccNum(''); setPfBalance(''); setPfContrib(''); setPfNominee('');
    setEditPFId(null);
    setShowAddPF(false); refreshData();
  };

  const handleDeletePF = async (id: string) => {
    openConfirm({ title: 'Delete Provident Fund Account', message: 'Permanently remove this Provident Fund (EPF/PPF) record from your retirement portfolio?', confirmLabel: 'Delete Account', isDanger: true, onConfirm: async () => { await dbService.deletePF(id); refreshData(); } });
  };

  const handleEditPF = (p: ProvidentFundHolding) => {
    setEditPFId(p.id);
    setPfType(p.type);
    setPfAccNum(p.accountNumber);
    setPfBalance(p.balance.toString());
    setPfContrib(p.yearlyContribution.toString());
    setPfNominee(p.nomineeName || '');
    setShowAddPF(true);
  };

  const runMonteCarloSimulation = () => {
    const runsCount = 100;
    const months = horizonYears * 12;
    const results: number[][] = Array.from({ length: runsCount }, () => []);

    const initialVal = totalPortfolioVal;
    const realReturnPct = expectedReturn / 100;
    const realInflationPct = inflationRate / 100;
    const monthlyReturn = realReturnPct / 12;
    const monthlyInflation = realInflationPct / 12;
    const monthlyVol = (volatility / 100) / Math.sqrt(12);

    for (let r = 0; r < runsCount; r++) {
      let balance = initialVal;
      results[r].push(balance);

      for (let m = 1; m <= months; m++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const returnFactor = Math.exp((monthlyReturn - 0.5 * Math.pow(monthlyVol, 2)) + monthlyVol * randStdNormal);
        balance = balance * returnFactor;

        const inflatedContrib = monthlyContribution * Math.pow(1 + monthlyInflation, m);
        balance += inflatedContrib;
        balance = balance / (1 + monthlyInflation);

        if (m % 12 === 0) {
          results[r].push(balance);
        }
      }
    }

    const formattedData: MonteCarloPoint[] = [];
    for (let y = 0; y <= horizonYears; y++) {
      const yearValues = results.map(run => run[y]).sort((a, b) => a - b);
      formattedData.push({
        year: `Yr ${y}`,
        WorstCase: Math.round(yearValues[Math.floor(runsCount * 0.1)]),
        Expected: Math.round(yearValues[Math.floor(runsCount * 0.5)]),
        BestCase: Math.round(yearValues[Math.floor(runsCount * 0.9)])
      });
    }

    setSimResults(formattedData);
  };

  useEffect(() => {
    if (activeTab === 'sim' && simResults.length === 0) {
      runMonteCarloSimulation();
    }
  }, [activeTab, simResults.length]);



  return (
    <>
      <ConfirmModal state={confirmModal} onClose={closeConfirm} />
      <div className="gap-stack-lg animate-fade-in">

        {/* Portfolio Value Summary Header */}
        <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
          <SummaryMetricGrid columns="auto" minItemWidth="180px" gap="var(--spacing-125)">
            <div>
              <span className="uppercase-label" style={{ color: 'var(--accent-1)', fontWeight: 'var(--fw-heavy)' }}>Portfolio Valuation</span>
              <h2 className="type-metric tabular-nums" style={{ fontSize: 'var(--font-4xl)', color: 'var(--accent-1)', marginTop: 'var(--spacing-025)', fontWeight: 'var(--fw-black)' }}>
                {formatRupee(totalPortfolioVal)}
              </h2>
            </div>
            <div>
              <span className="uppercase-label" style={{ color: 'var(--text-secondary)', fontWeight: 'var(--fw-bold)' }}>Invested Cost</span>
              <h3 className="type-metric-sm tabular-nums" style={{ marginTop: 'var(--spacing-025)', fontWeight: 'var(--fw-black)', color: 'var(--text-primary)' }}>
                {formatRupee(investedCost)}
              </h3>
            </div>
            <div>
              <span className="uppercase-label" style={{ color: 'var(--text-secondary)', fontWeight: 'var(--fw-bold)' }}>Returns (Gain)</span>
              <h3 className="type-metric-sm tabular-nums" style={{ color: netReturns >= 0 ? 'var(--success)' : 'var(--error)', marginTop: 'var(--spacing-025)', fontWeight: 'var(--fw-black)' }}>
                {formatRupee(netReturns)} <span className="type-badge" style={{ fontSize: 'var(--font-sm)', marginLeft: 'var(--spacing-025)', fontWeight: 'var(--fw-heavy)' }}>({returnPct.toFixed(1)}%)</span>
              </h3>
            </div>
            <div>
              <span className="uppercase-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-025)', color: 'var(--text-secondary)', fontWeight: 'var(--fw-bold)' }}>
                XIRR (Annualized) <span title="Internal Rate of Return computed via Bisection method."><HelpCircle size={12} color="var(--text-muted)" /></span>
              </span>
              <h3 className="type-metric-sm tabular-nums" style={{ color: 'var(--accent-2)', marginTop: 'var(--spacing-025)', fontWeight: 'var(--fw-black)' }}>
                {calculatedXIRR.toFixed(2)}%
              </h3>
            </div>
          </SummaryMetricGrid>
        </div>

        {/* Tabs Menu */}
        <Tabs
          tabs={[
            { id: 'holdings', label: 'Asset Holdings' },
            { id: 'rebalance', label: 'Portfolio Rebalancing' },
            { id: 'sim', label: 'Retirement Simulator (Monte Carlo)' },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'holdings' | 'rebalance' | 'sim')}
          variant="segmented"
        />

        {/* Tab: Holdings View */}
        {activeTab === 'holdings' && (
          <div id="holdings-panel" role="tabpanel" aria-labelledby="holdings-tab" className="gap-stack-lg">

            {/* Stocks */}
            <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
              <PanelHeader
                icon={<Layers size={16} />}
                title="Direct Equity Stocks"
                action={
                  <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-sm)' }} onClick={() => setShowAddStock(true)}>
                    <Plus size={14} /> Add Stock
                  </Button>
                }
              />

              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                    Direct equity stock holdings with quantity, average cost, current price, value, nominee and returns
                  </caption>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company Name</th>
                      <th className="numeric-cell">Qty</th>
                      <th className="numeric-cell">Avg Cost</th>
                      <th className="numeric-cell">Current Price</th>
                      <th className="numeric-cell">Current Value</th>
                      <th>Nominee</th>
                      <th className="numeric-cell">Returns</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.length > 0 ? (
                      stocks.map((s) => {
                        const cost = s.quantity * s.averagePrice;
                        const val = s.quantity * s.currentPrice;
                        const ret = val - cost;
                        const pct = cost > 0 ? (ret / cost) * 100 : 0;
                        return (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 'var(--fw-bold)', letterSpacing: '0.01em', color: 'var(--text-primary)' }}>{s.symbol}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                            <td className="numeric-cell">{s.quantity}</td>
                            <td className="numeric-cell">{formatRupee(s.averagePrice)}</td>
                            <td className="numeric-cell">{formatRupee(s.currentPrice)}</td>
                            <td className="numeric-cell" style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{formatRupee(val)}</td>
                            <td>
                              {s.nomineeName ? (
                                <span style={{ color: 'var(--success)', fontSize: 'var(--font-sm)' }}>{s.nomineeName}</span>
                              ) : (
                                <span className="type-caption" style={{ color: 'var(--warning)', fontWeight: 'var(--fw-semibold)' }}>No Nominee Assigned</span>
                              )}
                            </td>
                            <td className="numeric-cell" style={{ fontWeight: 'var(--fw-semibold)', color: ret >= 0 ? 'var(--success)' : 'var(--error)' }}>
                              {formatRupee(ret)} <span className="type-caption" style={{ color: ret >= 0 ? 'var(--success)' : 'var(--error)', marginLeft: 'var(--spacing-02)' }}>({pct.toFixed(1)}%)</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 'var(--spacing-05)', justifyContent: 'center' }}>
                                <IconButton icon={<Edit2 size={13} />} label={`Edit ${s.symbol}`} onClick={() => handleEditStock(s)} />
                                <IconButton icon={<Trash2 size={13} />} variant="danger" label={`Delete ${s.symbol}`} onClick={() => handleDeleteStock(s.id)} />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="type-body-secondary" style={{ textAlign: 'center', padding: 'var(--spacing-2)' }}>
                          No direct stock holdings found. Click "Add Stock" to track equities and calculate real-time capital gains.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mutual Funds */}
            <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
              <PanelHeader
                icon={<TrendingUp size={16} />}
                title="Mutual Funds (Direct Growth)"
                action={
                  <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-075)', fontSize: 'var(--font-sm)' }} onClick={() => setShowAddMF(true)}>
                    <Plus size={14} /> Add Mutual Fund
                  </Button>
                }
              />

              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                    Mutual fund holdings with units, purchase and current NAV, value, nominee and returns
                  </caption>
                  <thead>
                    <tr>
                      <th>Scheme Name</th>
                      <th className="numeric-cell">Units</th>
                      <th className="numeric-cell">Purchase NAV</th>
                      <th className="numeric-cell">Current NAV</th>
                      <th className="numeric-cell">Current Value</th>
                      <th>Nominee</th>
                      <th className="numeric-cell">Returns</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mfs.length > 0 ? (
                      mfs.map((m) => {
                        const cost = m.units * m.averageNav;
                        const val = m.units * m.currentNav;
                        const ret = val - cost;
                        const pct = cost > 0 ? (ret / cost) * 100 : 0;
                        return (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{m.schemeName}</td>
                            <td className="numeric-cell">{m.units.toFixed(2)}</td>
                            <td className="numeric-cell">₹{m.averageNav.toFixed(2)}</td>
                            <td className="numeric-cell">₹{m.currentNav.toFixed(2)}</td>
                            <td className="numeric-cell" style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{formatRupee(val)}</td>
                            <td>
                              {m.nomineeName ? (
                                <span style={{ color: 'var(--success)', fontSize: 'var(--font-sm)' }}>{m.nomineeName}</span>
                              ) : (
                                <span className="type-caption" style={{ color: 'var(--warning)', fontWeight: 'var(--fw-semibold)' }}>No Nominee Assigned</span>
                              )}
                            </td>
                            <td className="numeric-cell" style={{ fontWeight: 'var(--fw-semibold)', color: ret >= 0 ? 'var(--success)' : 'var(--error)' }}>
                              {formatRupee(ret)} <span className="type-caption" style={{ color: ret >= 0 ? 'var(--success)' : 'var(--error)', marginLeft: 'var(--spacing-02)' }}>({pct.toFixed(1)}%)</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 'var(--spacing-05)', justifyContent: 'center' }}>
                                <IconButton icon={<Edit2 size={13} />} label={`Edit ${m.schemeName}`} onClick={() => handleEditMF(m)} />
                                <IconButton icon={<Trash2 size={13} />} variant="danger" label={`Delete ${m.schemeName}`} onClick={() => handleDeleteMF(m.id)} />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="type-body-secondary" style={{ textAlign: 'center', padding: 'var(--spacing-2)' }}>
                          No mutual fund folios found. Click "Add Mutual Fund" to track SIPs, step-ups, and NAV performance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other holdings grid */}
            <div className="card-grid responsive-stack" style={{ gridTemplateColumns: '1fr 1fr' }}>

              {/* Fixed Deposits & SGB Gold */}
              <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
                <PanelHeader
                title="Fixed Deposits & Gold Assets"
                action={
                  <div style={{ display: 'flex', gap: 'var(--spacing-05)' }}>
                    <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-06)', fontSize: 'var(--font-xs)' }} onClick={() => setShowAddFD(true)}>
                      + FD
                    </Button>
                    <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-06)', fontSize: 'var(--font-xs)' }} onClick={() => setShowAddGold(true)}>
                      + Gold
                    </Button>
                  </div>
                }
              />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', maxHeight: 'var(--chart-height-lg)', overflowY: 'auto' }}>
{fds.map((f) => (
                    <StatRow
                      key={f.id}
                      className="tabular-nums"
                      title={`${f.bankName} FD (${f.interestRate}% Int)`}
                      subtitle={`Matures: ${f.maturityDate}`}
                      value={formatRupee(calculateFdAccruedValue(f))}
                      valueTitle="Accrued value based on compounding interest"
                      change={`Principal: ${formatRupee(f.principalAmount)}`}
                      actions={
                        <>
                          <IconButton icon={<Edit2 size={12} />} label={`Edit ${f.bankName} FD`} onClick={() => handleEditFD(f)} />
                          <IconButton icon={<Trash2 size={12} />} variant="danger" label={`Delete ${f.bankName} FD`} onClick={() => handleDeleteFD(f.id)} />
                        </>
                      }
                    />
                  ))}

{gold.map((g) => (
                    <StatRow
                      key={g.id}
                      className="tabular-nums"
                      title={`Gold - ${g.type}`}
                      subtitle={`Qty: ${g.quantityGrams}g (Nominee: ${g.nomineeName || 'None'})`}
                      value={formatRupee(g.quantityGrams * g.currentPrice)}
                      change={`Gain: ${(((g.currentPrice - g.purchasePrice) / g.purchasePrice) * 100).toFixed(0)}%`}
                      actions={
                        <>
                          <IconButton icon={<Edit2 size={12} />} label={`Edit Gold - ${g.type}`} onClick={() => handleEditGold(g)} />
                          <IconButton icon={<Trash2 size={12} />} variant="danger" label={`Delete Gold - ${g.type}`} onClick={() => handleDeleteGold(g.id)} />
                        </>
                      }
                    />
                  ))}

                  {fds.length === 0 && gold.length === 0 && (
                    <EmptyState variant="dashed" size="sm" title="No FDs or gold assets" description="Add FDs or Gold to track guaranteed returns and commodity hedges." />
                  )}
                </div>
              </div>

              {/* Retirement Accounts */}
              <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
                <PanelHeader
                title="Government Pension & PPF/EPF"
                action={
                  <div style={{ display: 'flex', gap: 'var(--spacing-05)' }}>
                    <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-06)', fontSize: 'var(--font-xs)' }} onClick={() => setShowAddNPS(true)}>
                      + NPS
                    </Button>
                    <Button variant="secondary" style={{ padding: 'var(--spacing-04) var(--spacing-06)', fontSize: 'var(--font-xs)' }} onClick={() => setShowAddPF(true)}>
                      + PF
                    </Button>
                  </div>
                }
              />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', maxHeight: 'var(--chart-height-lg)', overflowY: 'auto' }}>
{nps.map((n) => (
                    <StatRow
                      key={n.id}
                      className="tabular-nums"
                      title="National Pension System (NPS)"
                      subtitle={`PRAN: ${n.pranNumber} (Nominee: ${n.nomineeName || 'None'})`}
                      value={formatRupee(n.balance)}
                      actions={
                        <>
                          <IconButton icon={<Edit2 size={12} />} label={`Edit NPS ${n.pranNumber}`} onClick={() => handleEditNPS(n)} />
                          <IconButton icon={<Trash2 size={12} />} variant="danger" label={`Delete NPS ${n.pranNumber}`} onClick={() => handleDeleteNPS(n.id)} />
                        </>
                      }
                    />
                  ))}

{pf.map((p) => (
                    <StatRow
                      key={p.id}
                      className="tabular-nums"
                      title={`Provident Fund (${p.type})`}
                      subtitle={`A/c: ${p.accountNumber}`}
                      value={formatRupee(p.balance)}
                      actions={
                        <>
                          <IconButton icon={<Edit2 size={12} />} label={`Edit Provident Fund (${p.type}) ${p.accountNumber}`} onClick={() => handleEditPF(p)} />
                          <IconButton icon={<Trash2 size={12} />} variant="danger" label={`Delete Provident Fund (${p.type}) ${p.accountNumber}`} onClick={() => handleDeletePF(p.id)} />
                        </>
                      }
                    />
                  ))}

                  {nps.length === 0 && pf.length === 0 && (
                    <EmptyState variant="dashed" size="sm" title="No retirement accounts" description="Link your NPS PRAN or EPF/PPF account to track long-term pension wealth." />
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: Rebalancing Suggestion */}
        {activeTab === 'rebalance' && (
          <div id="rebalance-panel" role="tabpanel" aria-labelledby="rebalance-tab" className="glass-panel animate-fade-in gap-stack-lg" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
            <PanelHeader icon={<Sliders size={16} />} title="Target Asset Allocation Rebalancer" />
            <p className="type-body-secondary" style={{ marginBottom: 'var(--spacing-15)', maxWidth: '75ch' }}>
              Adjust your target percentages below. We will calculate the target rupees and suggest purchase/sale triggers to return to your targets.
            </p>

            <FormRow columns="1fr 2fr" gap="var(--spacing-25)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                <div style={{ marginBottom: 'var(--spacing-025)' }}>
                  <span className="uppercase-label" style={{ display: 'block', marginBottom: 'var(--spacing-04)' }}>
                    Allocation Models:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-04)' }}>
                    <Button
                      type="button"
                      variant="secondary"
                      className="type-badge"
                      style={{ padding: 'var(--spacing-02) var(--spacing-075)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 'var(--fw-medium)' }}
                      onClick={() => { setTargetEquity(70); setTargetDebt(20); setTargetGold(10); }}
                    >
                      Aggressive (70/20/10)
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="type-badge"
                      style={{ padding: 'var(--spacing-02) var(--spacing-075)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 'var(--fw-medium)' }}
                      onClick={() => { setTargetEquity(50); setTargetDebt(30); setTargetGold(20); }}
                    >
                      Balanced (50/30/20)
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="type-badge"
                      style={{ padding: 'var(--spacing-02) var(--spacing-075)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 'var(--fw-medium)' }}
                      onClick={() => { setTargetEquity(30); setTargetDebt(60); setTargetGold(10); }}
                    >
                      Conservative (30/60/10)
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="type-badge"
                      style={{ padding: 'var(--spacing-02) var(--spacing-075)', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 'var(--fw-medium)' }}
                      onClick={() => { setTargetEquity(40); setTargetDebt(40); setTargetGold(20); }}
                    >
                      All-Weather (40/40/20)
                    </Button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Equity Target (%)</label>
                  <input type="number" className="form-input tabular-nums" value={targetEquity} onChange={(e) => setTargetEquity(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Debt Target (%)</label>
                  <input type="number" className="form-input tabular-nums" value={targetDebt} onChange={(e) => setTargetDebt(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gold Target (%)</label>
                  <input type="number" className="form-input tabular-nums" value={targetGold} onChange={(e) => setTargetGold(parseInt(e.target.value) || 0)} />
                </div>
                {targetEquity + targetDebt + targetGold !== 100 && (
                  <div className="type-caption tabular-nums" style={{ color: 'var(--error)', fontWeight: 'var(--fw-semibold)' }}>
                    ⚠️ Sum of targets must equal 100% (Current: {targetEquity + targetDebt + targetGold}%)
                  </div>
                )}
              </div>

              <div>
                <div className="table-responsive">
                  <table className="custom-table" style={{ marginBottom: 'var(--spacing-15)', minWidth: '520px' }}>
                    <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1 }}>
                      Current versus target allocation per asset class with the rupee action required to rebalance
                    </caption>
                    <thead>
                      <tr>
                        <th>Asset Class</th>
                        <th className="numeric-cell">Current Allocation</th>
                        <th className="numeric-cell">Target Allocation</th>
                        <th className="numeric-cell">Action Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rebalanceData.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{row.name}</td>
                          <td className="numeric-cell">{row.actualPct.toFixed(1)}%</td>
                          <td className="numeric-cell">{row.targetPct}%</td>
                          <td className="numeric-cell" style={{
                            fontWeight: 'var(--fw-bold)',
                            color: row.deviation >= 0 ? 'var(--success)' : 'var(--error)'
                          }}>
                            {row.deviation >= 0
                              ? `Buy: ${formatRupee(row.deviation)}`
                              : `Sell: ${formatRupee(Math.abs(row.deviation))}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <InfoCallout variant="info" title="Rebalancing Summary:">
                  Market shifts cause portfolios to drift.
                  Consider buying/selling the listed quantities to ensure alignment with your custom risk tolerance.
                </InfoCallout>
              </div>
            </FormRow>
          </div>
        )}

        {/* Tab: Monte Carlo Simulator */}
        {activeTab === 'sim' && (
          <div id="sim-panel" role="tabpanel" aria-labelledby="sim-tab" className="glass-panel animate-fade-in gap-stack-lg" data-interactive-card="off" style={{ padding: 'var(--spacing-15)' }}>
            <PanelHeader icon={<BarChart2 size={16} />} title="Monte Carlo Retirement Projection Engine" />
            <p className="type-body-secondary" style={{ marginBottom: 'var(--spacing-15)', maxWidth: '75ch' }}>
              Simulate portfolio growth over time factoring in return volatility, inflation, and regular contributions. Displays outcome ranges in today's purchasing value.
            </p>

            <div className="card-grid responsive-stack" style={{ gridTemplateColumns: '1fr 2.5fr', gap: 'var(--spacing-2)' }}>
              <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
                <h5 className="type-section-title" style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--spacing-025)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-04)', letterSpacing: '-0.01em' }}>
                  Simulation Inputs
                </h5>
                <div className="type-body" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Current Net Worth: <strong className="type-metric-sm" style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{formatRupee(totalPortfolioVal)}</strong>
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--spacing-05)' }}>
                  <label htmlFor="mc-horizon-years" className="form-label">Horizon (Years)</label>
                  <input id="mc-horizon-years" type="number" className="form-input tabular-nums" style={{ padding: 'var(--spacing-05)' }} value={horizonYears} onChange={(e) => setHorizonYears(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--spacing-05)' }}>
                  <label htmlFor="mc-monthly-saving" className="form-label">Monthly Saving (₹)</label>
                  <CurrencyInput id="mc-monthly-saving" className="form-input tabular-nums" style={{ padding: 'var(--spacing-05)' }} value={monthlyContribution} onChange={(e) => setMonthlyContribution(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--spacing-05)' }}>
                  <label htmlFor="mc-expected-return" className="form-label">Expected Return (% p.a.)</label>
                  <input id="mc-expected-return" type="number" className="form-input tabular-nums" style={{ padding: 'var(--spacing-05)' }} value={expectedReturn} onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--spacing-05)' }}>
                  <label htmlFor="mc-inflation-rate" className="form-label">Indian Inflation (% p.a.)</label>
                  <input id="mc-inflation-rate" type="number" className="form-input tabular-nums" style={{ padding: 'var(--spacing-05)' }} value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--spacing-05)' }}>
                  <label htmlFor="mc-volatility" className="form-label">Portfolio Volatility (% StdDev)</label>
                  <input id="mc-volatility" type="number" className="form-input tabular-nums" style={{ padding: 'var(--spacing-05)' }} value={volatility} onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)} />
                </div>
                <Button variant="primary" style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)' }} onClick={runMonteCarloSimulation}>
                  <Play size={14} /> Run Simulation
                </Button>
              </div>

              <div className="glass-panel" data-interactive-card="off" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', padding: 'var(--spacing-125)', boxShadow: 'var(--neo-raised-md)' }}>
                {simResults.length > 0 ? (
                  <>
                    <h5 className="type-section-title" style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--spacing-1)', color: 'var(--text-secondary)' }}>
                      Projected Purchasing Power over time (adjusted for inflation)
                    </h5>
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <div style={{ minWidth: '320px', height: 'var(--chart-height-md)' }}>
                        <ResponsiveContainer>
                          <AreaChart data={simResults}>
                            <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} fontFamily="var(--font-body)" tickLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} fontFamily="var(--font-body)" tickLine={false} tickFormatter={(v) => `${(v / 10000000).toFixed(1)}Cr`} />
                            <Tooltip
                              formatter={(v) => formatRupee(Number(v))}
                              contentStyle={chartTooltipStyle}
                              itemStyle={chartTooltipItemStyle}
                            />
                            <Legend wrapperStyle={{ fontSize: 'var(--font-xs)', fontFamily: 'var(--font-body)' }} />
                            <Area type="monotone" dataKey="BestCase" stroke="var(--success)" fill="var(--success)" fillOpacity={0.08} name="Optimistic (90th Pct)" />
                            <Area type="monotone" dataKey="Expected" stroke="var(--accent-1)" fill="var(--accent-1)" fillOpacity={0.12} name="Median (50th Pct)" />
                            <Area type="monotone" dataKey="WorstCase" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.08} name="Conservative (10th Pct)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <InfoCallout variant="info" title="Simulation Report:" style={{ marginTop: 'var(--spacing-1)' }}>
                      In 50% of trials (Median), your portfolio values grow to <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatRupee(simResults[simResults.length - 1].Expected)}</strong>.
                      In poor market conditions (10th percentile), it reaches <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatRupee(simResults[simResults.length - 1].WorstCase)}</strong>.
                    </InfoCallout>
                  </>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-2)', color: 'var(--text-muted)'
                  }}>
                    <Play size={32} style={{ marginBottom: 'var(--spacing-05)', opacity: 0.5 }} />
                    <span className="type-body-secondary">Configure parameters and click "Run Simulation" to generate paths</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dialog: Add Stock */}
        <Modal isOpen={showAddStock} onClose={() => { setShowAddStock(false); setEditStockId(null); }} title={editStockId ? 'Edit Stock Position' : 'Add Stock Position'} size="sm">
          <form onSubmit={handleAddStock}>
            <FormField label="Ticker Symbol">
              <input type="text" className="form-input" value={stkSymbol} onChange={(e) => setStkSymbol(e.target.value)} placeholder="e.g. RELIANCE" required aria-required="true" />
            </FormField>
            <FormField label="Company Name">
              <input type="text" className="form-input" value={stkName} onChange={(e) => setStkName(e.target.value)} placeholder="e.g. Reliance Industries" />
            </FormField>
            <FormRow>
              <FormField label="Quantity">
                <input type="number" step="1" min="1" className="form-input tabular-nums" value={stkQty} onChange={(e) => setStkQty(e.target.value)} placeholder="0" required aria-required="true" />
              </FormField>
              <FormField label="Avg Purchase Cost (₹)">
                <CurrencyInput className="form-input tabular-nums" value={stkAvgPrice} onChange={(e) => setStkAvgPrice(e.target.value)} placeholder="0.00" required aria-required="true" />
              </FormField>
            </FormRow>
            <FormField label="Current Market Price (₹)">
              <CurrencyInput className="form-input tabular-nums" value={stkCurrentPrice} onChange={(e) => setStkCurrentPrice(e.target.value)} placeholder="Leave blank to use purchase price" />
            </FormField>
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={stkNominee} onChange={(e) => setStkNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              divided
              onCancel={() => { setShowAddStock(false); setEditStockId(null); }}
              submitLabel={editStockId ? 'Save Stock Position' : 'Add Stock Position'}
            />
          </form>
        </Modal>

        {/* Dialog: Add Mutual Fund */}
        <Modal isOpen={showAddMF} onClose={() => { setShowAddMF(false); setEditMFId(null); }} title={editMFId ? 'Edit Mutual Fund' : 'Add Mutual Fund'} size="sm">
          <form onSubmit={handleAddMF}>
            <FormField label="Scheme Name">
              <input type="text" className="form-input" value={mfSchemeName} onChange={(e) => setMfSchemeName(e.target.value)} placeholder="e.g. Parag Parikh Flexi Cap" required aria-required="true" />
            </FormField>
            <FormRow>
              <FormField label="Units Purchased">
                <input type="number" step="any" className="form-input tabular-nums" value={mfUnits} onChange={(e) => setMfUnits(e.target.value)} placeholder="0.000" required aria-required="true" />
              </FormField>
              <FormField label="Avg Buy NAV (₹)">
                <CurrencyInput className="form-input tabular-nums" value={mfAvgNav} onChange={(e) => setMfAvgNav(e.target.value)} placeholder="0.00" required aria-required="true" />
              </FormField>
            </FormRow>
            <FormField label="Current NAV (₹)">
              <CurrencyInput className="form-input tabular-nums" value={mfCurrentNav} onChange={(e) => setMfCurrentNav(e.target.value)} placeholder="Leave blank to use buy NAV" />
            </FormField>
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={mfNominee} onChange={(e) => setMfNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', margin: 'var(--spacing-1) 0' }}>
              <input type="checkbox" checked={mfAutoSIP} onChange={(e) => setMfAutoSIP(e.target.checked)} id="mfSipCheck" />
              <label htmlFor="mfSipCheck" className="type-label" style={{ cursor: 'pointer', fontWeight: 'var(--fw-semibold)', color: 'var(--accent-1)' }}>Auto-Setup Step-Up SIP (Backfills past data)</label>
            </div>

            {mfAutoSIP && (
              <div style={{ background: 'var(--surface-faint)', padding: 'var(--spacing-1)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', marginBottom: 'var(--spacing-1)' }}>
                <FormRow>
                  <FormField label="Monthly SIP Amount (₹)" style={{ margin: 0 }}>
                    <CurrencyInput className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={mfSIPAmount} onChange={(e) => setMfSIPAmount(e.target.value)} required={mfAutoSIP} aria-required={mfAutoSIP} />
                  </FormField>
                  <FormField label="Source Bank Account" style={{ margin: 0 }}>
                    <select className="form-input" style={{ padding: 'var(--spacing-04)' }} value={mfSIPAccount} onChange={(e) => setMfSIPAccount(e.target.value)} required={mfAutoSIP} aria-required={mfAutoSIP}>
                      <option value="">-- Select --</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </FormField>
                </FormRow>
                <FormRow style={{ marginTop: 'var(--spacing-075)' }}>
                  <FormField label="SIP Start Date" style={{ margin: 0 }}>
                    <input type="date" className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={mfSIPStartDate} onChange={(e) => setMfSIPStartDate(e.target.value)} required={mfAutoSIP} aria-required={mfAutoSIP} />
                  </FormField>
                  <FormField hint="e.g. 10" style={{ margin: 0 }}>
                    <Slider
                      label="Annual Step-Up (%)"
                      value={parseFloat(mfSIPStepUp) || 0}
                      onChange={(v) => setMfSIPStepUp(v ? String(v) : '')}
                      min={0}
                      max={25}
                      step={1}
                      suffix="%"
                      editable
                      inputWidth={44}
                    />
                  </FormField>
                </FormRow>
              </div>
            )}

            <FormActions
              divided
              onCancel={() => { setShowAddMF(false); setEditMFId(null); }}
              submitLabel={editMFId ? 'Save Mutual Fund' : 'Add Mutual Fund'}
            />
          </form>
        </Modal>

        {/* Dialog: Add FD */}
        <Modal isOpen={showAddFD} onClose={() => { setShowAddFD(false); setEditFDId(null); }} title={editFDId ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'} size="sm">
          <form onSubmit={handleAddFD}>
            <FormField label="Bank Institution">
              <input type="text" className="form-input" value={fdBankName} onChange={(e) => setFdBankName(e.target.value)} placeholder="e.g. State Bank of India, HDFC Bank" required aria-required="true" />
            </FormField>
            <FormRow columns="1.2fr 1fr">
              <FormField label="Principal Amount (₹)">
                <CurrencyInput className="form-input tabular-nums" value={fdPrincipal} onChange={(e) => setFdPrincipal(e.target.value)} placeholder="0.00" required aria-required="true" />
              </FormField>
              <FormField label="Interest Rate (% p.a.)">
                <input type="number" step="any" className="form-input tabular-nums" value={fdInterestRate} onChange={(e) => setFdInterestRate(e.target.value)} placeholder="6.5" required aria-required="true" />
              </FormField>
            </FormRow>
            <FormRow>
              <FormField label="Start Date">
                <input type="date" className="form-input tabular-nums" value={fdStartDate} onChange={(e) => setFdStartDate(e.target.value)} required aria-required="true" />
              </FormField>
              <FormField label="Maturity Date">
                <input type="date" className="form-input tabular-nums" value={fdMaturityDate} onChange={(e) => setFdMaturityDate(e.target.value)} required aria-required="true" />
              </FormField>
            </FormRow>
            <FormField label="Maturity Amount (₹)">
              <CurrencyInput className="form-input tabular-nums" value={fdMaturityAmount} onChange={(e) => setFdMaturityAmount(e.target.value)} placeholder="Auto-calculated if left blank" />
            </FormField>
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={fdNominee} onChange={(e) => setFdNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              divided
              onCancel={() => { setShowAddFD(false); setEditFDId(null); }}
              submitLabel={editFDId ? 'Save Fixed Deposit' : 'Add Fixed Deposit'}
            />
          </form>
        </Modal>

        {/* Dialog: Add Gold */}
        <Modal isOpen={showAddGold} onClose={() => { setShowAddGold(false); setEditGoldId(null); }} title={editGoldId ? 'Edit Gold Holding' : 'Add Gold Holding'} size="sm">
          <form onSubmit={handleAddGold}>
            <FormField label="Gold Type">
              <select value={gldType} onChange={(e) => setGldType(e.target.value as 'Physical' | 'SGB' | 'Digital')}>
                <option value="Physical">Physical Gold (Bars / Coins / Jewelry)</option>
                <option value="SGB">Sovereign Gold Bonds (SGB)</option>
                <option value="Digital">Digital Gold (MMTC / Augmont)</option>
              </select>
            </FormField>
            <FormRow>
              <FormField label="Quantity (Grams)">
                <input type="number" step="any" className="form-input tabular-nums" value={gldQty} onChange={(e) => setGldQty(e.target.value)} placeholder="0.0" required aria-required="true" />
              </FormField>
              <FormField label="Purchase Price (per g)">
                <CurrencyInput className="form-input tabular-nums" value={gldBuyPrice} onChange={(e) => setGldBuyPrice(e.target.value)} placeholder="e.g. 6200" required aria-required="true" />
              </FormField>
            </FormRow>
            <FormField label="Current Market Price (per g)">
              <CurrencyInput className="form-input tabular-nums" value={gldCurrentPrice} onChange={(e) => setGldCurrentPrice(e.target.value)} placeholder="Leave blank to use buy price" />
            </FormField>
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={gldNominee} onChange={(e) => setGldNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              divided
              onCancel={() => { setShowAddGold(false); setEditGoldId(null); }}
              submitLabel={editGoldId ? 'Save Gold Holding' : 'Add Gold Holding'}
            />
          </form>
        </Modal>

        {/* Dialog: Add NPS */}
        <Modal isOpen={showAddNPS} onClose={() => { setShowAddNPS(false); setEditNPSId(null); }} title={editNPSId ? 'Edit NPS Account' : 'Add NPS Account'} size="sm">
          <form onSubmit={handleAddNPS}>
            <FormField label="PRAN (Permanent Retirement Account Number)">
              <input type="text" className="form-input tabular-nums" value={npsPran} onChange={(e) => setNpsPran(e.target.value)} placeholder="12-digit PRAN number" />
            </FormField>
            <FormField label="Total Balance (₹)">
              <CurrencyInput className="form-input tabular-nums" value={npsBalance} onChange={(e) => setNpsBalance(e.target.value)} placeholder="Current portfolio value" required aria-required="true" />
            </FormField>
            <FormRow columns={4} gap="var(--spacing-05)">
              <FormField label="Equity (E %)" style={{ margin: 0 }}>
                <input type="number" min="0" max="100" className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={npsE} onChange={(e) => setNpsE(e.target.value)} />
              </FormField>
              <FormField label="Corp (C %)" style={{ margin: 0 }}>
                <input type="number" min="0" max="100" className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={npsC} onChange={(e) => setNpsC(e.target.value)} />
              </FormField>
              <FormField label="Govt (G %)" style={{ margin: 0 }}>
                <input type="number" min="0" max="100" className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={npsG} onChange={(e) => setNpsG(e.target.value)} />
              </FormField>
              <FormField label="Alt (A %)" style={{ margin: 0 }}>
                <input type="number" min="0" max="100" className="form-input tabular-nums" style={{ padding: 'var(--spacing-04)' }} value={npsA} onChange={(e) => setNpsA(e.target.value)} />
              </FormField>
            </FormRow>
            {((parseInt(npsE) || 0) + (parseInt(npsC) || 0) + (parseInt(npsG) || 0) + (parseInt(npsA) || 0)) !== 100 && (
              <div className="type-caption tabular-nums" style={{ color: 'var(--error)', fontWeight: 'var(--fw-semibold)', marginTop: 'calc(var(--spacing-025) * -1)', marginBottom: 'var(--spacing-05)' }}>
                ⚠️ Tier-1 asset allocations must total exactly 100% (Current total: {(parseInt(npsE) || 0) + (parseInt(npsC) || 0) + (parseInt(npsG) || 0) + (parseInt(npsA) || 0)}%)
              </div>
            )}
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={npsNominee} onChange={(e) => setNpsNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              divided
              onCancel={() => { setShowAddNPS(false); setEditNPSId(null); }}
              submitLabel={editNPSId ? 'Save NPS Account' : 'Add NPS Account'}
            />
          </form>
        </Modal>

        {/* Dialog: Add PF */}
        <Modal isOpen={showAddPF} onClose={() => { setShowAddPF(false); setEditPFId(null); }} title={editPFId ? 'Edit Provident Fund' : 'Add Provident Fund'} size="sm">
          <form onSubmit={handleAddPF}>
            <FormField label="Fund Type">
              <select value={pfType} onChange={(e) => setPfType(e.target.value as 'EPF' | 'PPF')}>
                <option value="EPF">Employee Provident Fund (EPF / VPF)</option>
                <option value="PPF">Public Provident Fund (PPF)</option>
              </select>
            </FormField>
            <FormField label="Account Number">
              <input type="text" className="form-input" value={pfAccNum} onChange={(e) => setPfAccNum(e.target.value)} placeholder="EPF Member ID or PPF Account Number" />
            </FormField>
            <FormRow columns="1.2fr 1fr">
              <FormField label="Current Balance (₹)">
                <CurrencyInput className="form-input tabular-nums" value={pfBalance} onChange={(e) => setPfBalance(e.target.value)} placeholder="0.00" required aria-required="true" />
              </FormField>
              <FormField label="Yearly Contribution (₹)">
                <CurrencyInput className="form-input tabular-nums" value={pfContrib} onChange={(e) => setPfContrib(e.target.value)} placeholder="0.00" />
              </FormField>
            </FormRow>
            <FormField label="Nominee Name">
              <input type="text" className="form-input" value={pfNominee} onChange={(e) => setPfNominee(e.target.value)} placeholder="Registered nominee" />
            </FormField>
            <FormActions
              divided
              onCancel={() => { setShowAddPF(false); setEditPFId(null); }}
              submitLabel={editPFId ? 'Save PF Account' : 'Add Provident Fund'}
            />
          </form>
        </Modal>

      </div>
    </>
  );
};
