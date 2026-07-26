import React, { useState, useRef, useEffect, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { MessageSquare, Send, Sparkles, User, ShieldCheck, Cloud, Settings, Compass } from 'lucide-react';
import { aiService, AIMode } from '../utils/aiService.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface AIChatViewProps {
  activeProfileId: string;
}

const QUICK_PROMPTS = [
  { label: '📊 Net Worth Summary', prompt: 'Give me a complete net worth summary and breakdown across my accounts.' },
  { label: '🔥 FIRE Goal Progress', prompt: 'How close am I to my FIRE retirement goal based on my current liquid net worth?' },
  { label: '⚖️ Tax Regime Comparison', prompt: 'Compare my tax liability between Old and New Indian tax regimes.' },
  { label: '🏛️ Advance Tax Schedule', prompt: 'What are my estimated quarterly advance tax installment dates and amounts?' },
  { label: '🛡️ Nominee Audit Check', prompt: 'Which of my accounts or investment assets are missing nominees?' },
  { label: '💸 Monthly Cashflow', prompt: 'Analyze my income versus expenses for this month.' }
];

const FormattedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  const renderFormattedInline = (str: string) => {
    // Split by bold syntax **
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return <strong key={idx} style={{ color: '#fff', fontWeight: 700 }}>{content}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        const content = part.slice(1, -1);
        return <em key={idx} style={{ color: 'var(--text-secondary)' }}>{content}</em>;
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} style={{ height: '0.2rem' }} />;

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', paddingLeft: '0.4rem' }}>
              <span style={{ color: 'var(--accent-1)', fontSize: '0.9rem', lineHeight: '1.4' }}>•</span>
              <span style={{ flex: 1 }}>{renderFormattedInline(trimmed.substring(2))}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+\.)\s*(.*)/);
          if (numMatch) {
            return (
              <div key={lineIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', paddingLeft: '0.4rem' }}>
                <span style={{ color: 'var(--accent-1)', fontWeight: 600, fontSize: '0.85rem' }}>{numMatch[1]}</span>
                <span style={{ flex: 1 }}>{renderFormattedInline(numMatch[2])}</span>
              </div>
            );
          }
        }

        return <div key={lineIdx}>{renderFormattedInline(line)}</div>;
      })}
    </div>
  );
};

export const AIChatView: React.FC<AIChatViewProps> = ({ activeProfileId }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<AIMode>(aiService.getMode());
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Namaste! I am your FinanceOS AI assistant. I can run locally for absolute privacy or use cloud AI for advanced queries. Ask me about your net worth, TDS summaries, tax regimes, or financial reports.'
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

  const aiContext = useMemo(() => ({ accounts, transactions, stocks, mfs, fds, gold, nps, pf }), [accounts, transactions, stocks, mfs, fds, gold, nps, pf]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    aiService.setMode(newMode);
    if (newMode === 'cloud' && !apiKey) {
      setShowSettings(true);
    }
  };

  const handleSaveSettings = () => {
    aiService.setApiKey(apiKey);
    setShowSettings(false);
  };

  const processQueryText = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const reply = await aiService.processQuery(userMsg.text, aiContext);
        const assistantMsg: ChatMessage = {
          id: 'm_' + (Date.now() + 1),
          sender: 'assistant',
          text: reply
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: 'm_' + (Date.now() + 1),
          sender: 'assistant',
          text: 'An error occurred while processing your request. Please check your AI key or network connection.'
        }]);
      } finally {
        setIsProcessing(false);
      }
    }, 450);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processQueryText(query);
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
            <span style={{ fontSize: '0.72rem', color: mode === 'local' ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {mode === 'local' ? (
                <><ShieldCheck size={12} /> Local offline LLM active</>
              ) : (
                <><Cloud size={12} /> Cloud AI active (Gemini)</>
              )}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
            <button 
              type="button"
              onClick={() => handleModeChange('local')}
              style={{
                padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                background: mode === 'local' ? 'var(--accent-grad)' : 'transparent',
                color: mode === 'local' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontWeight: 600
              }}
            >
              Local
            </button>
            <button 
              type="button"
              onClick={() => handleModeChange('cloud')}
              style={{
                padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                background: mode === 'cloud' ? 'var(--accent-grad)' : 'transparent',
                color: mode === 'cloud' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontWeight: 600
              }}
            >
              Cloud
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setShowSettings(!showSettings)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div style={{ 
          background: 'var(--bg-panel)', padding: '1rem', borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Gemini API Key</label>
            <input 
              type="password" 
              className="form-input" 
              style={{ width: '100%', padding: '0.5rem' }} 
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSaveSettings}>Save</button>
        </div>
      )}

      {/* Messages Box */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
        padding: '0.5rem', marginBottom: '0.75rem', borderRadius: 'var(--radius-sm)'
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
              color: 'var(--text-primary)'
            }}>
              <FormattedMarkdown text={m.text} />
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
        {isProcessing && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div className="glass-panel" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Analyzing financial context...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* One-click Quick Prompts */}
      <div style={{
        display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.6rem', marginBottom: '0.5rem',
        scrollbarWidth: 'none'
      }}>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            type="button"
            className="btn btn-secondary"
            onClick={() => processQueryText(qp.prompt)}
            disabled={isProcessing}
            style={{
              fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap',
              borderRadius: '2rem', background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border-color)'
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, padding: '0.75rem 1rem' }}
          placeholder={mode === 'local' ? "Ask AI: 'Compare my tax slabs' or 'Net worth'..." : "Ask Gemini anything about your finances..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }} disabled={isProcessing || !query.trim()}>
          <Send size={16} />
        </button>
      </form>

    </div>
  );
};
