import React, { useMemo } from 'react';
import { EmptyState, SectionHeader, InfoCallout } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { useDbVersion } from '../hooks/useDbSync.js';
import { GlobalDateRange, filterByDateRange } from '../utils/dateFilter.js';
import { formatRupee } from '@financeos/shared';
import { Info, TrendingUp } from 'lucide-react';

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

const INFLOW_COLORS = [
  'var(--chart-income)',
  'var(--chart-series-1)',
  'var(--chart-series-7)',
  'var(--chart-series-3)',
  'var(--chart-series-5)'
];

const EXPENSE_COLORS = [
  'var(--chart-expense)',
  'var(--chart-series-6)',
  'var(--chart-series-5)',
  'var(--chart-series-4)',
  'var(--error)',
  'var(--badge-rose-text)'
];

export const SankeyView: React.FC<SankeyViewProps> = ({ activeProfileId, dateRange }) => {
  const dbVersion = useDbVersion();
  const transactions = useMemo(() => {
    const raw = dbService.getTransactions().filter(t => t.profileId === activeProfileId);
    return filterByDateRange(raw, dateRange, t => t.date);
  }, [activeProfileId, dbVersion, dateRange]);
  
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
      const color = INFLOW_COLORS[idx % INFLOW_COLORS.length];
      generatedNodes.push({
        id,
        name: inc[0],
        value: inc[1],
        x: 20,
        y: startY + idx * spacing,
        color
      });
      generatedLinks.push({
        source: id,
        target: 'pool',
        value: inc[1],
        color: `color-mix(in srgb, ${color} 24%, transparent)`
      });
    });

    // B. Pool Node (Column 1, x=270)
    generatedNodes.push({
      id: 'pool',
      name: 'Cash Flow Hub',
      value: totalFlow,
      x: 270,
      y: 140,
      color: 'var(--chart-series-1)'
    });

    // C. Expense Nodes + Net Savings (Column 2, x=520)
    let outIdx = 0;
    expenses.forEach((exp, idx) => {
      const id = `o${idx}`;
      const color = EXPENSE_COLORS[idx % EXPENSE_COLORS.length];
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
        color: `color-mix(in srgb, ${color} 24%, transparent)`
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
        color: 'var(--chart-income)'
      });
      generatedLinks.push({
        source: 'pool',
        target: 'savings',
        value: netSavings,
        color: 'color-mix(in srgb, var(--chart-income) 24%, transparent)'
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
      <div className="gap-stack-lg">
        <SectionHeader
          variant="banner"
          icon={<TrendingUp />}
          title="Sankey Cash Flow Diagram"
          description="Trace money pathways from revenue channels down to ledger balances and savings pools"
        />
        <EmptyState
          icon={<TrendingUp size={28} />}
          title="No cash flow transactions recorded"
          description="Record income credits and expense debits in Banking & Double-Entry Ledger to visualize your money pathways."
        />
      </div>
    );
  }

  return (
    <div className="gap-stack-lg animate-fade-in">
      <SectionHeader
        variant="banner"
        icon={<TrendingUp />}
        title="Sankey Cash Flow Diagram"
        description="Trace money pathways from revenue channels down to ledger balances and savings pools"
      />

      <div className="glass-panel" data-interactive-card="off" style={{
        padding: 'var(--spacing-2)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-panel)',
        backgroundImage: 'var(--neo-convex-grad)',
        border: '1px solid var(--border-color)',
        borderTop: 'var(--neo-bevel-top)',
        borderBottom: 'var(--neo-bevel-bottom)',
        boxShadow: 'var(--neo-raised-md)'
      }}>

      <div style={{
        display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)',
        padding: 'var(--spacing-15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
        boxShadow: 'var(--neo-inset-md)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        <svg
          role="img"
          aria-label="Money flow diagram showing income sources and expense destinations"
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: '480px', maxWidth: '640px', overflow: 'visible' }}
        >
          <title>Cash Flow Sankey Diagram</title>
          <desc>Visual representation of income streams, central ledger aggregation, and expense allocation channels.</desc>
          
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
                style={{ transition: 'opacity 0.2s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
                opacity={0.85}
              />
            );
          })}

          {nodes.map(node => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                width={80}
                height={36}
                rx={6}
                fill={node.color}
                opacity={0.85}
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
              />
              <text
                x={40}
                y={15}
                fill="var(--text-on-accent, #fff)"
                fontSize={9}
                fontWeight={600}
                textAnchor="middle"
              >
                {node.name.length > 13 ? node.name.substring(0, 11) + '..' : node.name}
              </text>
              <text
                x={40}
                y={28}
                fill="var(--text-on-accent-muted, rgba(255,255,255,0.8))"
                fontSize={7.5}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {formatRupee(node.value)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>

    {/* Screen-reader accessible data summary */}
      <div className="sr-only" aria-live="polite">
        <table>
          <caption>Cash Flow Breakdown Summary</caption>
          <thead>
            <tr>
              <th scope="col">Flow Channel</th>
              <th scope="col">Category</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map(node => (
              <tr key={node.id}>
                <td>{node.id.startsWith('i') ? 'Inflow' : node.id === 'pool' ? 'Consolidated Pool' : 'Outflow / Savings'}</td>
                <td>{node.name}</td>
                <td>{formatRupee(node.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfoCallout variant="info" style={{ marginTop: 'var(--spacing-1)' }}>
        The widths of the connecting lines (ribbons) represent the relative monetary amounts of your cash flow. 
        Green paths typically represent net positive inflows/savings, while other colors show operational allocations.
      </InfoCallout>
    </div>
  );
};
