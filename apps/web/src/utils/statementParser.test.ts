import { describe, it, expect } from 'vitest';
import { parseStatementText, getCategory, cleanDescription } from './statementParser';

describe('statementParser', () => {
  it('categorizes descriptions accurately based on keywords', () => {
    expect(getCategory('Swiggy order 4829')).toBe('Food & Dining');
    expect(getCategory('Salary payout Google LLC')).toBe('Salary');
    expect(getCategory('Zerodha Broking SIP')).toBe('Investments');
    expect(getCategory('Airtel Broadband bill')).toBe('Utilities');
    expect(getCategory('Uber trip ride')).toBe('Transportation');
    expect(getCategory('Cred payment')).toBe('CreditCard Dues');
    expect(getCategory('House Rent to Landlord')).toBe('Rent');
    expect(getCategory('GST Sales invoice')).toBe('Business Sales');
    expect(getCategory('Random Store XYZ')).toBe('Miscellaneous');
  });

  it('cleans messy UPI strings properly', () => {
    const rawUPI = 'UPI/1234567890/ZOMATO RESTAURANT/HDFC/pay';
    const cleaned = cleanDescription(rawUPI);
    expect(cleaned).toBe('Zomato Restaurant');
  });

  it('parses multi-line statement text with amounts and dates', () => {
    const rawStatement = `
      2026-02-15\tSwiggy Dineout\t-450.00
      2026-02-16\tSalary Payout\t75000.00
      2026-02-17\tTransfer to Cred\t12000.00
    `;

    const parsed = parseStatementText(rawStatement);
    expect(parsed).toHaveLength(3);

    expect(parsed[0].date).toBe('2026-02-15');
    expect(parsed[0].amount).toBe(450);
    expect(parsed[0].type).toBe('Expense');
    expect(parsed[0].category).toBe('Food & Dining');

    expect(parsed[1].date).toBe('2026-02-16');
    expect(parsed[1].amount).toBe(75000);
    expect(parsed[1].type).toBe('Income');
    expect(parsed[1].category).toBe('Salary');

    expect(parsed[2].date).toBe('2026-02-17');
    expect(parsed[2].amount).toBe(12000);
    expect(parsed[2].type).toBe('Transfer');
    expect(parsed[2].category).toBe('CreditCard Dues');
  });

  it('handles withdrawal and deposit columns gracefully', () => {
    const tableData = `
      15/02/2026\tSupermarket Groceries\t1200.00\t0.00
      16/02/2026\tConsulting Fee\t0.00\t25000.00
    `;

    const parsed = parseStatementText(tableData);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].amount).toBe(1200);
    expect(parsed[0].type).toBe('Expense');

    expect(parsed[1].amount).toBe(25000);
    expect(parsed[1].type).toBe('Income');
  });
});
