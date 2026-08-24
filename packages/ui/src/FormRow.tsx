import React from 'react';

export type FormRowColumns = 2 | 3 | 4 | '1.2fr 1fr' | '1fr 1.2fr' | '1fr 2fr' | '2fr 1fr' | '1fr 1fr 1fr 1fr';

export interface FormRowProps {
  /** Column layout structure */
  columns?: FormRowColumns;
  /** Gap between form columns (defaults to var(--spacing-1)) */
  gap?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormRow: React.FC<FormRowProps> = ({
  columns = 2,
  gap = 'var(--spacing-1)',
  children,
  className = '',
  style
}) => {
  let gridTemplateColumns = '1fr 1fr';

  if (typeof columns === 'number') {
    gridTemplateColumns = `repeat(${columns}, 1fr)`;
  } else if (typeof columns === 'string') {
    gridTemplateColumns = columns;
  }

  return (
    <div
      className={`responsive-stack ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap,
        ...style
      }}
    >
      {children}
    </div>
  );
};
