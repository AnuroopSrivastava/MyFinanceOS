/**
 * Transaction domain rules — pure helpers extracted from DatabaseService.
 *
 * Previously the automation-rule matcher and the balance-mutation logic were
 * copy-pasted verbatim across addTransaction / addTransactions /
 * updateTransaction / deleteTransaction. These helpers are the single
 * owner of that behavior; the characterization suite
 * (characterization.test.ts) pins it.
 */
import {
  BankAccount, Transaction, AutomationRule
} from '@financeos/shared';

/** The transaction fields the balance delta depends on. */
export type TxBalanceFields = Pick<Transaction, 'accountId' | 'refAccountId' | 'amount' | 'type'>;

/**
 * Applies the first matching active, profile-scoped automation rule to a
 * transaction's category/tag. Non-numeric AmountOver patterns never match
 * (the comparison threshold is NaN) — pinned behavior.
 */
export function applyAutomationRules(
  tx: Pick<Transaction, 'description' | 'category' | 'amount' | 'profileId' | 'tag'>,
  allRules: AutomationRule[] | undefined
): { category: string; tag?: string } {
  const rules = (allRules || []).filter(r => r.isActive && r.profileId === tx.profileId);
  let category = tx.category;
  let tag = tx.tag;
  for (const r of rules) {
    if (r.triggerType === 'DescriptionContains' && tx.description.toLowerCase().includes(r.matchPattern.toLowerCase())) {
      category = r.targetCategory;
      if (r.targetTag) tag = r.targetTag;
      break;
    } else if (r.triggerType === 'AmountOver') {
      const threshold = parseFloat(r.matchPattern);
      if (Number.isFinite(threshold) && tx.amount >= threshold) {
        category = r.targetCategory;
        if (r.targetTag) tag = r.targetTag;
        break;
      }
    } else if (r.triggerType === 'CategoryMatch' && tx.category.toLowerCase() === r.matchPattern.toLowerCase()) {
      category = r.targetCategory;
      if (r.targetTag) tag = r.targetTag;
      break;
    }
  }
  return { category, tag };
}

/** Credits/debits the source account (and the transfer ref account) for `tx`. */
export function applyTransactionToBalance(accounts: BankAccount[], tx: TxBalanceFields): void {
  const account = accounts.find(a => a.id === tx.accountId);
  if (account) {
    if (tx.type === 'Income') account.balance += tx.amount;
    else if (tx.type === 'Expense') account.balance -= tx.amount;
    else if (tx.type === 'Transfer') account.balance -= tx.amount;
  }
  if (tx.type === 'Transfer' && tx.refAccountId) {
    const refAccount = accounts.find(a => a.id === tx.refAccountId);
    if (refAccount) refAccount.balance += tx.amount;
  }
}

/** Exact inverse of applyTransactionToBalance — used for rollback on update/delete. */
export function reverseTransactionFromBalance(accounts: BankAccount[], tx: TxBalanceFields): void {
  const account = accounts.find(a => a.id === tx.accountId);
  if (account) {
    if (tx.type === 'Income') account.balance -= tx.amount;
    else if (tx.type === 'Expense') account.balance += tx.amount;
    else if (tx.type === 'Transfer') account.balance += tx.amount;
  }
  if (tx.type === 'Transfer' && tx.refAccountId) {
    const refAccount = accounts.find(a => a.id === tx.refAccountId);
    if (refAccount) refAccount.balance -= tx.amount;
  }
}
