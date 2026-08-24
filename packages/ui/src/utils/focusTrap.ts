/**
 * MyFinanceOS focus-trap utilities.
 * Shared by Modal and ConfirmModal so the focusable selector and Tab
 * cycling logic live in exactly one place.
 */
export const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

/**
 * Cycles focus on Tab/shift+Tab within a dialog container.
 * Returns true when the event was handled.
 */
export const trapTabKey = (e: KeyboardEvent, container: HTMLElement | null): boolean => {
  if (!container) return false;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
};