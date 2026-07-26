import { describe, it, expect, beforeEach } from 'vitest';
import { aiService, AIContext } from './aiService.js';

describe('AIService Unit Tests', () => {
  let mockContext: AIContext;

  beforeEach(() => {
    mockContext = {
      accounts: [
        { id: 'acc1', profileId: 'p1', name: 'HDFC Savings', bankName: 'HDFC', accountNumber: '1234', ifscCode: 'HDFC0001', accountType: 'Savings', balance: 100000, nomineeName: 'Nominee A' },
        { id: 'acc2', profileId: 'p1', name: 'SBI Card', bankName: 'SBI', accountNumber: '5678', ifscCode: 'N/A', accountType: 'CreditCard', balance: -10000 }
      ],
      transactions: [
        { id: 't1', accountId: 'acc1', profileId: 'p1', date: '2026-07-01', description: 'Salary', amount: 150000, type: 'Income', category: 'Salary' },
        { id: 't2', accountId: 'acc1', profileId: 'p1', date: '2026-07-05', description: 'Rent', amount: 25000, type: 'Expense', category: 'Rent' }
      ],
      stocks: [
        { id: 's1', profileId: 'p1', symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 10, averagePrice: 3500, currentPrice: 4000, nomineeName: 'Nominee A' }
      ],
      mfs: [
        { id: 'm1', profileId: 'p1', schemeCode: '1001', schemeName: 'Flexi Cap Fund', units: 100, averageNav: 50, currentNav: 60, nomineeName: 'Nominee A' }
      ],
      fds: [
        { id: 'f1', profileId: 'p1', bankName: 'HDFC Bank', principalAmount: 50000, interestRate: 7, startDate: '2025-01-01', maturityDate: '2026-01-01', maturityAmount: 53500, isMatured: true },
        { id: 'f2', profileId: 'p1', bankName: 'ICICI Bank', principalAmount: 100000, interestRate: 7.5, startDate: '2026-01-01', maturityDate: '2027-01-01', maturityAmount: 107500, isMatured: false }
      ],
      gold: [
        { id: 'g1', profileId: 'p1', itemType: 'Digital Gold', quantityGrams: 10, buyPricePerGram: 6000, currentPrice: 7000 }
      ],
      nps: [
        { id: 'n1', profileId: 'p1', pranNumber: '11002233', balance: 200000, tier: 'Tier-1' }
      ],
      pf: [
        { id: 'p1', profileId: 'p1', uanNumber: '100900800', balance: 300000, passbookBalance: 300000 }
      ]
    };
  });

  it('should correctly switch between local and cloud modes', () => {
    aiService.setMode('local');
    expect(aiService.getMode()).toBe('local');

    aiService.setMode('cloud');
    expect(aiService.getMode()).toBe('cloud');

    aiService.setApiKey('test_key_123');
    expect(aiService.getApiKey()).toBe('test_key_123');
  });

  it('should process Net Worth query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('What is my Net Worth?', mockContext);
    expect(response).toContain('Net Worth is');
    expect(response).toContain('Total Assets');
    expect(response).toContain('Total Liabilities');
  });

  it('should process FD Interest query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('How much FD interest have I earned?', mockContext);
    expect(response).toContain('Fixed Deposits');
    expect(response).toContain('matured FDs');
  });

  it('should process Nominee audit query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('Check missing nominees', mockContext);
    expect(response).toContain('nominee audit');
  });

  it('should process FIRE goal query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('How close am I to my FIRE goal?', mockContext);
    expect(response).toContain('FIRE Progress');
    expect(response).toContain('Lean FIRE Target');
  });

  it('should process Advance Tax query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('What is my advance tax schedule?', mockContext);
    expect(response).toContain('Advance Tax Schedule');
    expect(response).toContain('Sec 208');
  });

  it('should process Monthly Cashflow query accurately', async () => {
    aiService.setMode('local');
    const response = await aiService.processQuery('Analyze my income versus expenses for this month.', mockContext);
    expect(response).toContain('Monthly Cashflow & Spending Analysis');
    expect(response).toContain('Total Income Earned');
    expect(response).toContain('Total Expenses Spent');
    expect(response).toContain('Monthly Savings Rate');
  });
});
