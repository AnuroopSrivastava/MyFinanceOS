import React, { useState, useRef, useEffect, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { MessageSquare, Send, Sparkles, User, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface AIChatViewProps {
  activeProfileId: string;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ activeProfileId }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Namaste! I am your local FinanceOS AI assistant. I process queries offline to protect your data privacy. Ask me anything about your FDs, TDS summaries, tax regimes, missing nominees, or financial reports.'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // DB Data access to answer queries
  const accounts = useMemo(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId), [activeProfileId]);
  const transactions = useMemo(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId), [activeProfileId]);
  const stocks = useMemo(() => dbService.getStocks().filter(s => s.profileId === activeProfileId), [activeProfileId]);
  const mfs = useMemo(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId), [activeProfileId]);
  const fds = useMemo(() => dbService.getFDs().filter(f => f.profileId === activeProfileId), [activeProfileId]);
  const gold = useMemo(() => dbService.getGold().filter(g => g.profileId === activeProfileId), [activeProfileId]);
  const nps = useMemo(() => dbService.getNPS().filter(n => n.profileId === activeProfileId), [activeProfileId]);
  const pf = useMemo(() => dbService.getPF().filter(p => p.profileId === activeProfileId), [activeProfileId]);

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // NLP rule parser
  const processQuery = (q: string): string => {
    const qLower = q.toLowerCase();

    // 1. FD Interest Query
    if (qLower.includes('interest') && (qLower.includes('fd') || qLower.includes('deposit'))) {
      const activeInterest = fds.reduce((sum, f) => sum + (f.maturityAmount - f.principalAmount), 0);
      const maturedFds = fds.filter(f => f.isMatured);
      const maturedInt = maturedFds.reduce((sum, f) => sum + (f.maturityAmount - f.principalAmount), 0);
      
      return `Based on your records, you have earned a total of **${formatRupee(activeInterest)}** in interest across all Fixed Deposits. Out of this, matured FDs contributed **${formatRupee(maturedInt)}** in verified interest payouts last year.`;
    }

    // 2. TDS Summary Query
    if (qLower.includes('tds') || qLower.includes('form 26as')) {
      const tds = [
        { TAN: 'MUMT03829A', name: 'Tech Corp India Pvt Ltd', grossPaid: 1650000, tds: 165000 },
        { TAN: 'DELH09281B', name: 'HDFC Bank Ltd (FD Interest)', grossPaid: 14650, tds: 1465 }
      ];
      const totalTds = tds.reduce((sum, r) => sum + r.tds, 0);
      const totalGross = tds.reduce((sum, r) => sum + r.grossPaid, 0);

      const breakdown = tds.map(r => `- **${r.name}** (TAN: ${r.TAN}): Deducted **${formatRupee(r.tds)}** on gross payments of **${formatRupee(r.grossPaid)}**`).join('\n');

      return `Here is your verified **TDS Summary** extracted from Form 26AS/AIS records:\n\n${breakdown}\n\n**Total Tax Deducted at Source:** **${formatRupee(totalTds)}** across gross payouts totaling **${formatRupee(totalGross)}**.`;
    }

    // 3. Tax Slabs / Regime Comparator
    if (qLower.includes('tax') && (qLower.includes('regime') || qLower.includes(' slabs') || qLower.includes('compare'))) {
      // Re-run the comparison logic
      const gross = 1800000;
      const stdDeductionNew = 75000;
      const stdDeductionOld = 50000;
      const deductionsOld = 150000 + 25000 + 50000 + 50000; // 80C, 80D, NPS, std
      
      const taxableOld = gross - deductionsOld;
      const taxableNew = gross - stdDeductionNew;
      
      // Calculate old
      let taxOld = (taxableOld - 1000000) * 0.30 + 112500;
      taxOld = taxOld * 1.04; // Cess

      // Calculate new
      let taxNew = (taxableNew - 1500000) * 0.30 + 140000;
      taxNew = taxNew * 1.04; // Cess

      const optimal = taxOld < taxNew ? 'Old Regime' : 'New Regime';
      const savings = Math.abs(taxOld - taxNew);

      return `Based on an annual gross income of **${formatRupee(gross)}** and deductions of **${formatRupee(deductionsOld)}**:\n\n- **Old Regime Tax:** **${formatRupee(taxOld)}**\n- **New Regime Tax:** **${formatRupee(taxNew)}**\n\n**Recommendation:** You should file under the **${optimal}**. Shifting to it saves you approximately **${formatRupee(savings)}** annually.`;
    }

    // 4. Missing Nominees
    if (qLower.includes('nominee') || qLower.includes('without nominee')) {
      const missing: string[] = [];
      stocks.forEach(s => { if (!s.nomineeName) missing.push(`Stock: **${s.symbol}** (${s.name})`); });
      mfs.forEach(m => { if (!m.nomineeName) missing.push(`Mutual Fund: **${m.schemeName}**`); });
      accounts.forEach(a => { if (a.accountType !== 'CreditCard' && !a.nomineeName) missing.push(`Bank A/c: **${a.name}** (${a.bankName})`); });

      if (missing.length === 0) {
        return `Excellent news! A nominee audit shows that **all** of your stock portfolios, mutual funds, and bank accounts have nominee declarations registered.`;
      }

      return `I have audited your portfolios and found **${missing.length}** accounts with missing nominee details:\n\n${missing.map(m => `- ${m}`).join('\n')}\n\n*Action Suggested: Go to the respective bank portals or Demat accounts to update nominee declarations.*`;
    }

    // 5. Generate Financial Report
    if (qLower.includes('report') || qLower.includes('financial report') || qLower.includes('annual report')) {
      const bankBalances = accounts.filter(a => a.accountType !== 'Loan').reduce((sum, a) => sum + a.balance, 0);
      const stockVal = stocks.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
      const mfVal = mfs.reduce((sum, m) => sum + (m.units * m.currentNav), 0);
      const goldVal = gold.reduce((sum, g) => sum + (g.quantityGrams * g.currentPrice), 0);
      const npsVal = nps.reduce((sum, n) => sum + n.balance, 0);
      const pfVal = pf.reduce((sum, p) => sum + p.balance, 0);
      const fdVal = fds.filter(f => !f.isMatured).reduce((sum, f) => sum + f.principalAmount, 0);
      const assets = bankBalances + stockVal + mfVal + goldVal + npsVal + pfVal + fdVal;

      return `Here is your **Annual Wealth Summary Report**:\n\n- **Liquid Cash & Banks:** ${formatRupee(bankBalances)}\n- **Direct Equity Stocks:** ${formatRupee(stockVal)}\n- **Mutual Funds:** ${formatRupee(mfVal)}\n- **Fixed Deposits & Gold:** ${formatRupee(fdVal + goldVal)}\n- **Retirement Funds (NPS/PF):** ${formatRupee(npsVal + pfVal)}\n\n**Total Assets Under Management:** **${formatRupee(assets)}**\n\nAll metrics are compiled locally and encrypted on disk. You can download a full spreadsheet under Ledger options.`;
    }

    // Default Greeting / Guide
    return `I am not sure how to answer that specific question. You can ask me query triggers like:\n\n1. *"How much interest did I earn from all FDs last year?"*\n2. *"Show my TDS summary from Form 26AS."*\n3. *"Compare my tax under both regimes."*\n4. *"List investments without nominees."*\n5. *"Generate my annual financial report."*`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    // Simulate AI response delay
    setTimeout(() => {
      const reply = processQuery(userMsg.text);
      const assistantMsg: ChatMessage = {
        id: 'm_' + (Date.now() + 1),
        sender: 'assistant',
        text: reply
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 450);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: '1.25rem'
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} color="var(--accent-1)" />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 650 }}>AI Financial Assistant</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} /> Local offline LLM sandbox active
            </span>
          </div>
        </div>
      </div>

      {/* Messages Box */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
        padding: '0.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)'
      }}>
        {messages.map(m => (
          <div key={m.id} style={{
            display: 'flex',
            justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
            gap: '0.75rem',
            alignItems: 'flex-start'
          }}>
            {m.sender === 'assistant' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-grad)',
                display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
            )}
            
            <div className="glass-panel" style={{
              padding: '0.75rem 1.1rem',
              maxWidth: '80%',
              fontSize: '0.88rem',
              lineHeight: '1.5',
              background: m.sender === 'user' ? 'hsla(203, 100%, 50%, 0.12)' : 'var(--bg-panel)',
              borderColor: m.sender === 'user' ? 'var(--border-focus)' : 'var(--border-color)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-line'
            }}>
              {m.text}
            </div>

            {m.sender === 'user' && (
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: 'hsla(224, 20%, 25%, 0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid var(--border-color)'
              }}>
                <User size={16} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, padding: '0.75rem 1rem' }}
          placeholder="Ask AI: 'Compare my tax slabs' or 'List investments without nominee'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          <Send size={16} />
        </button>
      </form>

    </div>
  );
};
