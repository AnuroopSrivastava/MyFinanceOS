import React, { useState, useRef, useEffect, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { MessageSquare, Send, Sparkles, User, ShieldCheck, Cloud, Settings } from 'lucide-react';
import { aiService, AIMode } from '../utils/aiService.js';

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
  const [mode, setMode] = useState<AIMode>(aiService.getMode());
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [showSettings, setShowSettings] = useState(false);
  
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');

    // Simulate small typing delay for local, natural delay for network
    setTimeout(async () => {
      const reply = await aiService.processQuery(userMsg.text, aiContext);
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
          placeholder={mode === 'local' ? "Ask AI: 'Compare my tax slabs' or 'Net worth'..." : "Ask Gemini anything about your finances..."}
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

