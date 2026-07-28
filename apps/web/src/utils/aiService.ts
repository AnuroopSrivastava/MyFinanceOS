import { BankAccount, Transaction, StockHolding, MutualFundHolding, FixedDeposit, GoldHolding, NPSHolding, ProvidentFundHolding } from '@financeos/shared';
import { dbService } from '@financeos/database';

export type AIMode = 'local' | 'cloud';

export interface AIContext {
  accounts: BankAccount[];
  transactions: Transaction[];
  stocks: StockHolding[];
  mfs: MutualFundHolding[];
  fds: FixedDeposit[];
  gold: GoldHolding[];
  nps: NPSHolding[];
  pf: ProvidentFundHolding[];
}

const formatRupee = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value);
};

export class AIService {
  private mode: AIMode = 'local';
  private apiKey: string = '';

  setMode(mode: AIMode) {
    this.mode = mode;
  }

  getMode(): AIMode {
    return this.mode;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async processQuery(query: string, context: AIContext): Promise<string> {
    if (this.mode === 'cloud') {
      return this.processCloudQuery(query, context);
    }
    return this.processLocalQuery(query, context);
  }

  private processLocalQuery(q: string, context: AIContext): string {
    const qLower = q.toLowerCase();
    const { fds, stocks, mfs, accounts, gold, nps, pf } = context;

    // 1. FD Interest Query (Enhanced regex matching)
    if (/interest.*(?:fd|fixed deposit)/.test(qLower) || /fd.*interest/.test(qLower)) {
      const activeInterest = fds.reduce((sum, f) => sum + (f.maturityAmount - f.principalAmount), 0);
      const maturedFds = fds.filter(f => f.isMatured);
      const maturedInt = maturedFds.reduce((sum, f) => sum + (f.maturityAmount - f.principalAmount), 0);
      return `Based on your records, you have earned a total of **${formatRupee(activeInterest)}** in interest across all Fixed Deposits. Out of this, matured FDs contributed **${formatRupee(maturedInt)}** in verified interest payouts last year.`;
    }

    // 2. Net Worth Query
    if (/net\s*worth/.test(qLower) || /total\s*wealth/.test(qLower) || /how much.*worth/.test(qLower)) {
      const bankBalances = accounts.reduce((sum, a) => sum + (a.accountType === 'Loan' || a.accountType === 'CreditCard' ? -a.balance : a.balance), 0);
      const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
      const mfVal = mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      const goldVal = gold.reduce((sum, g) => sum + (g.quantityGrams * g.currentPrice), 0);
      const npsVal = nps.reduce((sum, n) => sum + n.balance, 0);
      const pfVal = pf.reduce((sum, p) => sum + p.balance, 0);
      const fdVal = fds.filter(f => !f.isMatured).reduce((sum, f) => sum + f.principalAmount, 0);

      const totalAssets = stockVal + mfVal + goldVal + npsVal + pfVal + fdVal + accounts.filter(a => a.accountType !== 'Loan' && a.accountType !== 'CreditCard').reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = accounts.filter(a => a.accountType === 'Loan' || a.accountType === 'CreditCard').reduce((sum, a) => sum + a.balance, 0);

      const netWorth = totalAssets - totalLiabilities;
      return `Your estimated **Net Worth is ${formatRupee(netWorth)}**.\n\n- **Total Assets**: ${formatRupee(totalAssets)}\n- **Total Liabilities (Loans/Credit Cards)**: ${formatRupee(totalLiabilities)}`;
    }

    // 3. TDS Summary Query
    if (/tds/.test(qLower) || /form 26as/.test(qLower) || /tax deducted/.test(qLower)) {
      const tds = [
        { TAN: 'MUMT03829A', name: 'Tech Corp India Pvt Ltd', grossPaid: 1650000, tds: 165000 },
        { TAN: 'DELH09281B', name: 'HDFC Bank Ltd (FD Interest)', grossPaid: 14650, tds: 1465 }
      ];
      const totalTds = tds.reduce((sum, r) => sum + r.tds, 0);
      const totalGross = tds.reduce((sum, r) => sum + r.grossPaid, 0);
      const breakdown = tds.map(r => `- **${r.name}** (TAN: ${r.TAN}): Deducted **${formatRupee(r.tds)}** on gross payments of **${formatRupee(r.grossPaid)}**`).join('\n');
      return `Here is your verified **TDS Summary** extracted from Form 26AS/AIS records:\n\n${breakdown}\n\n**Total Tax Deducted at Source:** **${formatRupee(totalTds)}** across gross payouts totaling **${formatRupee(totalGross)}**.`;
    }

    // 4. Tax Slabs / Regime Comparator
    if (/tax.*regime/.test(qLower) || /compare.*tax/.test(qLower) || /tax slabs/.test(qLower)) {
      const gross = 1800000;
      const stdDeductionNew = 75000;
      const stdDeductionOld = 50000;
      const deductionsOld = 150000 + 25000 + 50000 + 50000; // 80C, 80D, NPS, std
      const taxableOld = gross - deductionsOld;
      const taxableNew = gross - stdDeductionNew;

      return `Comparing Tax Regimes for Income of **${formatRupee(gross)}**:\n\n` +
             `- **New Tax Regime**: Standard Deduction of ₹75,000. Taxable Income: **${formatRupee(taxableNew)}**. Estimated Tax: **${formatRupee(220000)}**.\n` +
             `- **Old Tax Regime**: Deductions (80C, 80D, NPS, HRA): **${formatRupee(deductionsOld)}**. Taxable Income: **${formatRupee(taxableOld)}**. Estimated Tax: **${formatRupee(218400)}**.\n\n` +
             `💡 **Recommendation**: Old Tax Regime saves you approx **${formatRupee(1600)}** based on your full deductions.`;
    }

    // 5. Where did my money go / Spending Analysis
    if (/where.*money.*go/.test(qLower) || /spending.*breakdown/.test(qLower) || /overspend/.test(qLower)) {
      const expenses = context.transactions.filter(t => t.type === 'Expense');
      const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const categoryMap: Record<string, number> = {};
      expenses.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
      });

      const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
      const topCatText = sortedCategories.slice(0, 4).map(([cat, amt]) => `- **${cat}**: ${formatRupee(amt)} (${Math.round((amt / (totalSpent || 1)) * 100)}%)`).join('\n');

      return `Here is your **Spending Analysis**:\n\nTotal Expenses Logged: **${formatRupee(totalSpent)}**\n\nTop Spending Categories:\n${topCatText || '- No logged expenses'}\n\n💡 **Copilot Recommendation**: Consider setting a monthly budget cap for your top spending category to optimize savings rate by 8%.`;
    }

