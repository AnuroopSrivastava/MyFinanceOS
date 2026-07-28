import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '@financeos/database';
import { InvestmentPlan, PortfolioCategory, SubInvestment } from '@financeos/shared';
import { TopLevelInputs } from './TopLevelInputs.js';
import { PortfolioDistribution } from './PortfolioDistribution.js';
import { SubCategoryDistribution } from './SubCategoryDistribution.js';
import { FireSipCalculator } from './FireSipCalculator.js';
import { EMICalculator } from '../EMICalculator.js';
import { Flame, PieChart, Calculator } from 'lucide-react';

interface InvestmentPlannerProps {
  activeProfileId: string;
}

export const InvestmentPlanner: React.FC<InvestmentPlannerProps> = ({ activeProfileId }) => {
  const [activeTab, setActiveTab] = useState<'allocator' | 'fire' | 'emi'>('allocator');
  const [plan, setPlan] = useState<InvestmentPlan>({
    id: '',
    profileId: activeProfileId,
    salary: 0,
    investmentPercentage: 20,
    portfolio: []
  });
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Load existing plan for this profile
    const existingPlans = dbService.getInvestmentPlans().filter(p => p.profileId === activeProfileId);
    if (existingPlans.length > 0) {
      setPlan(existingPlans[0]);
    } else {
      setPlan({
        id: '',
        profileId: activeProfileId,
        salary: 0,
        investmentPercentage: 20,
        portfolio: []
      });
    }
  }, [activeProfileId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      if (plan.id) {
        dbService.updateInvestmentPlan(plan.id, plan);
      } else {
        dbService.addInvestmentPlan(plan).then(newPlan => {
          setPlan(p => p.id === newPlan.id ? p : newPlan);
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [plan]);

  const handleSalaryChange = (salary: number) => {
    setPlan(p => ({ ...p, salary }));
  };

  const handleInvestmentPercentageChange = (investmentPercentage: number) => {
    setPlan(p => ({ ...p, investmentPercentage }));
  };

  const handleUpdatePortfolio = (portfolio: PortfolioCategory[]) => {
    setPlan(p => ({ ...p, portfolio }));
  };

  const handleUpdateSubInvestments = (categoryId: string, subInvestments: SubInvestment[]) => {
    setPlan(p => ({
      ...p,
      portfolio: p.portfolio.map(c => c.id === categoryId ? { ...c, subInvestments } : c)
    }));
  };

  const totalInvestmentAmount = (plan.salary * plan.investmentPercentage) / 100;

  // Calculate current monthly expense & liquid net worth from DB for FIRE lab
  const transactions = dbService.getTransactions().filter(t => t.profileId === activeProfileId);
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const currentMonthExpenses = transactions
    .filter(t => t.type === 'Expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const accounts = dbService.getAccounts().filter(a => a.profileId === activeProfileId);
  const bankLiquidBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const fdsValue = dbService.getFDs().filter(f => f.profileId === activeProfileId).reduce((sum, f) => sum + f.principalAmount, 0);
  const mfValue = dbService.getMutualFunds().filter(m => m.profileId === activeProfileId).reduce((sum, m) => sum + (m.currentNav * m.units), 0);
  const stockValue = dbService.getStocks().filter(s => s.profileId === activeProfileId).reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
  const currentLiquidNetWorth = bankLiquidBalance + fdsValue + mfValue + stockValue;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header & Sub-tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>
            Investment & FIRE Planner
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Map out monthly allocations, calculate step-up SIPs, and track FIRE readiness.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            className="btn"
            onClick={() => setActiveTab('allocator')}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'allocator' ? 'var(--accent-grad)' : 'transparent',
              color: activeTab === 'allocator' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <PieChart size={16} />
            <span>Asset Allocator</span>
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('fire')}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'fire' ? 'var(--accent-grad)' : 'transparent',
              color: activeTab === 'fire' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Flame size={16} />
            <span>FIRE & SIP Goal Lab</span>
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('emi')}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'emi' ? 'var(--accent-grad)' : 'transparent',
              color: activeTab === 'emi' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Calculator size={16} />
            <span>EMI Calculator</span>
          </button>
        </div>
      </div>

      {activeTab === 'allocator' ? (
        <>
          <TopLevelInputs 
            salary={plan.salary}
            investmentPercentage={plan.investmentPercentage}
            onSalaryChange={handleSalaryChange}
            onInvestmentPercentageChange={handleInvestmentPercentageChange}
          />

          <PortfolioDistribution 
            portfolio={plan.portfolio}
            totalInvestmentAmount={totalInvestmentAmount}
            onUpdatePortfolio={handleUpdatePortfolio}
          />

          {plan.portfolio.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Step 3: Asset Specifics (SIP / Lumpsum)</h2>
              
              {plan.portfolio.map(category => (
                <SubCategoryDistribution 
                  key={category.id}
                  category={category}
                  categoryAmount={(totalInvestmentAmount * category.percentage) / 100}
                  onUpdateSubInvestments={(subs) => handleUpdateSubInvestments(category.id, subs)}
                />
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'fire' ? (
        <FireSipCalculator
          activeProfileId={activeProfileId}
          currentMonthlyExpense={currentMonthExpenses}
          currentLiquidNetWorth={currentLiquidNetWorth}
        />
      ) : (
        <EMICalculator activeProfileId={activeProfileId} />
      )}

    </div>
  );
};
