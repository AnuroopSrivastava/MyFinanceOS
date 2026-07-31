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
  { label: '📊 Where did my money go?', prompt: 'Where did my money go this month? Show spending breakdown and category analysis.' },
  { label: '🚘 Can I buy a ₹15 lakh car?', prompt: 'Can I buy a ₹15 lakh car based on my current liquid net worth, monthly cash flow, and emergency fund safety margin?' },
  { label: '🌅 Can I retire by 2045?', prompt: 'Can I retire by 2045? Calculate projected wealth, required SIP, inflation-adjusted corpus, and SWR withdrawal plan.' },
  { label: '📈 What if inflation becomes 7%?', prompt: 'What if inflation increases to 7%? Model long-term corpus purchasing power and required step-up SIP.' },
  { label: '💡 How much tax will I save?', prompt: 'How much tax will I save under the New Tax Regime vs Old Tax Regime with 80C, 80D, and NPS?' },
  { label: '🚀 Should I increase SIP?', prompt: 'Should I increase my monthly SIP by 15%? Project portfolio growth delta over 10 years.' },
  { label: '📑 Generate Monthly Report', prompt: 'Generate a comprehensive executive monthly financial report and cash flow synthesis.' },
  { label: '⚖️ Compare 2025 vs 2026', prompt: 'Compare 2025 vs 2026 financial metrics, savings rate, and portfolio trajectory.' }
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
  
  const initialWelcome: ChatMessage = {
    id: 'm1',
    sender: 'assistant',
    text: 'Namaste! I am your FinanceOS AI assistant. I can run locally for absolute privacy or use cloud AI for advanced queries. Ask me about your net worth, TDS summaries, tax regimes, or financial reports.'
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcome]);
  const [isLoaded, setIsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved chat history on profile switch
  useEffect(() => {
    try {
      const saved = dbService.getChatHistory(activeProfileId);
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        setMessages([initialWelcome]);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    } finally {
      setIsLoaded(true);
    }
  }, [activeProfileId]);

  // Auto-Save chat history on change
  useEffect(() => {
    if (!isLoaded) return;
    dbService.saveChatHistory(activeProfileId, messages).catch(console.error);
  }, [messages, activeProfileId, isLoaded]);

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
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1.25rem'
    }}>

      {/* Page Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1 1 min-content', minWidth: '280px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--accent-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px hsla(220, 80%, 50%, 0.25)',
            flexShrink: 0,
            marginTop: '0.2rem'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.25 }}>
                AI Financial Assistant
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {mode === 'local' ? (
                <><ShieldCheck size={12} color="var(--success)" /> <span style={{ color: 'var(--success)' }}>Local offline model active</span></>
              ) : (
                <><Cloud size={12} color="var(--warning)" /> <span style={{ color: 'var(--warning)' }}>Cloud AI active (Gemini)</span></>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)',
            padding: '3px', border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onPointerDown={() => handleModeChange('local')}
              style={{
                padding: '0.35rem 1rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                background: mode === 'local' ? 'var(--accent-grad)' : 'transparent',
                color: mode === 'local' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: mode === 'local' ? '0 2px 8px rgba(6, 182, 212, 0.25)' : 'none'
              }}
            >
              Local
            </button>
            <button
              type="button"
              onPointerDown={() => handleModeChange('cloud')}
              style={{
                padding: '0.35rem 1rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)',
                background: mode === 'cloud' ? 'var(--accent-grad)' : 'transparent',
                color: mode === 'cloud' ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: mode === 'cloud' ? '0 2px 8px rgba(6, 182, 212, 0.25)' : 'none'
              }}
            >
              Cloud
            </button>
          </div>
          <button
            type="button"
            onPointerDown={() => setShowSettings(!showSettings)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', padding: '0.4rem', cursor: 'pointer',
              color: 'var(--text-secondary)', transition: 'background 0.2s ease'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{
        display: 'flex', flexDirection: 'column', flex: 1, padding: '1rem',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden'
      }}>

      {showSettings && (
        <div className="glass-panel" style={{
          padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-end',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Gemini API Key</label>
            <input
              type="password"
              className="form-input"
              style={{ width: '100%', padding: '0.6rem 0.8rem' }}
              placeholder="Enter your API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onPointerDown={handleSaveSettings} style={{ padding: '0.6rem 1.25rem' }}>Save Key</button>
        </div>
      )}

      {/* Messages Box */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem',
        padding: '0.5rem 0.5rem 1rem 0.5rem', marginBottom: '1rem', scrollbarWidth: 'thin'
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
                width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles size={18} color="var(--accent-1)" />
              </div>
            )}

            <div className={m.sender === 'user' ? "" : "glass-panel"} style={{
              padding: '1rem 1.25rem',
              maxWidth: '85%',
              borderRadius: m.sender === 'user' ? '1rem 1rem 0 1rem' : '0 1rem 1rem 1rem',
              fontSize: '0.92rem',
              lineHeight: '1.6',
              background: m.sender === 'user' ? 'var(--accent-grad)' : 'var(--bg-panel)',
              border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
              boxShadow: m.sender === 'user' ? '0 4px 15px rgba(6, 182, 212, 0.2)' : '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <FormattedMarkdown text={m.text} />
            </div>

            {m.sender === 'user' && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid var(--border-color)'
              }}>
                <User size={18} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', animation: 'fade-in 0.3s ease' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={18} color="var(--accent-1)" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', borderRadius: '0 1rem 1rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }}></span>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></span>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></span>
              <span style={{ marginLeft: '0.5rem' }}>Analyzing financial context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* One-click Quick Prompts */}
      <div className="mobile-tabs-scroll" style={{
        display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.5rem'
      }}>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            type="button"
            className="btn glass-panel"
            onPointerDown={() => processQueryText(qp.prompt)}
            disabled={isProcessing}
            style={{
              fontSize: '0.78rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap',
              borderRadius: '2rem', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontWeight: 500,
              background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <input
          type="text"
          style={{ flex: 1, padding: '0.6rem 1rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
          placeholder={mode === 'local' ? "Ask AI: 'Compare my tax slabs' or 'Net worth'..." : "Ask Gemini anything about your finances..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={isProcessing || !query.trim()}>
          <Send size={18} />
        </button>
      </form>

    </div>
    </div>
  );
};
