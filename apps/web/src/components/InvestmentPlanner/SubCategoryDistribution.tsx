import React from 'react';
import { Button, FormField, IconButton } from '@financeos/ui';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { SubInvestment, InvestmentMethod, PortfolioCategory } from '@financeos/shared';
import { formatRupee } from '@financeos/shared';

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
<div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)', marginBottom: 'var(--spacing-1)' }}>
      <div 
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${category.name || 'Unnamed Category'} Allocation Accordion`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', outline: 'none' }}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', letterSpacing: '-0.01em', margin: 0 }}>{category.name || 'Unnamed Category'} Allocation</h3>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-base)', fontWeight: 'var(--fw-heavy)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>
          Total Available: {formatRupee(categoryAmount)}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 'var(--spacing-15)' }}>
          {category.subInvestments.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 'var(--spacing-1)' }}>
              No specific funds or instruments added to this category. Click "Add Asset" below to set up SIP or lumpsum targets.
            </div>
          )}

          {category.subInvestments.map((sub, index) => (
            <div key={sub.id} style={{ display: 'flex', gap: 'var(--spacing-1)', alignItems: 'flex-start', marginBottom: 'var(--spacing-1)', background: 'var(--surface-tint)', padding: 'var(--spacing-1)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', minWidth: 0 }}>
              <FormField label="Asset Name" style={{ flex: '1.5 1 180px', minWidth: 0 }}>
                <input
                  type="text"
                  className="form-input"
                  value={sub.name}
                  onChange={e => handleUpdate(sub.id, { name: e.target.value })}
                  placeholder="e.g. Nifty 50 Index"
                  aria-label={`Asset name ${index + 1}`}
                  style={{ width: '100%' }}
                />
              </FormField>

              <FormField label="Allocation %" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={sub.percentage}
                    onChange={e => handleUpdate(sub.id, { percentage: Number(e.target.value) })}
                    min="0" max="100"
                    aria-label={`${sub.name || 'Asset'} allocation percentage`}
                    style={{ width: '80px' }}
                  />
                  <span style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>
                    ({formatRupee((categoryAmount * sub.percentage) / 100)})
                  </span>
                </div>
              </FormField>

              <FormField label="Method" style={{ flex: 1 }}>
                <select
                  className="form-input"
                  value={sub.method}
                  onChange={e => handleUpdate(sub.id, { method: e.target.value as InvestmentMethod })}
                  aria-label={`${sub.name || 'Asset'} investment method`}
                  style={{ width: '100%' }}
                >
                  <option value="SIP">SIP</option>
                  <option value="Lumpsum">Lumpsum</option>
                </select>
              </FormField>

              {sub.method === 'SIP' && (
                <FormField label="Step-up %/yr" style={{ flex: 0.8 }}>
                  <input
                    type="number"
                    className="form-input"
                    value={sub.stepUpPercentage || ''}
                    onChange={e => handleUpdate(sub.id, { stepUpPercentage: Number(e.target.value) })}
                    placeholder="e.g. 10"
                    aria-label={`${sub.name || 'Asset'} annual step-up percentage`}
                    style={{ width: '100%' }}
                  />
                </FormField>
              )}

              <IconButton
                variant="danger"
                label={`Remove asset ${sub.name || index + 1}`}
                icon={<Trash2 size={16} />}
                onClick={() => handleRemove(sub.id)}
                style={{ marginTop: 'var(--spacing-125)' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-1)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-1)' }}>
            <Button variant="secondary" onClick={handleAdd} style={{ fontSize: 'var(--font-sm)' }}>
              <Plus size={16} /> Add Asset
            </Button>
            
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-base)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1", color: unallocatedPercentage > 0 ? 'var(--warning)' : 'var(--success)' }}>
              Unallocated: {unallocatedPercentage}% ({formatRupee(unallocatedAmount)})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
