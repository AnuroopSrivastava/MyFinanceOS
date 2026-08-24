/**
 * Shared Recharts presentational styles so every chart in the app renders
 * with the same tooltip, axis, and legend treatment without re-declaring
 * inline style objects per view.
 */

export const chartTooltipStyle = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-color)',
  borderColor: 'var(--border-color)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-tooltip)',
  boxShadow: 'var(--shadow-tooltip)',
  padding: 'var(--spacing-075)',
  fontSize: 'var(--font-sm)',
} as const;

export const chartTooltipItemStyle = {
  fontWeight: 'var(--fw-semibold)',
  color: 'var(--text-primary)',
} as const;

export const chartTooltipLabelStyle = {
  color: 'var(--text-secondary)',
  marginBottom: 'var(--spacing-025)',
} as const;

export const chartAxisStyle = {
  fill: 'var(--text-muted)',
  fontSize: 'var(--font-xs)',
  fontFamily: 'var(--font-body)',
} as const;

export const chartLegendStyle = {
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-sm)',
} as const;