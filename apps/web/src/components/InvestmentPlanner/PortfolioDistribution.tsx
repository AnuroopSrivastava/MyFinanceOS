import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PortfolioCategory } from '@financeos/shared';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRupee } from '../../utils/currency.js';

interface PortfolioDistributionProps {
  portfolio: PortfolioCategory[];
  totalInvestmentAmount: number;
  onUpdatePortfolio: (portfolio: PortfolioCategory[]) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

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
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Step 2: Portfolio Distribution</h2>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Categories List */}
        <div style={{ flex: '1 1 400px' }}>
          {portfolio.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No categories added. Start building your portfolio!
            </div>
          )}

          {portfolio.map((cat, index) => (
            <div key={cat.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
              
              <div style={{ flex: 1.5 }}>
                <input
                  type="text"
                  className="form-input"
                  value={cat.name}
                  onChange={e => handleUpdate(cat.id, { name: e.target.value })}
                  placeholder="Category (e.g., Mutual Funds)"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    value={cat.percentage}
                    onChange={e => handleUpdate(cat.id, { percentage: Number(e.target.value) })}
                    min="0" max="100"
                    style={{ width: '70px' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                </div>
              </div>

              <div style={{ flex: 1.2, fontSize: '0.95rem', fontWeight: 'bold' }}>
                {formatRupee((totalInvestmentAmount * cat.percentage) / 100)}
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem' }}
                onClick={() => handleRemove(cat.id)}
                title="Remove Category"
              >
                <Trash2 size={16} color="var(--error)" />
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleAddCategory}>
              <Plus size={16} /> Add Category
            </button>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              color: unallocatedPercentage > 0 ? 'var(--warning)' : 'var(--success)'
            }}>
              Unallocated Cash: {unallocatedPercentage}% ({formatRupee((totalInvestmentAmount * unallocatedPercentage) / 100)})
            </div>
          </div>
        </div>

        {/* Pie Chart Visualization */}
        <div style={{ flex: '1 1 300px', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Allocation Visualizer</h3>
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
                  <Cell key={`cell-${index}`} fill={entry.name === 'Unallocated' ? '#444' : COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Allocation']}
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};
