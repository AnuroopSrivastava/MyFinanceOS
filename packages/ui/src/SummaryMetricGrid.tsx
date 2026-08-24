import React from 'react';

export interface SummaryMetricGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 'auto';
  minItemWidth?: string;
  gap?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SummaryMetricGrid: React.FC<SummaryMetricGridProps> = ({
  children,
  columns = 'auto',
  minItemWidth = '220px',
  gap = 'var(--spacing-1)',
  className = '',
  style
}) => {
  const getGridTemplateColumns = () => {
    if (typeof columns === 'number') {
      return `repeat(${columns}, 1fr)`;
    }
    return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
  };

  return (
    <div
      className={`summary-metric-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: getGridTemplateColumns(),
        gap,
        width: '100%',
        alignItems: 'stretch',
        ...style
      }}
    >
      {children}
    </div>
  );
};
