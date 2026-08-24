import { describe, it, expect } from 'vitest';
import { calculateEMI, calculateSIPFutureValue, calculateFIRECorpus, calculateGST } from './financialCalculations';

// Property-based fuzzing of the shared production formulas (./financialCalculations).
// These invariants pin the canonical module used by the UI, not a duplicated copy.

describe('Financial Formulas — Property-Based Fuzzing Test Suite', () => {
  it('EMI formula should never produce NaN or Infinity for 500 random valid inputs', () => {
    for (let i = 0; i < 500; i++) {
      const principal = Math.floor(Math.random() * 10000000); // Up to 1 Crore
      const rate = Math.random() * 30; // 0% to 30% pa
      const tenure = Math.floor(Math.random() * 360) + 1; // 1 to 360 months

      const emi = calculateEMI(principal, rate, tenure);

      expect(Number.isNaN(emi)).toBe(false);
      expect(Number.isFinite(emi)).toBe(true);
      expect(emi).toBeGreaterThanOrEqual(0);
      if (principal > 0) {
        // Since EMI is rounded to nearest integer (Math.round), integer truncation over N months allows a tolerance of N
        expect(emi * tenure).toBeGreaterThanOrEqual(principal - tenure);
      }
    }
  });

  it('SIP Future Value formula should never produce NaN or Infinity for 500 random valid inputs', () => {
    for (let i = 0; i < 500; i++) {
      const sip = Math.floor(Math.random() * 500000); // Up to 5 Lakhs/mo
      const rate = Math.random() * 25; // 0% to 25% pa
      const years = Math.floor(Math.random() * 40) + 1; // 1 to 40 years

      const fv = calculateSIPFutureValue(sip, rate, years);

      expect(Number.isNaN(fv)).toBe(false);
      expect(Number.isFinite(fv)).toBe(true);
      expect(fv).toBeGreaterThanOrEqual(sip * years * 12); // Future value >= invested capital
    }
  });

  it('FIRE Corpus formula should be strictly positive and finite for positive inputs', () => {
    for (let i = 0; i < 500; i++) {
      const expense = Math.floor(Math.random() * 1000000) + 1000; // 1k to 10L/mo
      const swr = Math.random() * 5 + 1; // 1% to 6% SWR

      const corpus = calculateFIRECorpus(expense, swr);

      expect(Number.isNaN(corpus)).toBe(false);
      expect(Number.isFinite(corpus)).toBe(true);
      expect(corpus).toBeGreaterThan(expense * 12); // Corpus > 1 year expense
    }
  });

  it('GST calculation should satisfy CGST + SGST = TotalTax for intra-state across 500 random inputs', () => {
    for (let i = 0; i < 500; i++) {
      const taxable = Math.floor(Math.random() * 1000000);
      const rates = [0, 5, 12, 18, 28];
      const rate = rates[Math.floor(Math.random() * rates.length)];

      const gst = calculateGST(taxable, rate, false);

      expect(Number.isNaN(gst.totalTax)).toBe(false);
      expect(gst.cgst + gst.sgst).toBe(gst.totalTax);
      expect(gst.totalAmount).toBe(taxable + gst.totalTax);
    }
  });
});
