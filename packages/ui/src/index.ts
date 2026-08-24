// Export UI modules and theme helpers
import { STORAGE_KEYS } from '@financeos/shared';
import { playTactileClick } from './utils/haptics.js';

export { Button } from './Button.js';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.js';
export * from './CurrencyInput.js';
export { FormField } from './FormField.js';
export type { FormFieldProps } from './FormField.js';
export { InteractiveCard, useInteractiveCardSystem } from './InteractiveCard.js';
export type { InteractiveCardIntensity } from './InteractiveCard.js';
export { MetricCard } from './MetricCard.js';
export type { MetricCardProps, MetricCardVariant } from './MetricCard.js';
export { DataTable } from './DataTable.js';
export type { DataTableProps, DataTableColumn } from './DataTable.js';
export { Modal, ConfirmDialog, ConfirmModal, useConfirmModal } from './Modal.js';
export type { ModalProps, ModalSize, ConfirmDialogProps, ConfirmModalProps, ConfirmModalState } from './Modal.js';
export { PinDots, PadBtn, NumberPad, PAD_ROWS, PAD_LABELS } from './PinPad.js';
export type { PinDotsProps, PadBtnProps, NumberPadProps } from './PinPad.js';
export { FormattedMarkdown } from './FormattedMarkdown.js';
export type { FormattedMarkdownProps } from './FormattedMarkdown.js';
export { SectionHeader } from './SectionHeader.js';
export type { SectionHeaderProps } from './SectionHeader.js';
export { PanelHeader } from './PanelHeader.js';
export type { PanelHeaderProps } from './PanelHeader.js';
export { InfoCallout } from './InfoCallout.js';
export type { InfoCalloutProps, InfoCalloutVariant } from './InfoCallout.js';
export { FormActions } from './FormActions.js';
export type { FormActionsProps } from './FormActions.js';
export { Slider } from './Slider.js';
export type { SliderProps } from './Slider.js';
export { Badge, StatusBadge } from './Badge.js';
export type { BadgeProps, BadgeVariant, BadgeSize, StatusBadgeProps } from './Badge.js';
export { ActionRow, ActionRowGroup } from './ActionRow.js';
export type { ActionRowProps, ActionRowGroupProps } from './ActionRow.js';
export { IconInput } from './IconInput.js';
export type { IconInputProps } from './IconInput.js';
export { Tabs } from './Tabs.js';
export type { TabsProps, TabItem } from './Tabs.js';
export { EmptyState } from './EmptyState.js';
export type { EmptyStateProps } from './EmptyState.js';
export { ProgressIndicators, CircularProgress, LinearProgress } from './ProgressIndicators.js';
export type { CircularProgressProps, LinearProgressProps } from './ProgressIndicators.js';
export { TaxRegimeToggle } from './TaxRegimeToggle.js';
export type { TaxRegimeToggleProps, TaxRegime } from './TaxRegimeToggle.js';
export { DeductionCard } from './DeductionCard.js';
export type { DeductionCardProps } from './DeductionCard.js';
export { OptimizationActionList } from './OptimizationActionList.js';
export type { OptimizationActionListProps, OptimizationAction, ActionPriority, ActionCategory } from './OptimizationActionList.js';
export { TaxExportButton, generateTaxReport } from './TaxExportButton.js';
export type { TaxExportButtonProps, TaxExportData } from './TaxExportButton.js';
export { RadialGauge } from './RadialGauge.js';
export type { RadialGaugeProps, RadialGaugeVariant } from './RadialGauge.js';
export { Accordion } from './Accordion.js';
export type { AccordionProps, AccordionItemData } from './Accordion.js';
export { QuickstartGuide } from './QuickstartGuide.js';
export type { QuickstartGuideProps, QuickstartStep } from './QuickstartGuide.js';
export { SearchFilterBar } from './SearchFilterBar.js';
export type { SearchFilterBarProps, FilterDropdown, FilterOption, CategoryPill } from './SearchFilterBar.js';
export { playTactileClick } from './utils/haptics.js';
export type { TactileFeedbackType } from './utils/haptics.js';
export { useReducedMotion, getMotionProps } from './utils/useReducedMotion.js';
export { Toaster, useToast, toast } from './Toast.js';
export type { Toast } from './Toast.js';
export { CommandPalette, createCommandPalette } from './CommandPalette.js';
export type { CommandItem, CommandGroup, CommandPaletteProps } from './CommandPalette.js';
export { Select, MultiSelect, Avatar, AvatarGroup } from './Select.js';
export type { SelectProps, MultiSelectProps, AvatarProps, AvatarGroupProps } from './Select.js';
export { cx } from './utils/cx.js';
export { IconButton } from './IconButton.js';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton.js';
export { TimelineSegmentedFilter } from './TimelineSegmentedFilter.js';
export type { TimelineSegmentedFilterProps } from './TimelineSegmentedFilter.js';
export { DateRangePicker } from './DateRangePicker.js';
export type { DateRangePickerProps, DateRange, DateRangePreset } from './DateRangePicker.js';
export { SummaryMetricGrid } from './SummaryMetricGrid.js';
export type { SummaryMetricGridProps } from './SummaryMetricGrid.js';
export { FileDropzone } from './FileDropzone.js';
export type { FileDropzoneProps } from './FileDropzone.js';
export { StatRow } from './StatRow.js';
export type { StatRowProps } from './StatRow.js';
export { PaginationControls } from './PaginationControls.js';
export type { PaginationControlsProps } from './PaginationControls.js';
export { CopyableField } from './CopyableField.js';
export type { CopyableFieldProps } from './CopyableField.js';
export { FormRow } from './FormRow.js';
export type { FormRowProps, FormRowColumns } from './FormRow.js';
export {
  chartTooltipStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartAxisStyle,
  chartLegendStyle,
} from './chartStyles.js';

export type AppTheme = 'dark' | 'light' | 'glass-cyan' | 'glass-emerald' | 'glass-gold';

export const setTheme = (theme: AppTheme): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Trigger subtle tactile feedback
  playTactileClick('toggle');

  // Set theme attribute
  root.setAttribute('data-theme', theme);
  
  // Persist choice
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      /* ignore storage quota / disabled errors */
    }
  }
};

export const getSavedTheme = (): AppTheme => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 'glass-cyan';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) as AppTheme;
    return saved || 'glass-cyan';
  } catch {
    return 'glass-cyan';
  }
};
