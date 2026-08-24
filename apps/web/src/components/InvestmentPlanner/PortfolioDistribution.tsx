import React from 'react';
import { Button, IconButton, chartTooltipStyle, chartTooltipItemStyle } from '@financeos/ui';
import { Plus, Trash2 } from 'lucide-react';
import { PortfolioCategory } from '@financeos/shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRupee } from '@financeos/shared';

interface PortfolioDistributionProps {
  portfolio: PortfolioCategory[];
  totalInvestmentAmount: number;
  onUpdatePortfolio: (portfolio: PortfolioCategory[]) => void;
}

const COLORS = [
  'var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)', 'var(--chart-series-4)',
  'var(--chart-series-5)', 'var(--chart-series-6)', 'var(--chart-series-7)', 'var(--chart-series-8)',
];

export const PortfolioDistribution: React.FC<PortfolioDistributionProps> = ({
  portfolio,
  totalInvestmentAmount,
  onUpdatePortfolio
}) => {
  const handleAddCategory = () => {
    const newCategory: PortfolioCategory = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      name: '',
      percentage: 0,
      subInvestments: []
    };
    onUpdatePortfolio([...portfolio, newCategory]);
  };

  const handleUpdate = (id: string, updates: Partial<PortfolioCategory>) => {
    const updated = portfolio.map(c => c.id === id ? { ...c, ...updates } : c);
    onUpdatePortfolio(updated);
  };

  const handleRemove = (id: string) => {
    onUpdatePortfolio(portfolio.filter(c => c.id !== id));
  };

  const totalPercentage = portfolio.reduce((sum, c) => sum + (c.percentage || 0), 0);
  const unallocatedPercentage = Math.max(0, 100 - totalPercentage);

  const pieData = [
    ...portfolio.map(c => ({ name: c.name || 'Unnamed', value: c.percentage })),
    ...(unallocatedPercentage > 0 ? [{ name: 'Unallocated', value: unallocatedPercentage }] : [])
  ];

  return (
    <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-15)', marginBottom: 'var(--spacing-15)' }}>
      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--spacing-125)' }}>Step 2: Portfolio Distribution</h3>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
        
        {/* Categories List */}
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          {portfolio.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 'var(--spacing-1)' }}>
              No asset classes configured. Click "Add Category" below to allocate capital across Equity, Debt, Gold, or Real Estate.
            </div>
          )}

          {portfolio.map((cat, index) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                gap: 'var(--spacing-075)',
                alignItems: 'center',
                marginBottom: 'var(--spacing-085)',
                background: 'var(--surface-tint)',
                padding: 'var(--spacing-075) var(--spacing-085)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-06)', flex: '1 1 180px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                <input
                  type="text"
                  className="form-input"
                  value={cat.name}
                  onChange={e => handleUpdate(cat.id, { name: e.target.value })}
                  placeholder="Category (e.g., Mutual Funds)"
                  aria-label={`Category name ${index + 1}`}
                  style={{ flex: 1, minWidth: '130px', fontSize: 'var(--font-base)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', justifyContent: 'space-between', flex: '1 1 180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={cat.percentage}
                    onChange={e => handleUpdate(cat.id, { percentage: Number(e.target.value) })}
                    min="0" max="100"
                    aria-label={`${cat.name || 'Category'} allocation percentage`}
                    style={{ width: '65px', textAlign: 'center', fontSize: 'var(--font-sm)' }}
                  />
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>%</span>
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-base)', fontWeight: 'var(--fw-heavy)', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>
                  {formatRupee((totalInvestmentAmount * cat.percentage) / 100)}
                </div>

                <IconButton
                  variant="danger"
                  label={`Remove category ${cat.name || index + 1}`}
                  icon={<Trash2 size={15} />}
                  onClick={() => handleRemove(cat.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-15)' }}>
            <Button variant="primary" onClick={handleAddCategory}>
              <Plus size={16} /> Add Category
            </Button>
            <div style={{ 
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-base)', 
              fontWeight: 'var(--fw-heavy)', 
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: "'tnum' 1",
              color: unallocatedPercentage > 0 ? 'var(--warning)' : 'var(--success)'
            }}>
              Unallocated Cash: {unallocatedPercentage}% ({formatRupee((totalInvestmentAmount * unallocatedPercentage) / 100)})
            </div>
          </div>
        </div>

        {/* Pie Chart Visualization */}
        <div style={{ flex: '1 1 300px', height: 'var(--chart-height-md)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-05)' }}>Allocation Visualizer</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Unallocated' ? 'var(--border-subtle)' : COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value}%`, 'Allocation']}
                contentStyle={chartTooltipStyle}
                itemStyle={chartTooltipItemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};
