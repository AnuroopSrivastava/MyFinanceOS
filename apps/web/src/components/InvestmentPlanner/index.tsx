import React, { useState, useEffect, useRef } from 'react';
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
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
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
            <TrendingUp size={22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
              Investment & FIRE Planner
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.35rem', margin: 0, lineHeight: 1.4 }}>
              Map out monthly allocations, calculate step-up SIPs, and track FIRE readiness.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          width: '100%',
          maxWidth: '520px',
          gap: '0.25rem',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '0.4rem',
          borderRadius: '2rem',
          border: '1px solid var(--border-color)',
          boxSizing: 'border-box',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <button
            className={`btn ${activeTab === 'allocator' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('allocator')}
            style={{
              flex: 1,
              padding: '0.45rem 0.3rem',
              fontSize: 'clamp(0.7rem, 2.2vw, 0.825rem)',
              borderRadius: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              fontWeight: activeTab === 'allocator' ? 600 : 400
            }}
          >
            <PieChart size={14} style={{ flexShrink: 0 }} />
            <span>Asset Allocator</span>
          </button>
          <button
            className={`btn ${activeTab === 'fire' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('fire')}
            style={{
              flex: 1,
              padding: '0.45rem 0.3rem',
              fontSize: 'clamp(0.7rem, 2.2vw, 0.825rem)',
              borderRadius: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              fontWeight: activeTab === 'fire' ? 600 : 400
            }}
          >
            <Flame size={14} style={{ flexShrink: 0 }} />
            <span>FIRE & SIP Lab</span>
          </button>
          <button
            className={`btn ${activeTab === 'emi' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('emi')}
            style={{
              flex: 1,
              padding: '0.45rem 0.3rem',
              fontSize: 'clamp(0.7rem, 2.2vw, 0.825rem)',
              borderRadius: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              fontWeight: activeTab === 'emi' ? 600 : 400
            }}
          >
            <Calculator size={14} style={{ flexShrink: 0 }} />
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 650, marginBottom: '1.25rem' }}>Step 3: Asset Specifics (SIP / Lumpsum)</h3>
              
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
