import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, AlertCircle, TrendingUp, Target, Shield, Wallet } from 'lucide-react';
import { formatRupee } from '@financeos/shared';
import { InteractiveCard } from './InteractiveCard.js';

export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionCategory = 'deduction' | 'investment' | 'insurance' | 'structural' | 'compliance';

export interface OptimizationAction {
  id: string;
  title: string;
  description: string;
  /** Exact rupee amount to act on */
  amount: number;
  /** Section this action relates to */
  section: string;
  /** Priority for sorting */
  priority: ActionPriority;
  /** Category for icon/color coding */
  category: ActionCategory;
  /** Deadline (ISO date string) */
  deadline?: string;
  /** Deep link target */
  deepLink?: string;
  /** Deep link label */
  deepLinkLabel?: string;
  /** Whether action is completed */
  completed?: boolean;
  /** Formula/explanation */
  formula?: string;
  /** Savings if action taken */
  taxSaving?: number;
}

export interface OptimizationActionListProps {
  /** List of optimization actions */
  actions: OptimizationAction[];
  /** On action click (for deep linking) */
  onActionClick?: (action: OptimizationAction) => void;
  /** On action complete toggle */
  onActionComplete?: (actionId: string, completed: boolean) => void;
  /** Title for the list */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Show completed actions */
  showCompleted?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const categoryIcons: Record<ActionCategory, React.ReactNode> = {
  deduction: <Shield size={16} />,
  investment: <TrendingUp size={16} />,
  insurance: <Shield size={16} />,
  structural: <Target size={16} />,
  compliance: <Wallet size={16} />,
};

const categoryColors: Record<ActionCategory, { bg: string; border: string; text: string; icon: string }> = {
  deduction: { bg: 'var(--badge-cyan-bg)', border: 'var(--badge-cyan-border)', text: 'var(--badge-cyan-text)', icon: 'var(--accent-1)' },
  investment: { bg: 'var(--badge-emerald-bg)', border: 'var(--badge-emerald-border)', text: 'var(--badge-emerald-text)', icon: 'var(--success)' },
  insurance: { bg: 'var(--badge-indigo-bg)', border: 'var(--badge-indigo-border)', text: 'var(--badge-indigo-text)', icon: 'var(--badge-indigo-text)' },
  structural: { bg: 'var(--badge-amber-bg)', border: 'var(--badge-amber-border)', text: 'var(--badge-amber-text)', icon: 'var(--warning)' },
  compliance: { bg: 'var(--badge-rose-bg)', border: 'var(--badge-rose-border)', text: 'var(--badge-rose-text)', icon: 'var(--error)' },
};

const priorityOrder: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 };

