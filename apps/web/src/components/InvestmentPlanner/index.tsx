import React, { useState, useEffect, useRef } from 'react';
import { SectionHeader, Tabs } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { InvestmentPlan, PortfolioCategory, SubInvestment } from '@financeos/shared';
import { TopLevelInputs } from './TopLevelInputs.js';
import { PortfolioDistribution } from './PortfolioDistribution.js';
import { SubCategoryDistribution } from './SubCategoryDistribution.js';
import { FireSipCalculator } from './FireSipCalculator.js';
import { EMICalculator } from '../EMICalculator.js';
import { Flame, PieChart, Calculator, TrendingUp } from 'lucide-react';

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
  const { currentMonthExpenses, currentLiquidNetWorth } = React.useMemo(() => {
    try {
      const transactions = dbService.getTransactions().filter(t => t.profileId === activeProfileId);
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const expenses = transactions
        .filter(t => t.type === 'Expense' && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const accounts = dbService.getAccounts().filter(a => a.profileId === activeProfileId);
      const bankLiquidBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const fdsValue = dbService.getFDs().filter(f => f.profileId === activeProfileId).reduce((sum, f) => sum + f.principalAmount, 0);
      const mfVal = dbService.getMutualFunds().filter(m => m.profileId === activeProfileId).reduce((sum, m) => sum + (m.currentNav * m.units), 0);
      const stockVal = dbService.getStocks().filter(s => s.profileId === activeProfileId).reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
      const netWorth = bankLiquidBalance + fdsValue + mfVal + stockVal;

      return { currentMonthExpenses: expenses, currentLiquidNetWorth: netWorth };
    } catch {
      return { currentMonthExpenses: 0, currentLiquidNetWorth: 0 };
    }
  }, [activeProfileId]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)', maxWidth: 'var(--layout-max-width, 1536px)', margin: '0 auto', width: '100%' }}>
      
      {/* Header & Sub-tab Navigation */}
      <SectionHeader
        variant="banner"
        icon={<TrendingUp />}
        title="Investment & FIRE Planner"
        description="Map out monthly allocations, calculate step-up SIPs, and track FIRE readiness."
        action={
          <div style={{ minWidth: 0, maxWidth: '520px', width: '100%' }}>
            <Tabs
              tabs={[
                { id: 'allocator', label: 'Asset Allocator', icon: <PieChart size={14} /> },
                { id: 'fire', label: 'FIRE & SIP Lab', icon: <Flame size={14} /> },
                { id: 'emi', label: 'EMI Calculator', icon: <Calculator size={14} /> }
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as 'allocator' | 'fire' | 'emi')}
              variant="segmented"
            />
          </div>
        }
      />

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
            <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)', marginTop: 'var(--spacing-15)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--spacing-125)' }}>Step 3: Asset Specifics (SIP / Lumpsum)</h3>
              
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
