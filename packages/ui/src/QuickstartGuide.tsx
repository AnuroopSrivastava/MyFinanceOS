import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from './Badge.js';

export interface QuickstartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted?: boolean;
  onClick: () => void;
  actionLabel?: string;
}

export interface QuickstartGuideProps {
  /** Main title */
  title?: string;
  /** Subtitle / explanation */
  subtitle?: string;
  /** Header leading icon */
  icon?: React.ReactNode;
  /** Steps list */
  steps: QuickstartStep[];
  /** Completed count override */
  completedCount?: number;
  /** Total count override */
  totalCount?: number;
  /** Custom className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const QuickstartGuide: React.FC<QuickstartGuideProps> = ({
  title = 'Quickstart Treasury Setup',
  subtitle = 'Your cryptographic vault is active and encrypted. Complete quick steps to power up your financial telemetry.',
  icon = <Sparkles size={20} />,
  steps,
  completedCount,
  totalCount,
  className = '',
  style,
}) => {
  const actualCompleted = completedCount ?? steps.filter((s) => s.isCompleted).length;
  const actualTotal = totalCount ?? steps.length;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 18 } },
      }}
      className={`glass-panel ${className}`.trim()}
      data-interactive-card="off"
      style={{
        padding: '1.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        borderTop: 'var(--neo-bevel-top)',
        backgroundImage: 'var(--neo-convex-grad)',
        boxShadow: 'var(--neo-raised-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="neo-socket"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              color: 'var(--accent-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--neo-inset-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            {icon}
          </div>
          <div>
            <h3 className="type-title" style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
              {title}
            </h3>
            {subtitle && (
              <p className="type-body-secondary" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <Badge variant={actualCompleted === actualTotal ? 'emerald' : 'cyan'} size="sm">
          {actualCompleted} of {actualTotal} Initialized
        </Badge>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '0.85rem',
        }}
      >
        {steps.map((step) => {
          return (
            <button
              key={step.id}
              type="button"
              onClick={step.onClick}
              className="interactive-card interactive-card--normal"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                padding: '1.1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: 'var(--neo-raised-sm)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  className="neo-socket"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    color: step.isCompleted ? 'var(--success)' : 'var(--accent-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-panel)',
                    boxShadow: 'var(--neo-inset-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {step.isCompleted ? <CheckCircle2 size={16} /> : step.icon}
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 650,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {step.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
