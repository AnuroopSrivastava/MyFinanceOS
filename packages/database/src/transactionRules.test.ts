/**
 * Unit tests for the extracted transaction domain rules
 * (packages/database/src/transactionRules.ts).
 *
 * These pin the behavior now owned by applyAutomationRules /
 * applyTransactionToBalance / reverseTransactionFromBalance — the same
 * cases previously verified end-to-end in characterization.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { applyAutomationRules, applyTransactionToBalance, reverseTransactionFromBalance } from './transactionRules';
import { AutomationRule, BankAccount, Transaction } from '@financeos/shared';

const mkAccount = (id: string, balance: number): BankAccount => ({
  id, profileId: 'p1', name: id, bankName: 'SBI', accountNumber: '1',
  ifscCode: 'SBIN0001', accountType: 'Savings', balance
});

const mkRule = (over: Partial<AutomationRule>): AutomationRule => ({
  id: 'rule_1', profileId: 'p1', name: 'test rule', triggerType: 'DescriptionContains',
  matchPattern: 'swiggy', targetCategory: 'Food Delivery', isActive: true, ...over
} as AutomationRule);

describe('applyAutomationRules', () => {
  const baseTx = { description: 'Swiggy order', category: 'Other', amount: 500, profileId: 'p1', tag: undefined };

  it('applies the first matching rule', () => {
    const out = applyAutomationRules(baseTx, [mkRule({})]);
    expect(out.category).toBe('Food Delivery');
  });

  it('skips rules owned by another profile', () => {
    const out = applyAutomationRules(baseTx, [mkRule({ profileId: 'p2' })]);
    expect(out.category).toBe('Other');
  });

  it('skips inactive rules', () => {
    const out = applyAutomationRules(baseTx, [mkRule({ isActive: false })]);
    expect(out.category).toBe('Other');
  });

  it('treats non-numeric AmountOver thresholds as non-matching (pinned NaN quirk, now explicit)', () => {
    const out = applyAutomationRules(
      { ...baseTx, amount: 999999 },
      [mkRule({ triggerType: 'AmountOver', matchPattern: 'not-a-number', targetCategory: 'Big' })]
    );
    expect(out.category).toBe('Other');
  });

  it('matches AmountOver when amount meets a valid threshold', () => {
    const out = applyAutomationRules(
      { ...baseTx, amount: 15000 },
      [mkRule({ triggerType: 'AmountOver', matchPattern: '10000', targetCategory: 'Big' })]
    );
    expect(out.category).toBe('Big');
  });

  it('sets the target tag only when the rule declares one', () => {
    const withTag = applyAutomationRules(baseTx, [mkRule({ targetTag: 'food' })]);
    expect(withTag.tag).toBe('food');

    const withoutTag = applyAutomationRules({ ...baseTx, tag: 'keep-me' }, [mkRule({ targetTag: undefined })]);
    expect(withoutTag.tag).toBe('keep-me');
  });

  it('handles an undefined rules array', () => {
    const out = applyAutomationRules(baseTx, undefined);
    expect(out.category).toBe('Other');
  });
});

describe('balance helpers', () => {
  const cases: Array<{ type: Transaction['type']; amount: number }> = [
    { type: 'Income', amount: 1000 },
    { type: 'Expense', amount: 1000 },
    { type: 'Transfer', amount: 1000 },
  ];

  it.each(cases)('apply then reverse restores the original balance exactly ($type)', ({ type, amount }) => {
    const accounts = [mkAccount('a1', 5000), mkAccount('a2', 2000)];
    const tx = { accountId: 'a1', refAccountId: 'a2', amount, type };
    applyTransactionToBalance(accounts, tx);
    reverseTransactionFromBalance(accounts, tx);
    expect(accounts[0].balance).toBe(5000);
    expect(accounts[1].balance).toBe(2000);
  });

  it('income credits the account; expense debits it', () => {
    const accounts = [mkAccount('a1', 5000)];
    applyTransactionToBalance(accounts, { accountId: 'a1', amount: 1000, type: 'Income' });
    expect(accounts[0].balance).toBe(6000);
    applyTransactionToBalance(accounts, { accountId: 'a1', amount: 300, type: 'Expense' });
    expect(accounts[0].balance).toBe(5700);
  });

  it('transfer debits source and credits the ref account', () => {
    const accounts = [mkAccount('a1', 5000), mkAccount('a2', 2000)];
    applyTransactionToBalance(accounts, { accountId: 'a1', refAccountId: 'a2', amount: 1000, type: 'Transfer' });
    expect(accounts[0].balance).toBe(4000);
    expect(accounts[1].balance).toBe(3000);
  });

  it('ignores transactions pointing at unknown accounts', () => {
    const accounts = [mkAccount('a1', 5000)];
    applyTransactionToBalance(accounts, { accountId: 'nope', amount: 1000, type: 'Income' });
    expect(accounts[0].balance).toBe(5000);
  });
});
