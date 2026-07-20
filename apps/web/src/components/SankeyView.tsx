import React, { useMemo } from 'react';
import { dbService } from '@financeos/database';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import { formatRupee } from '../utils/currency.js';
import { Info } from 'lucide-react';

interface SankeyNode {
  id: string;
  name: string;
  value: number;
  x: number;
  y: number;
  color: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color: string;
}

interface SankeyViewProps {
  dateRange: GlobalDateRange;

  activeProfileId: string;
}

const COLORS = [
  '#10b981', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', 
  '#14b8a6', '#f43f5e', '#84cc16', '#0ea5e9', '#d946ef'
];

export const SankeyView: React.FC<SankeyViewProps> = ({ activeProfileId, dateRange }) => {
  const transactions = useMemo(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId), [activeProfileId]);
  
  const { nodes, links, totalFlow } = useMemo(() => {
    // 1. Group by category
    const incMap = new Map<string, number>();
    const expMap = new Map<string, number>();
    
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'Income') {
        incMap.set(t.category, (incMap.get(t.category) || 0) + t.amount);
        totalIncome += t.amount;
      } else if (t.type === 'Expense') {
        const amt = Math.abs(t.amount);
        expMap.set(t.category, (expMap.get(t.category) || 0) + amt);
        totalExpense += amt;
      }
    });

    // 2. Sort and limit to top 5, bucket the rest in 'Others'
    const getTop = (map: Map<string, number>, limit: number) => {
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      if (sorted.length <= limit) return sorted;
      const top = sorted.slice(0, limit);
      const others = sorted.slice(limit).reduce((sum, [, val]) => sum + val, 0);
      if (others > 0) top.push(['Others', others]);
      return top;
    };

    const incomes = getTop(incMap, 5);
    const expenses = getTop(expMap, 5);
    const netSavings = Math.max(0, totalIncome - totalExpense);
    const totalFlow = Math.max(totalIncome, totalExpense);

    const generatedNodes: SankeyNode[] = [];
    const generatedLinks: SankeyLink[] = [];
    
    // Layout config
    const startY = 20;
    const spacing = 50;

    // A. Income Nodes (Column 0, x=20)
    incomes.forEach((inc, idx) => {
      const id = `i${idx}`;
      generatedNodes.push({
        id,
        name: inc[0],
        value: inc[1],
        x: 20,
        y: startY + idx * spacing,
        color: COLORS[idx % COLORS.length]
      });
      generatedLinks.push({
        source: id,
        target: 'pool',
        value: inc[1],
        color: `${COLORS[idx % COLORS.length]}33`
      });
    });

    // B. Pool Node (Column 1, x=270)
    generatedNodes.push({
      id: 'pool',
      name: 'FinanceOS Pool',
      value: totalFlow,
      x: 270,
      y: 140, // fixed around middle
      color: '#3b82f6'
    });

    // C. Expense Nodes + Net Savings (Column 2, x=520)
    let outIdx = 0;
    expenses.forEach((exp, idx) => {
      const id = `o${idx}`;
      const color = COLORS[(incomes.length + idx + 1) % COLORS.length];
      generatedNodes.push({
        id,
        name: exp[0],
        value: exp[1],
        x: 520,
        y: startY + outIdx * spacing,
        color
      });
      generatedLinks.push({
        source: 'pool',
        target: id,
        value: exp[1],
        color: `${color}33`
      });
      outIdx++;
    });

    if (netSavings > 0) {
      generatedNodes.push({
        id: 'savings',
        name: 'Net Savings',
        value: netSavings,
        x: 520,
        y: startY + outIdx * spacing,
        color: '#10b981'
      });
      generatedLinks.push({
        source: 'pool',
        target: 'savings',
        value: netSavings,
        color: '#10b98133'
      });
    }

    return { nodes: generatedNodes, links: generatedLinks, totalFlow };
  }, [transactions]);

  const getBezierPath = (source: SankeyNode, target: SankeyNode) => {
    const x0 = source.x + 80;
    const y0 = source.y + 15;
    const x1 = target.x;
    const y1 = target.y + 15;
    const midX = (x0 + x1) / 2;

    return `M ${x0} ${y0} C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
  };

  const width = 640;
  const height = 400;

  if (transactions.length === 0) {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 650, marginBottom: '1rem', color: 'var(--text-primary)' }}>Sankey Cash Flow Diagram</h3>
        <p>No transactions found. Add some income and expenses to see your cash flow diagram.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 650 }}>Sankey Cash Flow Diagram</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Trace money pathways from revenue channels down to ledger balances and savings pools</p>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)',
        padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
      }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '640px', overflow: 'visible' }}>
          
          {links.map((link, idx) => {
            const srcNode = nodes.find(n => n.id === link.source);
            const tgtNode = nodes.find(n => n.id === link.target);
            if (!srcNode || !tgtNode || totalFlow === 0) return null;

            const strokeWidth = Math.max(3, (link.value / totalFlow) * 60);

            return (
              <path
                key={idx}
                d={getBezierPath(srcNode, tgtNode)}
                fill="none"
                stroke={link.color}
                strokeWidth={strokeWidth}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}

          {nodes.map(node => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                width={80}
                height={30}
                rx={6}
                fill={node.color}
                opacity={0.85}
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
              />
              <text
                x={40}
                y={13}
                fill="#fff"
                fontSize={9}
                fontWeight={600}
                textAnchor="middle"
              >
                {node.name.length > 13 ? node.name.substring(0, 11) + '..' : node.name}
              </text>
              <text
                x={40}
                y={24}
                fill="rgba(255,255,255,0.8)"
                fontSize={7}
                textAnchor="middle"
              >
                {formatRupee(node.value)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{
        marginTop: '1rem', display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)',
        padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)'
      }}>
        <Info size={16} color="var(--accent-1)" style={{ flexShrink: 0 }} />
        <div>
          The widths of the connecting lines (ribbons) represent the relative monetary amounts of your cash flow. 
          Green paths typically represent net positive inflows/savings, while other colors show operational allocations.
        </div>
      </div>
    </div>
  );
};
