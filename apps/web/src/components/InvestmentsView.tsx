import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '@financeos/database';
import { 
  TrendingUp, BarChart2, DollarSign, Award, Percent, 
  HelpCircle, RefreshCw, Layers, Sliders, Play, Trash2, Plus, Edit2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, AreaChart, Area 
} from 'recharts';
import { 
  FixedDeposit, StockHolding, MutualFundHolding, GoldHolding, 
  NPSHolding, ProvidentFundHolding, BankAccount 
} from '@financeos/shared';
import { formatRupee } from '../utils/currency.js';
import { CurrencyInput } from './ui/CurrencyInput.js';

// --- Cryptographically robust XIRR Bisection Solver ---
interface CashFlow {
  date: Date;
  amount: number;
}

const parseDate = (dStr: string) => new Date(dStr);

const calculateNPV = (rate: number, cashFlows: CashFlow[]): number => {
  const t0 = cashFlows[0].date.getTime();
  let npv = 0;
  for (const cf of cashFlows) {
    const years = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * 365.25);
    npv += cf.amount / Math.pow(1 + rate, years);
  }
  return npv;
};

const solveXIRR = (cashFlows: CashFlow[]): number => {
  if (cashFlows.length < 2) return 0;
  
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let low = -0.99;
  let high = 2.0;
  let mid = 0;
  
  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const npv = calculateNPV(mid, sorted);
    if (Math.abs(npv) < 1e-4) return mid;
    
    if (npv > 0) {
      if (sorted[0].amount < 0) low = mid;
      else high = mid;
    } else {
      if (sorted[0].amount < 0) high = mid;
      else low = mid;
    }
  }
  return mid;
};

const calculateFdAccruedValue = (fd: FixedDeposit): number => {
  const now = new Date('2026-07-16'); // App's active date context
  const start = new Date(fd.startDate);
  const maturity = new Date(fd.maturityDate);

  if (now <= start) return fd.principalAmount;
  if (now >= maturity) return fd.maturityAmount;

  // Quarterly compounding (n = 4)
  const rate = fd.interestRate / 100;
  const daysTotal = (maturity.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysTotal <= 0 || daysElapsed <= 0) return fd.principalAmount;

  // Compounded quarterly: A = P * (1 + r/4) ^ (4 * years)
  const years = daysElapsed / 365.25;
  const accrued = fd.principalAmount * Math.pow(1 + rate / 4, 4 * years);
  
  return Math.min(fd.maturityAmount, Math.round(accrued));
};

