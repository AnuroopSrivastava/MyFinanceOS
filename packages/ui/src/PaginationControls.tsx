import React from 'react';
import { Button } from './Button.js';
import { playTactileClick } from './utils/haptics.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationControlsProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of available pages */
  totalPages: number;
  /** Total count of items across all pages */
  totalItems?: number;
  /** Number of items displayed per page */
  pageSize?: number;
  /** Label for items (e.g. "items", "records", "months", "transactions") */
  itemLabel?: string;
  /** Callback when page is changed */
  onPageChange: (page: number) => void;
  /** Whether to show the item count summary (e.g. Showing 1–25 of 100) */
  showItemCount?: boolean;
  /** Visual variant: standard (full bar) or compact (minimal buttons only) */
  variant?: 'standard' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = 'items',
  onPageChange,
  showItemCount = true,
  variant = 'standard',
  className = '',
  style
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    if (clamped !== currentPage) {
      playTactileClick('soft');
      onPageChange(clamped);
    }
  };

  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  return (
    <nav
      aria-label="Pagination"
      className={`pagination-controls ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--spacing-075)',
        paddingTop: 'var(--spacing-05)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 'var(--font-xs)',
        gap: 'var(--spacing-075)',
        flexWrap: 'wrap',
        ...style
      }}
    >
      {/* Item summary readout */}
      {showItemCount && (
        <span
          style={{
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-025)'
          }}
        >
          {startItem !== undefined && endItem !== undefined && totalItems !== undefined ? (
            <>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>{startItem}–{endItem}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>{totalItems}</span> {itemLabel}
            </>
          ) : (
            <>
              Page <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>{currentPage}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>{totalPages}</span>
            </>
          )}
        </span>
      )}

      {/* Button navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', marginLeft: 'auto' }}>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Previous Page"
          style={{
            padding: variant === 'compact' ? 'var(--spacing-02) var(--spacing-04)' : 'var(--spacing-025) var(--spacing-06)',
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-02)'
          }}
        >
          <ChevronLeft size={13} />
          {variant !== 'compact' && <span>Prev</span>}
        </Button>

        {/* Page status for compact or non-item count mode */}
        {!showItemCount && (
          <span style={{ color: 'var(--text-secondary)', padding: '0 var(--spacing-02)', fontVariantNumeric: 'tabular-nums', fontWeight: 'var(--fw-medium)' }}>
            {currentPage} / {totalPages}
          </span>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Next Page"
          style={{
            padding: variant === 'compact' ? 'var(--spacing-02) var(--spacing-04)' : 'var(--spacing-025) var(--spacing-06)',
            fontSize: 'var(--font-xs)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-02)'
          }}
        >
          {variant !== 'compact' && <span>Next</span>}
          <ChevronRight size={13} />
        </Button>
      </div>
    </nav>
  );
};