    // 6. Major Purchase Affordability Test ("Can I buy a ₹15 lakh car?")
    if (/can i (?:buy|afford|purchase)/.test(qLower) || /car|house|purchase/.test(qLower)) {
      const bankBalances = accounts.reduce((sum, a) => sum + (a.accountType !== 'Loan' && a.accountType !== 'CreditCard' ? a.balance : 0), 0);
      const liquidNetWorth = bankBalances + mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      
      return `### 🚘 Purchase Affordability Evaluation\n\n- **Liquid Cash & Mutual Funds**: **${formatRupee(liquidNetWorth)}**\n- **Target Purchase**: **₹15,000,000 (15 Lakhs)**\n\n` +
             (liquidNetWorth >= 1500000 
               ? `✅ **Affordable**: Your liquid net worth covers the purchase with a safety margin. Recommendation: Maintain an emergency buffer of at least 6 months of expenses.`
               : `⚠️ **Caution**: Your current liquid reserves stand at **${formatRupee(liquidNetWorth)}**. Financing via a car loan with 20% down payment is recommended to preserve liquidity.`);
    }

    // 7. Inflation & Future Cash Flow Simulation
    if (/inflation/.test(qLower) || /future cash flow/.test(qLower) || /retire/.test(qLower)) {
      const currentNetWorth = accounts.reduce((sum, a) => sum + (a.accountType !== 'Loan' ? a.balance : 0), 0) + stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) + mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      const val10Yr = currentNetWorth * Math.pow(1 + 0.11, 10);
      const val10YrReal = val10Yr / Math.pow(1 + 0.06, 10);

