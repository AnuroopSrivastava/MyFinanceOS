import React, { useState, useEffect } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
    setSaveMessage('');
  }, [activeProfileId]);

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      if (plan.id) {
        await dbService.updateInvestmentPlan(plan.id, plan);
      } else {
        const newPlan = await dbService.addInvestmentPlan(plan);
        setPlan(newPlan);
      }
      setSaveMessage('Plan saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('Failed to save plan.');
    } finally {
      setIsSaving(false);
    }
  };

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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saveMessage && (
            <span style={{ color: saveMessage.includes('Failed') ? 'var(--error)' : 'var(--success)', fontSize: '0.9rem' }}>
              {saveMessage}
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
            <span>Save Plan</span>
          </button>
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

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
