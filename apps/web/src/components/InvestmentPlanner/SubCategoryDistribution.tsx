import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { SubInvestment, InvestmentMethod, PortfolioCategory } from '@financeos/shared';
import { formatRupee } from '../../utils/currency.js';

interface SubCategoryDistributionProps {
  category: PortfolioCategory;
  categoryAmount: number;
  onUpdateSubInvestments: (subs: SubInvestment[]) => void;
}

export const SubCategoryDistribution: React.FC<SubCategoryDistributionProps> = ({
  category,
  categoryAmount,
  onUpdateSubInvestments
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleAdd = () => {
    const newSub: SubInvestment = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      name: '',
      percentage: 0,
      method: 'SIP'
    };
    onUpdateSubInvestments([...category.subInvestments, newSub]);
  };

  const handleUpdate = (id: string, updates: Partial<SubInvestment>) => {
    const updated = category.subInvestments.map(s => s.id === id ? { ...s, ...updates } : s);
    onUpdateSubInvestments(updated);
  };

  const handleRemove = (id: string) => {
    onUpdateSubInvestments(category.subInvestments.filter(s => s.id !== id));
  };

  const totalPercentage = category.subInvestments.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const unallocatedPercentage = Math.max(0, 100 - totalPercentage);
  const unallocatedAmount = (categoryAmount * unallocatedPercentage) / 100;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent-1)' }}>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{category.name || 'Unnamed Category'} Allocation</h3>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Total Available: {formatRupee(categoryAmount)}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1.5rem' }}>
          {category.subInvestments.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              No specific assets added yet.
            </div>
          )}

          {category.subInvestments.map((sub, index) => (
            <div key={sub.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ flex: 1.5 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Asset Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={sub.name}
                  onChange={e => handleUpdate(sub.id, { name: e.target.value })}
                  placeholder="e.g. Nifty 50 Index"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allocation %</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={sub.percentage}
                    onChange={e => handleUpdate(sub.id, { percentage: Number(e.target.value) })}
                    min="0" max="100"
                    style={{ width: '70px' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    ({formatRupee((categoryAmount * sub.percentage) / 100)})
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Method</label>
                <select
                  className="form-input"
                  value={sub.method}
                  onChange={e => handleUpdate(sub.id, { method: e.target.value as InvestmentMethod })}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <option value="SIP">SIP</option>
                  <option value="Lumpsum">Lumpsum</option>
                </select>
              </div>

              {sub.method === 'SIP' && (
                <div style={{ flex: 0.8 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Step-up %/yr</label>
                  <input
                    type="number"
                    className="form-input"
                    value={sub.stepUpPercentage || ''}
                    onChange={e => handleUpdate(sub.id, { stepUpPercentage: Number(e.target.value) })}
                    placeholder="e.g. 10"
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  />
                </div>
              )}

              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem', marginTop: '1.4rem' }}
                onClick={() => handleRemove(sub.id)}
                title="Remove Asset"
              >
                <Trash2 size={16} color="var(--error)" />
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={handleAdd} style={{ fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Asset
            </button>
            
            <div style={{ fontSize: '0.9rem', color: unallocatedPercentage > 0 ? 'var(--warning)' : 'var(--success)' }}>
              Unallocated: {unallocatedPercentage}% ({formatRupee(unallocatedAmount)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