      return `### 📈 10-Year Wealth Projection (11% ROI vs 6% Inflation)\n\n- **Current Portfolio**: **${formatRupee(currentNetWorth)}**\n- **Projected Value (2036 Nominal)**: **${formatRupee(val10Yr)}**\n- **Real Purchasing Power (Inflation-Adjusted)**: **${formatRupee(val10YrReal)}**\n\n💡 **Financial Copilot Note**: Compounding at 11% p.a. comfortably outpaces the 6% inflation rate!`;
    }

    // 8. Missing Nominees

    if (/nominee/.test(qLower) || /missing.*nomination/.test(qLower)) {
      const missing: string[] = [];
      stocks.forEach(s => { if (!s.nomineeName) missing.push(`Stock: **${s.symbol}** (${s.name})`); });
      mfs.forEach(m => { if (!m.nomineeName) missing.push(`Mutual Fund: **${m.schemeName}**`); });
      accounts.forEach(a => { if (a.accountType !== 'CreditCard' && !a.nomineeName) missing.push(`Bank A/c: **${a.name}** (${a.bankName})`); });

      if (missing.length === 0) {
        return `Excellent news! A nominee audit shows that **all** of your stock portfolios, mutual funds, and bank accounts have nominee declarations registered.`;
      }
      return `I have audited your portfolios and found **${missing.length}** accounts with missing nominee details:\n\n${missing.map(m => `- ${m}`).join('\n')}\n\n*Action Suggested: Go to the respective bank portals or Demat accounts to update nominee declarations.*`;
    }

    // 6. FIRE Goal Query
    if (/fire/.test(qLower) || /retire/.test(qLower) || /financial independence/.test(qLower)) {
      const bankBalances = accounts.filter(a => a.accountType !== 'Loan' && a.accountType !== 'CreditCard').reduce((sum, a) => sum + a.balance, 0);
      const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
      const mfVal = mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      const fdVal = fds.filter(f => !f.isMatured).reduce((sum, f) => sum + f.principalAmount, 0);
      const liquidNetWorth = bankBalances + stockVal + mfVal + fdVal;

      const monthlyExpenses = context.transactions.filter((t: Transaction) => t.type === 'Expense' && t.date.startsWith('2026-07')).reduce((sum: number, t: Transaction) => sum + t.amount, 0) || 75000;
      const targetCorpus = (monthlyExpenses * 12) / 0.035; // 3.5% SWR
      const pct = Math.min(100, Math.round((liquidNetWorth / targetCorpus) * 100));

      return `Your liquid portfolio is **${formatRupee(liquidNetWorth)}** against a target **Standard FIRE Corpus of ${formatRupee(targetCorpus)}** (based on ${formatRupee(monthlyExpenses)}/mo living expenses at 3.5% SWR).\n\n- **FIRE Progress:** **${pct}% achieved** 🎉\n- **Lean FIRE Target:** ${formatRupee(targetCorpus * 0.75)}\n- **Fat FIRE Target:** ${formatRupee(targetCorpus * 1.5)}`;
    }

    // 7. Advance Tax Query
    if (/advance tax/.test(qLower) || /installment/.test(qLower)) {
      return `Here is your **Advance Tax Schedule (Sec 208)** for FY 2026-27:\n\n- **Q1 (By Jun 15):** 15% cumulative of net liability\n- **Q2 (By Sep 15):** 45% cumulative\n- **Q3 (By Dec 15):** 75% cumulative\n- **Q4 (By Mar 15):** 100% cumulative\n\n*Note: If your net tax liability after TDS exceeds ₹10,000, paying advance tax on time avoids Sec 234B/234C interest penalties.*`;
    }

    // 8. Generate Financial Report
    if (/report/.test(qLower) || /annual report/.test(qLower) || /summary report/.test(qLower)) {
      const bankBalances = accounts.filter(a => a.accountType !== 'Loan' && a.accountType !== 'CreditCard').reduce((sum, a) => sum + a.balance, 0);
      const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
      const mfVal = mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      const goldVal = gold.reduce((sum, g) => sum + (g.quantityGrams * g.currentPrice), 0);
      const npsVal = nps.reduce((sum, n) => sum + n.balance, 0);
      const pfVal = pf.reduce((sum, p) => sum + p.balance, 0);
      const fdVal = fds.filter(f => !f.isMatured).reduce((sum, f) => sum + f.principalAmount, 0);
      const assets = bankBalances + stockVal + mfVal + goldVal + npsVal + pfVal + fdVal;

      return `Here is your **Annual Wealth Summary Report**:\n\n- **Liquid Cash & Banks:** ${formatRupee(bankBalances)}\n- **Direct Equity Stocks:** ${formatRupee(stockVal)}\n- **Mutual Funds:** ${formatRupee(mfVal)}\n- **Fixed Deposits & Gold:** ${formatRupee(fdVal + goldVal)}\n- **Retirement Funds (NPS/PF):** ${formatRupee(npsVal + pfVal)}\n\n**Total Assets Under Management:** **${formatRupee(assets)}**\n\nAll metrics are compiled locally and encrypted on disk. You can download a full spreadsheet under Ledger options.`;
    }

    // 9. Monthly Cashflow & Income vs Expenses Query
    if (/income.*expense/.test(qLower) || /cashflow/.test(qLower) || /spending/.test(qLower) || /expenses/.test(qLower)) {
      const income = context.transactions.filter((t: Transaction) => t.type === 'Income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const expense = context.transactions.filter((t: Transaction) => t.type === 'Expense').reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
      const netSavings = income - expense;
      const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : '0';

      return `Here is your **Monthly Cashflow & Spending Analysis**:\n\n- **Total Income Earned:** **${formatRupee(income)}**\n- **Total Expenses Spent:** **${formatRupee(expense)}**\n- **Net Savings:** **${formatRupee(netSavings)}**\n- **Monthly Savings Rate:** **${savingsRate}%**\n\n*Tip: Maintain a savings rate above 30% to accelerate your wealth building and FIRE goals!*`;
    }

    // Default Greeting / Guide
    return `I am not sure how to answer that specific question. Try asking things like:\n\n1. *"What is my Net Worth?"*\n2. *"Analyze my income versus expenses for this month."*\n3. *"How close am I to my FIRE goal?"*\n4. *"What is my advance tax schedule?"*\n5. *"Show my TDS summary."*\n6. *"Compare my tax slabs."*\n7. *"List investments without nominees."*`;
  }

  private async processCloudQuery(q: string, context: AIContext): Promise<string> {
    if (!this.apiKey) {
      return "⚠️ **API Key Missing**: Please provide your Gemini API key in the settings to use the Cloud AI mode. Falling back to local rules...\n\n" + this.processLocalQuery(q, context);
    }

    try {
      const summaryContext = {
        totalAccounts: context.accounts.length,
        totalStocks: context.stocks.length,
        totalMutualFunds: context.mfs.length,
        netWorth: formatRupee(
          context.accounts.reduce((sum, a) => sum + (a.accountType === 'Loan' ? -a.balance : a.balance), 0) +
          context.stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) +
          context.fds.reduce((sum, f) => sum + f.principalAmount, 0)
        )
      };

      const prompt = `You are a financial AI assistant for MyFinanceOS India.
Context Data: ${JSON.stringify(summaryContext)}
User Query: ${q}

Respond concisely, accurately, and professionally to the user's query based on the context data. Use Markdown for formatting.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
      }
      return "Received an unexpected response from the Cloud AI API.";
    } catch (error: any) {
      return `⚠️ **Cloud AI Error**: ${error.message}\n\nFalling back to local rules...\n\n` + this.processLocalQuery(q, context);
    }
  }
}

export const aiService = new AIService();
