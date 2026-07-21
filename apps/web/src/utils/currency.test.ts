import { describe, it, expect } from 'vitest';
import { formatRupee, parseRupeeToNumber } from './currency';

describe('Currency Utilities', () => {
  describe('formatRupee', () => {
    it('should format numbers to Indian currency style', () => {
      // Testing with a space after the symbol to match Intl.NumberFormat behavior for en-IN
      // In Node 20+, it often formats as "₹ 1,00,000.00" or "₹1,00,000.00" depending on ICU version.
      // We will check for the presence of the number and commas.
      const formatted = formatRupee(100000);
      expect(formatted).toContain('1,00,000.00');
      expect(formatted).toContain('₹');
    });

    it('should handle zero correctly', () => {
      const formatted = formatRupee(0);
      expect(formatted).toContain('0.00');
    });

    it('should handle null/undefined/NaN by returning 0', () => {
      expect(formatRupee(null as any)).toContain('0.00');
      expect(formatRupee(undefined)).toContain('0.00');
      expect(formatRupee(NaN)).toContain('0.00');
    });

    it('should handle negative numbers', () => {
      const formatted = formatRupee(-5000.50);
      expect(formatted).toContain('5,000.50');
      expect(formatted).toContain('-');
    });
  });

  describe('parseRupeeToNumber', () => {
    it('should strip currency symbols and commas and return a number', () => {
      expect(parseRupeeToNumber('₹ 1,00,000.00')).toBe(100000);
      expect(parseRupeeToNumber('₹1,00,000')).toBe(100000);
      expect(parseRupeeToNumber('1,00,000')).toBe(100000);
    });

    it('should handle negative strings', () => {
      expect(parseRupeeToNumber('-₹ 50.55')).toBe(-50.55);
    });

    it('should handle empty or invalid strings gracefully', () => {
      expect(parseRupeeToNumber('')).toBe(0);
      expect(parseRupeeToNumber('invalid string')).toBe(0);
    });
  });
});
