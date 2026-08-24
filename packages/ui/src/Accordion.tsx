import React, { useState, useId } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AccordionItemData {
  id: string;
  title: string | React.ReactNode;
  content: string | React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  /** Items to render in accordion */
  items: AccordionItemData[];
  /** Controlled expanded item IDs */
  expandedIds?: string[];
  /** Default expanded IDs for uncontrolled mode */
  defaultExpandedIds?: string[];
  /** Change callback */
  onChange?: (expandedIds: string[]) => void;
  /** Allow multiple items open simultaneously (default: false) */
  allowMultiple?: boolean;
  /** Icon style for expand/collapse toggle */
  iconVariant?: 'chevron' | 'plus';
  /** Visual variant */
  variant?: 'default' | 'card' | 'bordered';
  /** Custom className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds = [],
  onChange,
  allowMultiple = false,
  iconVariant = 'plus',
  variant = 'default',
  className = '',
  style,
}) => {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpandedIds);
  const isControlled = controlledExpandedIds !== undefined;
  const activeExpanded = isControlled ? controlledExpandedIds : internalExpanded;

  const toggleItem = (id: string) => {
    let next: string[];
    const isCurrentlyOpen = activeExpanded.includes(id);

    if (allowMultiple) {
      next = isCurrentlyOpen ? activeExpanded.filter((item) => item !== id) : [...activeExpanded, id];
    } else {
      next = isCurrentlyOpen ? [] : [id];
    }

    if (!isControlled) {
      setInternalExpanded(next);
    }
    onChange?.(next);
  };

  return (
    <div
      className={`accordion-container ${className}`.trim()}
      style={{ display: 'flex', flexDirection: 'column', ...style }}
    >
      {items.map((item, index) => {
        const isOpen = activeExpanded.includes(item.id);
        const headingId = `accordion-heading-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        const isCard = variant === 'card';
        const isBordered = variant === 'bordered';

        return (
          <div
            key={item.id}
            style={{
              borderBottom: isBordered || variant === 'default' ? '1px solid var(--border-color)' : 'none',
              padding: isCard ? '1.15rem 1.25rem' : '1.25rem 0',
              marginBottom: isCard ? '0.75rem' : '0',
              background: isCard ? 'var(--bg-panel)' : 'transparent',
              borderRadius: isCard ? 'var(--radius-md)' : '0',
              border: isCard ? '1px solid var(--border-color)' : undefined,
              boxShadow: isCard ? 'var(--neo-raised-sm)' : undefined,
            }}
          >
            <button
              type="button"
              id={headingId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              disabled={item.disabled}
              onClick={() => !item.disabled && toggleItem(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.05rem',
                fontWeight: 650,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                padding: 0,
                opacity: item.disabled ? 0.5 : 1,
                gap: '1rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {item.icon && <span style={{ color: 'var(--accent-1)' }}>{item.icon}</span>}
                <span>{item.title}</span>
              </span>

              <span
                style={{
                  color: 'var(--accent-1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform:
                    iconVariant === 'plus'
                      ? isOpen
                        ? 'rotate(45deg)'
                        : 'rotate(0deg)'
                      : isOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}
              >
                {iconVariant === 'plus' ? <Plus size={18} strokeWidth={2.5} /> : <ChevronDown size={18} />}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
