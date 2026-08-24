/**
 * MyFinanceOS color composition helpers.
 * `tint` layers a CSS color variable at a given alpha without the hex-suffix
 * hack (which breaks once the underlying value resolves to a var() or rgba()).
 */
export const tint = (colorVar: string, pct: number): string =>
  `color-mix(in srgb, ${colorVar} ${pct}%, transparent)`;