interface InvestmentsViewProps {
  activeProfileId: string;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({ activeProfileId }) => {
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
  const [fdMaturityDate, setFdMaturityDate] = useState(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
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
  const [simResults, setSimResults] = useState<any[]>([]);

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

  useEffect(() => {
    refreshData();
  }, [activeProfileId]);

  // Computations
  const stockVal = useMemo(() => stocks.reduce((sum: number, s: any) => sum + (s.quantity * s.currentPrice), 0), [stocks]);
  const stockCost = useMemo(() => stocks.reduce((sum: number, s: any) => sum + (s.quantity * s.averagePrice), 0), [stocks]);

  const mfVal = useMemo(() => mfs.reduce((sum: number, m: any) => sum + (m.units * m.currentNav), 0), [mfs]);
  const mfCost = useMemo(() => mfs.reduce((sum: number, m: any) => sum + (m.units * m.averageNav), 0), [mfs]);

  const goldVal = useMemo(() => gold.reduce((sum: number, g: any) => sum + (g.quantityGrams * g.currentPrice), 0), [gold]);
  const goldCost = useMemo(() => gold.reduce((sum: number, g: any) => sum + (g.quantityGrams * g.purchasePrice), 0), [gold]);

  const npsVal = useMemo(() => nps.reduce((sum: number, n: any) => sum + n.balance, 0), [nps]);
  const pfVal = useMemo(() => pf.reduce((sum: number, p: any) => sum + p.balance, 0), [pf]);
  const fdVal = useMemo(() => fds.filter((f: any) => !f.isMatured).reduce((sum: number, f: any) => sum + calculateFdAccruedValue(f), 0), [fds]);

  const totalPortfolioVal = stockVal + mfVal + goldVal + npsVal + pfVal + fdVal;
  const investedCost = stockCost + mfCost + goldCost + npsVal + pfVal + fdVal;
  const netReturns = totalPortfolioVal - investedCost;
  const returnPct = investedCost > 0 ? (netReturns / investedCost) * 100 : 0;

  const calculatedXIRR = useMemo(() => {
    if (investedCost === 0) return 0;
    const flows: CashFlow[] = [
      { date: parseDate('2024-07-15'), amount: -investedCost },
      { date: new Date(), amount: totalPortfolioVal }
    ];
    return solveXIRR(flows) * 100;
  }, [investedCost, totalPortfolioVal]);

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
    if (confirm('Delete this stock holding?')) {
      await dbService.deleteStock(id); refreshData();
    }
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
    if (confirm('Delete this Mutual Fund holding?')) {
      await dbService.deleteMutualFund(id); refreshData();
    }
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
    const maturity = parseFloat(fdMaturityAmount) || principal * Math.pow(1 + (rate/100), 1);
    
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
    if (confirm('Delete this FD?')) {
      await dbService.deleteFD(id); refreshData();
    }
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
    if (confirm('Delete this gold asset?')) {
      await dbService.deleteGold(id); refreshData();
    }
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
    if (confirm('Delete this NPS record?')) {
      await dbService.deleteNPS(id); refreshData();
    }
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
    if (confirm('Delete this PF account?')) {
      await dbService.deletePF(id); refreshData();
    }
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

    const formattedData = [];
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



  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Portfolio Value Summary Header */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, hsla(224, 25%, 10%, 0.6) 0%, hsla(224, 30%, 6%, 0.4) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PORTFOLIO VALUATION</span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-1)' }}>{formatRupee(totalPortfolioVal)}</h2>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INVESTED COST</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{formatRupee(investedCost)}</h3>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RETURNS (GAIN)</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: netReturns >= 0 ? 'var(--success)' : 'var(--error)' }}>
              {formatRupee(netReturns)} ({returnPct.toFixed(1)}%)
            </h3>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              XIRR (ANNUALIZED) <span title="Internal Rate of Return computed via Bisection method."><HelpCircle size={12} color="var(--text-muted)" /></span>
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--accent-2)' }}>{calculatedXIRR.toFixed(2)}%</h3>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === 'holdings' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveTab('holdings')}>
          Asset Holdings
        </button>
        <button className={`btn ${activeTab === 'rebalance' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveTab('rebalance')}>
          Portfolio Rebalancing
        </button>
        <button className={`btn ${activeTab === 'sim' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveTab('sim')}>
          Retirement Simulator (Monte Carlo)
        </button>
      </div>

      {/* Tab: Holdings View */}
      {activeTab === 'holdings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Stocks */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="var(--accent-1)" /> Direct Equity Stocks
              </h4>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowAddStock(true)}>
                <Plus size={14} /> Add Stock
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company Name</th>
                    <th>Qty</th>
                    <th>Avg Cost</th>
                    <th>Current NAV</th>
                    <th>Current Value</th>
                    <th>Nominee</th>
                    <th>Returns</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.length > 0 ? (
                    stocks.map((s: any) => {
                      const cost = s.quantity * s.averagePrice;
                      const val = s.quantity * s.currentPrice;
                      const ret = val - cost;
                      const pct = cost > 0 ? (ret / cost) * 100 : 0;
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 650 }}>{s.symbol}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.name}</td>
                          <td>{s.quantity}</td>
                          <td>{formatRupee(s.averagePrice)}</td>
                          <td>{formatRupee(s.currentPrice)}</td>
                          <td style={{ fontWeight: 600 }}>{formatRupee(val)}</td>
                          <td>
                            {s.nomineeName ? (
                              <span style={{ color: 'var(--success)' }}>{s.nomineeName}</span>
                            ) : (
                              <span style={{ color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600 }}>Missing Nominee</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: ret >= 0 ? 'var(--success)' : 'var(--error)' }}>
                            {formatRupee(ret)} ({pct.toFixed(1)}%)
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleEditStock(s)}>
                                <Edit2 size={13} />
                              </button>
                              <button className="btn btn-danger" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleDeleteStock(s.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No direct stock holdings linked. Click "Add Stock" to input logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mutual Funds */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={16} color="var(--accent-2)" /> Mutual Funds (Direct Growth)
              </h4>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowAddMF(true)}>
                <Plus size={14} /> Add Mutual Fund
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Scheme Name</th>
                    <th>Units</th>
                    <th>Purchase NAV</th>
                    <th>Current NAV</th>
                    <th>Current Value</th>
                    <th>Nominee</th>
                    <th>Returns</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mfs.length > 0 ? (
                    mfs.map((m: any) => {
                      const cost = m.units * m.averageNav;
                      const val = m.units * m.currentNav;
                      const ret = val - cost;
                      const pct = cost > 0 ? (ret / cost) * 100 : 0;
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600 }}>{m.schemeName}</td>
                          <td>{m.units.toFixed(2)}</td>
                          <td>₹{m.averageNav.toFixed(2)}</td>
                          <td>₹{m.currentNav.toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>{formatRupee(val)}</td>
                          <td>
                            {m.nomineeName ? (
                              <span style={{ color: 'var(--success)' }}>{m.nomineeName}</span>
                            ) : (
                              <span style={{ color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600 }}>Missing Nominee</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: ret >= 0 ? 'var(--success)' : 'var(--error)' }}>
                            {formatRupee(ret)} ({pct.toFixed(1)}%)
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleEditMF(m)}>
                                <Edit2 size={13} />
                              </button>
                              <button className="btn btn-danger" style={{ padding: '0.3rem', borderRadius: '4px' }} onClick={() => handleDeleteMF(m.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No mutual fund SIPs configured. Click "Add Mutual Fund" to track schemes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other holdings grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="responsive-stack">
            
            {/* Fixed Deposits & SGB Gold */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem' }}>Fixed Deposits & Gold Assets</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowAddFD(true)}>
                    + FD
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowAddGold(true)}>
                    + Gold
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {fds.map((f: any) => (
                  <div key={f.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{f.bankName} FD ({f.interestRate}% Int)</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Matures: {f.maturityDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }} title="Accrued value based on compounding interest">{formatRupee(calculateFdAccruedValue(f))}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Principal: {formatRupee(f.principalAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleEditFD(f)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeleteFD(f.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {gold.map((g: any) => (
                  <div key={g.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Gold - {g.type}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Qty: {g.quantityGrams}g (Nominee: {g.nomineeName || 'None'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>{formatRupee(g.quantityGrams * g.currentPrice)}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Gain: {(((g.currentPrice - g.purchasePrice) / g.purchasePrice) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleEditGold(g)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeleteGold(g.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {fds.length === 0 && gold.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                    No FD or Gold logs listed.
                  </div>
                )}
              </div>
            </div>

            {/* Retirement Accounts */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem' }}>Government Pension & PPF/EPF</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowAddNPS(true)}>
                    + NPS
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowAddPF(true)}>
                    + PF
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {nps.map((n: any) => (
                  <div key={n.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>National Pension System (NPS)</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PRAN: {n.pranNumber} (Nominee: {n.nomineeName || 'None'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{formatRupee(n.balance)}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleEditNPS(n)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeleteNPS(n.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {pf.map((p: any) => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Provident Fund ({p.type})</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>A/c: {p.accountNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{formatRupee(p.balance)}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleEditPF(p)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleDeletePF(p.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {nps.length === 0 && pf.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                    No retirement pension logs listed.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Rebalancing Suggestion */}
      {activeTab === 'rebalance' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={16} color="var(--accent-1)" /> Target Asset Allocation Rebalancer
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Adjust your target percentages below. We will calculate the target rupees and suggest purchase/sale triggers to return to your targets.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }} className="responsive-stack">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Equity Target (%)</label>
                <input type="number" className="form-input" value={targetEquity} onChange={(e) => setTargetEquity(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Debt Target (%)</label>
                <input type="number" className="form-input" value={targetDebt} onChange={(e) => setTargetDebt(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gold Target (%)</label>
                <input type="number" className="form-input" value={targetGold} onChange={(e) => setTargetGold(parseInt(e.target.value) || 0)} />
              </div>
              {targetEquity + targetDebt + targetGold !== 100 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--error)', fontWeight: 600 }}>
                  ⚠️ Sum of targets must equal 100% (Current: {targetEquity + targetDebt + targetGold}%)
                </div>
              )}
            </div>

            <div>
              <table className="custom-table" style={{ marginBottom: '1.5rem' }}>
                <thead>
                  <tr>
                    <th>Asset Class</th>
                    <th>Current Allocation</th>
                    <th>Target Allocation</th>
                    <th>Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {rebalanceData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.name}</td>
                      <td>{row.actualPct.toFixed(1)}%</td>
                      <td>{row.targetPct}%</td>
                      <td style={{
                        fontWeight: 650, 
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
              
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)',
                padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem'
              }}>
                <strong>Rebalancing Summary:</strong> Market shifts cause portfolios to drift. 
                Consider buying/selling the listed quantities to ensure alignment with your custom risk tolerance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Monte Carlo Simulator */}
      {activeTab === 'sim' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart2 size={16} color="var(--accent-2)" /> Monte Carlo Retirement Projection Engine
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Simulate portfolio growth over time factoring in return volatility, inflation, and regular contributions. Displays outcome ranges in today's purchasing value.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }} className="responsive-stack">
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h5 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>Simulation Inputs</h5>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Current Net Worth: <strong>{formatRupee(totalPortfolioVal)}</strong>
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Horizon (Years)</label>
                <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={horizonYears} onChange={(e) => setHorizonYears(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Monthly Saving (₹)</label>
                <CurrencyInput className="form-input" style={{ padding: '0.4rem' }} value={monthlyContribution} onChange={(e) => setMonthlyContribution(parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Expected Return (% p.a.)</label>
                <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={expectedReturn} onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Indian Inflation (% p.a.)</label>
                <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Portfolio Volatility (% StdDev)</label>
                <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={volatility} onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)} />
              </div>
              <button className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.85rem' }} onClick={runMonteCarloSimulation}>
                <Play size={14} /> Run Simulation
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
              {simResults.length > 0 ? (
                <>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Projected Purchasing Power over time (adjusted for inflation)</h5>
                  <div style={{ width: '100%', height: '280px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={simResults}>
                        <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} tickFormatter={(v) => `${(v/10000000).toFixed(1)}Cr`} />
                        <Tooltip 
                          formatter={(v: any) => formatRupee(v)}
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="BestCase" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.05} name="Optimistic (90th Pct)" />
                        <Area type="monotone" dataKey="Expected" stroke="var(--accent-1)" fill="var(--accent-1)" fillOpacity={0.1} name="Median (50th Pct)" />
                        <Area type="monotone" dataKey="WorstCase" stroke="var(--error)" fill="var(--error)" fillOpacity={0.05} name="Conservative (10th Pct)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{
                    marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)'
                  }}>
                    <strong>Simulation Report:</strong> In 50% of trials (Median), your portfolio values grow to <strong>{formatRupee(simResults[simResults.length - 1].Expected)}</strong>. 
                    In poor market conditions (10th percentile), it reaches <strong>{formatRupee(simResults[simResults.length - 1].WorstCase)}</strong>.
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '100%', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                  padding: '3rem', color: 'var(--text-muted)'
                }}>
                  <Play size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <span>Configure parameters and click "Run Simulation" to generate paths</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Add Stock */}
      {showAddStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editStockId ? 'Edit Stock Position' : 'Add Stock Position'}</h3>
            <form onSubmit={handleAddStock}>
              <div className="form-group">
                <label className="form-label">Ticker Symbol</label>
                <input type="text" className="form-input" value={stkSymbol} onChange={(e) => setStkSymbol(e.target.value)} placeholder="e.g. RELIANCE" required />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" className="form-input" value={stkName} onChange={(e) => setStkName(e.target.value)} placeholder="e.g. Reliance Industries" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" className="form-input" value={stkQty} onChange={(e) => setStkQty(e.target.value)} placeholder="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Avg Purchase Cost (₹)</label>
                  <CurrencyInput className="form-input" value={stkAvgPrice} onChange={(e) => setStkAvgPrice(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Current Market Price (₹)</label>
                <CurrencyInput className="form-input" value={stkCurrentPrice} onChange={(e) => setStkCurrentPrice(e.target.value)} placeholder="Leave blank to use purchase price" />
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={stkNominee} onChange={(e) => setStkNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddStock(false); setEditStockId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editStockId ? 'Save Changes' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Mutual Fund */}
      {showAddMF && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editMFId ? 'Edit Mutual Fund' : 'Add Mutual Fund'}</h3>
            <form onSubmit={handleAddMF}>
              <div className="form-group">
                <label className="form-label">Scheme Name</label>
                <input type="text" className="form-input" value={mfSchemeName} onChange={(e) => setMfSchemeName(e.target.value)} placeholder="e.g. Parag Parikh Flexi Cap" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Units Purchased</label>
                  <input type="number" step="any" className="form-input" value={mfUnits} onChange={(e) => setMfUnits(e.target.value)} placeholder="0.000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Avg Buy NAV (₹)</label>
                  <CurrencyInput className="form-input" value={mfAvgNav} onChange={(e) => setMfAvgNav(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Current NAV (₹)</label>
                <CurrencyInput className="form-input" value={mfCurrentNav} onChange={(e) => setMfCurrentNav(e.target.value)} placeholder="Leave blank to use buy NAV" />
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={mfNominee} onChange={(e) => setMfNominee(e.target.value)} placeholder="Registered nominee" />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <input type="checkbox" checked={mfAutoSIP} onChange={(e) => setMfAutoSIP(e.target.checked)} id="mfSipCheck" />
                <label htmlFor="mfSipCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--accent-1)' }}>Auto-Setup Step-Up SIP (Backfills past data)</label>
              </div>

              {mfAutoSIP && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Monthly SIP Amount (₹)</label>
                      <CurrencyInput className="form-input" style={{ padding: '0.4rem' }} value={mfSIPAmount} onChange={(e) => setMfSIPAmount(e.target.value)} required={mfAutoSIP} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Source Bank Account</label>
                      <select className="form-input" style={{ padding: '0.4rem' }} value={mfSIPAccount} onChange={(e) => setMfSIPAccount(e.target.value)} required={mfAutoSIP}>
                        <option value="">-- Select --</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>SIP Start Date</label>
                      <input type="date" className="form-input" style={{ padding: '0.4rem' }} value={mfSIPStartDate} onChange={(e) => setMfSIPStartDate(e.target.value)} required={mfAutoSIP} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Annual Step-Up (%)</label>
                      <input type="number" className="form-input" style={{ padding: '0.4rem' }} value={mfSIPStepUp} onChange={(e) => setMfSIPStepUp(e.target.value)} placeholder="e.g. 10" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddMF(false); setEditMFId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMFId ? 'Save Changes' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add FD */}
      {showAddFD && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editFDId ? 'Edit Fixed Deposit' : 'Link Fixed Deposit'}</h3>
            <form onSubmit={handleAddFD}>
              <div className="form-group">
                <label className="form-label">Bank Institution</label>
                <input type="text" className="form-input" value={fdBankName} onChange={(e) => setFdBankName(e.target.value)} placeholder="e.g. SBI Bank" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Principal Amount (₹)</label>
                  <CurrencyInput className="form-input" value={fdPrincipal} onChange={(e) => setFdPrincipal(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Interest Rate (% p.a.)</label>
                  <input type="number" step="any" className="form-input" value={fdInterestRate} onChange={(e) => setFdInterestRate(e.target.value)} placeholder="6.5" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={fdStartDate} onChange={(e) => setFdStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Date</label>
                  <input type="date" className="form-input" value={fdMaturityDate} onChange={(e) => setFdMaturityDate(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Maturity Amount (₹)</label>
                <CurrencyInput className="form-input" value={fdMaturityAmount} onChange={(e) => setFdMaturityAmount(e.target.value)} placeholder="Auto-calculated if blank" />
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={fdNominee} onChange={(e) => setFdNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddFD(false); setEditFDId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editFDId ? 'Save Changes' : 'Link Deposit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add Gold */}
      {showAddGold && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editGoldId ? 'Edit Gold Holding' : 'Add Gold Holding'}</h3>
            <form onSubmit={handleAddGold}>
              <div className="form-group">
                <label className="form-label">Gold Type</label>
                <select value={gldType} onChange={(e) => setGldType(e.target.value as any)}>
                  <option value="Physical">Physical (Bars / Coins)</option>
                  <option value="SGB">Sovereign Gold Bonds (SGB)</option>
                  <option value="Digital">Digital Gold</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (Grams)</label>
                  <input type="number" step="any" className="form-input" value={gldQty} onChange={(e) => setGldQty(e.target.value)} placeholder="0.0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price (per g)</label>
                  <CurrencyInput className="form-input" value={gldBuyPrice} onChange={(e) => setGldBuyPrice(e.target.value)} placeholder="e.g. 6200" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Current Market Price (per g)</label>
                <CurrencyInput className="form-input" value={gldCurrentPrice} onChange={(e) => setGldCurrentPrice(e.target.value)} placeholder="Leave blank to use buy price" />
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={gldNominee} onChange={(e) => setGldNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddGold(false); setEditGoldId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editGoldId ? 'Save Changes' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add NPS */}
      {showAddNPS && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editNPSId ? 'Edit NPS Account' : 'Link NPS Account'}</h3>
            <form onSubmit={handleAddNPS}>
              <div className="form-group">
                <label className="form-label">PRAN (Pension Account Number)</label>
                <input type="text" className="form-input" value={npsPran} onChange={(e) => setNpsPran(e.target.value)} placeholder="12 digit number" />
              </div>
              <div className="form-group">
                <label className="form-label">Total Balance (₹)</label>
                <CurrencyInput className="form-input" value={npsBalance} onChange={(e) => setNpsBalance(e.target.value)} placeholder="Current value" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Equity (E %)</label>
                  <input type="number" className="form-input" style={{ padding: '0.40rem' }} value={npsE} onChange={(e) => setNpsE(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Corp (C %)</label>
                  <input type="number" className="form-input" style={{ padding: '0.40rem' }} value={npsC} onChange={(e) => setNpsC(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Govt (G %)</label>
                  <input type="number" className="form-input" style={{ padding: '0.40rem' }} value={npsG} onChange={(e) => setNpsG(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Alt (A %)</label>
                  <input type="number" className="form-input" style={{ padding: '0.40rem' }} value={npsA} onChange={(e) => setNpsA(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={npsNominee} onChange={(e) => setNpsNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddNPS(false); setEditNPSId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editNPSId ? 'Save Changes' : 'Link NPS'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Add PF */}
      {showAddPF && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem 2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>{editPFId ? 'Edit Provident Fund' : 'Link Provident Fund'}</h3>
            <form onSubmit={handleAddPF}>
              <div className="form-group">
                <label className="form-label">Fund Type</label>
                <select value={pfType} onChange={(e) => setPfType(e.target.value as any)}>
                  <option value="EPF">Employee Provident Fund (EPF)</option>
                  <option value="PPF">Public Provident Fund (PPF)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input type="text" className="form-input" value={pfAccNum} onChange={(e) => setPfAccNum(e.target.value)} placeholder="EPF member ID or PPF Account Num" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Balance (₹)</label>
                  <CurrencyInput className="form-input" value={pfBalance} onChange={(e) => setPfBalance(e.target.value)} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Yearly Contribution (₹)</label>
                  <CurrencyInput className="form-input" value={pfContrib} onChange={(e) => setPfContrib(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nominee Name</label>
                <input type="text" className="form-input" value={pfNominee} onChange={(e) => setPfNominee(e.target.value)} placeholder="Registered nominee" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddPF(false); setEditPFId(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editPFId ? 'Save Changes' : 'Link Fund'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
