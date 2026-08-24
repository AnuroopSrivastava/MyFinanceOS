/**
 * MyFinanceOS className composition helper.
 * Joins conditional class names, filtering falsy values — the single
 * idiom for class composition across the component library.
 */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');