export const OptimizationActionList = forwardRef<HTMLDivElement, OptimizationActionListProps>(
  (
    {
      actions,
      onActionClick,
      onActionComplete,
      title = 'Optimization Actions',
      subtitle,
      showCompleted = true,
      emptyMessage = 'No optimization actions needed. Your tax plan is optimal!',
      className = '',
      style,
    },
    ref
  ) => {
    const filteredActions = showCompleted
      ? actions
      : actions.filter(a => !a.completed);

    const sortedActions = [...filteredActions].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (sortedActions.length === 0) {
      return (
        <InteractiveCard
          ref={ref}
          intensity="subtle"
          className={`optimization-action-list ${className}`.trim()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem',
            textAlign: 'center',
            ...style,
          }}
        >
          <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '1rem', opacity: 0.6 }} />
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            All Optimized
          </h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {emptyMessage}
          </p>
        </InteractiveCard>
      );
    }

    return (
      <InteractiveCard
        ref={ref}
        intensity="subtle"
        className={`optimization-action-list ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 650, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--badge-cyan-bg)',
            color: 'var(--badge-cyan-text)',
            border: '1px solid var(--badge-cyan-border)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {sortedActions.filter(a => !a.completed).length} pending
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sortedActions.map((action, index) => {
            const colors = categoryColors[action.category];
            const isCompleted = action.completed;
            const hasDeadline = action.deadline && new Date(action.deadline) > new Date();
            const isOverdue = action.deadline && new Date(action.deadline) < new Date() && !isCompleted;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  background: isCompleted
                    ? 'color-mix(in srgb, var(--success) 4%, transparent)'
                    : 'var(--bg-secondary)',
                  backgroundImage: isCompleted ? 'none' : 'var(--neo-convex-grad)',
                  border: `1px solid ${isCompleted ? 'color-mix(in srgb, var(--success) 15%, transparent)' : colors.border}`,
                  borderTop: isCompleted ? undefined : 'var(--neo-bevel-top)',
                  borderBottom: isCompleted ? undefined : 'var(--neo-bevel-bottom)',
                  boxShadow: isCompleted ? 'none' : 'var(--neo-raised-sm)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s ease',
                  opacity: isCompleted ? 0.7 : 1,
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  if (!isCompleted) {
                    e.currentTarget.style.background = `color-mix(in srgb, ${colors.bg} 50%, transparent)`;
                    e.currentTarget.style.borderColor = colors.border;
                  }
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  if (!isCompleted) {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = colors.border;
                  }
                }}
              >
                {/* Category Icon & Priority */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  paddingRight: '0.5rem',
                  borderRight: `1px solid color-mix(in srgb, ${colors.border} 25%, transparent)`,
                }}>
                  <div className="neo-socket" style={{
                    width: '36px',
                    height: '36px',
                    color: colors.icon,
                  }}>
                    {categoryIcons[action.category]}
                  </div>
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-pill)',
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}>
                    {action.priority}
                  </span>
                </div>

                {/* Action Content */}
                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 'var(--font-sm)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: 'var(--ls-snug)',
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {action.title}
                      </h4>
                      <p className="type-caption" style={{
                        margin: '0.15rem 0 0',
                        color: 'var(--text-secondary)',
                      }}>
                        {action.description}
                      </p>
                    </div>
                    <div className="tabular-nums" style={{
                      textAlign: 'right',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.15rem',
                    }}>
                      <span className="type-title tabular-nums" style={{
                        color: isCompleted ? 'var(--success)' : colors.text,
                      }}>
                        {formatRupee(action.amount).replace('₹', '').trim()}
                      </span>
                      {action.taxSaving && action.taxSaving > 0 && (
                        <span className="type-badge tabular-nums" style={{
                          padding: '0.1rem 0.45rem',
                          borderRadius: 'var(--radius-pill)',
                          background: 'var(--badge-emerald-bg)',
                          color: 'var(--badge-emerald-text)',
                          border: '1px solid var(--badge-emerald-border)',
                        }}>
                          Saves {formatRupee(action.taxSaving).replace('₹', '').trim()} tax
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.35rem',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                      }}>
                        {action.section}
                      </span>
                    </span>

                    {action.deadline && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: isOverdue ? 'var(--error)' : hasDeadline ? 'var(--warning)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}>
                        <AlertCircle size={10} style={{ opacity: isOverdue || hasDeadline ? 1 : 0.4 }} />
                        {isOverdue ? 'OVERDUE' : hasDeadline ? `Due ${new Date(action.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Completed'}
                      </span>
                    )}

                    {action.formula && (
                      <button
                        type="button"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-1)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(action.formula);
                        }}
                      >
                        View formula
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {onActionComplete && !isCompleted && (
                    <button
                      type="button"
                      className="icon-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        minHeight: '32px',
                        padding: 0,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                      onClick={(e) => { e.stopPropagation(); onActionComplete(action.id, true); }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
                      aria-label="Mark as done"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}

                  {action.deepLink && (
                    <button
                      type="button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={(e) => { e.stopPropagation(); onActionClick?.(action); }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${colors.bg} 80%, transparent)`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = colors.bg; }}
                    >
                      {action.deepLinkLabel || 'Go'}
                      <ChevronRight size={12} />
                    </button>
                  )}

                  {onActionClick && !action.deepLink && (
                    <button
                      type="button"
                      className="icon-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        minHeight: '32px',
                        padding: 0,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-panel)',
                        backgroundImage: 'var(--neo-convex-grad)',
                        border: '1px solid var(--border-color)',
                        borderTop: 'var(--neo-bevel-top)',
                        boxShadow: 'var(--neo-raised-sm)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                      }}
                      onClick={(e) => { e.stopPropagation(); onActionClick(action); }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-1)'; e.currentTarget.style.borderColor = 'var(--accent-1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                      aria-label="View details"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </InteractiveCard>
    );
  }
);

OptimizationActionList.displayName = 'OptimizationActionList';