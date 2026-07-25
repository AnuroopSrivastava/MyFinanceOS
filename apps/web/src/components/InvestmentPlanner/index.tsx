import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '@financeos/database';
import { InvestmentPlan, PortfolioCategory, SubInvestment } from '@financeos/shared';
import { TopLevelInputs } from './TopLevelInputs.js';
import { PortfolioDistribution } from './PortfolioDistribution.js';
import { SubCategoryDistribution } from './SubCategoryDistribution.js';
import { Save, RefreshCw } from 'lucide-react';

interface InvestmentPlannerProps {
  activeProfileId: string;
}

export const InvestmentPlanner: React.FC<InvestmentPlannerProps> = ({ activeProfileId }) => {
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
      setPlan(existingPlans[0]); // Load the first plan (assuming 1 per profile for now)
    } else {
      // Reset to default
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
          // Update id silently without triggering another save
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

  // Auto-saved by the useEffect above.

  const totalInvestmentAmount = (plan.salary * plan.investmentPercentage) / 100;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.2rem' }}>
            Investment Planner
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Map out your exact monthly investment goals and allocations.
          </p>
        </div>
      </div>

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
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
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


    </div>
  );
};
