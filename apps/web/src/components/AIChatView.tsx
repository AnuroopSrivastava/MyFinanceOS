import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, IconButton, FormattedMarkdown, SectionHeader, Tabs, CopyableField, FormField } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { useDbVersion } from '../hooks/useDbSync.js';
import { MessageSquare, Send, Sparkles, User, ShieldCheck, Cloud, Settings, Compass, Trash2 } from 'lucide-react';
import { aiService, AIMode } from '../utils/aiService.js';
import { ConfirmModal, useConfirmModal } from './ConfirmModal.js';

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

export const AIChatView: React.FC<AIChatViewProps> = ({ activeProfileId }) => {
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();
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
  const dbVersion = useDbVersion();
  const accounts = useMemo(() => dbService.getAccounts().filter(a => a.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const transactions = useMemo(() => dbService.getTransactions().filter(t => t.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const stocks = useMemo(() => dbService.getStocks().filter(s => s.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const mfs = useMemo(() => dbService.getMutualFunds().filter(m => m.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const fds = useMemo(() => dbService.getFDs().filter(f => f.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const gold = useMemo(() => dbService.getGold().filter(g => g.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const nps = useMemo(() => dbService.getNPS().filter(n => n.profileId === activeProfileId), [activeProfileId, dbVersion]);
  const pf = useMemo(() => dbService.getPF().filter(p => p.profileId === activeProfileId), [activeProfileId, dbVersion]);

  const aiContext = useMemo(() => ({ accounts, transactions, stocks, mfs, fds, gold, nps, pf, tdsRecords: [], taxInputs: {} as any }), [accounts, transactions, stocks, mfs, fds, gold, nps, pf]);

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
          text: 'Unable to complete your request. Please check your Gemini API key in Settings, verify your internet connection, and try again.'
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
    <div className="gap-stack-lg animate-fade-in" style={{ minHeight: 'calc(100dvh - 140px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<Sparkles />}
        title="AI Financial Assistant"
        description={
          mode === 'local' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-025)' }}>
              <ShieldCheck size={12} color="var(--success)" /> <span style={{ color: 'var(--success)' }}>Local Offline Mode (Zero cloud requests, 100% private)</span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-025)' }}>
              <Cloud size={12} color="var(--warning)" /> <span style={{ color: 'var(--warning)' }}>Cloud AI Mode (Gemini API, advanced natural language)</span>
            </span>
          )
        }
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
            <Tabs
              tabs={[
                { id: 'local', label: 'Local (Offline)' },
                { id: 'cloud', label: 'Cloud (Gemini)' },
              ]}
              activeTab={mode}
              onChange={(tabId) => handleModeChange(tabId as AIMode)}
              variant="segmented"
            />
            <IconButton
              label="Toggle AI settings"
              icon={<Settings size={18} />}
              onClick={() => setShowSettings(!showSettings)}
            />
            <IconButton
              variant="danger"
              label="Clear chat conversation history"
              icon={<Trash2 size={18} />}
              onClick={() => {
                openConfirm({
                  title: 'Clear Conversation History',
                  message: 'Erase all messages and calculations in this AI conversation? This action cannot be undone.',
                  confirmLabel: 'Clear History',
                  isDanger: true,
                  onConfirm: async () => {
                    setMessages([initialWelcome]);
                    await dbService.saveChatHistory(activeProfileId, [initialWelcome]);
                  }
                });
              }}
            />
          </div>
        }
      />

      <div className="glass-panel" data-interactive-card="off" style={{
        display: 'flex', flexDirection: 'column', flex: 1, padding: 'var(--spacing-125)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: '480px'
      }}>

      {showSettings && (
        <div className="glass-panel" data-interactive-card="off" style={{
          padding: 'var(--spacing-125)', marginBottom: 'var(--spacing-125)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-1)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <FormField label="Gemini API Key" htmlFor="gemini-api-key" style={{ flex: 1, margin: 0, minWidth: '220px' }}>
              <input
                id="gemini-api-key"
                type="password"
                className="form-input"
                style={{ width: '100%', padding: 'var(--spacing-06) var(--spacing-08)' }}
                placeholder="e.g. AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </FormField>
            <Button type="button" variant="primary" onClick={handleSaveSettings} style={{ padding: 'var(--spacing-06) var(--spacing-125)' }}>Save Gemini API Key</Button>
          </div>
          {apiKey && (
            <CopyableField secret value={apiKey} label="Active Key Reference" />
          )}
        </div>
      )}

      {/* Messages Box */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat conversation history"
        className="gap-stack-md flex-1 overflow-y-auto"
        style={{
          padding: 'var(--spacing-05)', marginBottom: 'var(--spacing-1)', scrollbarWidth: 'thin',
          display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)'
        }}
      >
        {messages.map(m => (
          <div key={m.id} style={{
            display: 'flex',
            justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
            gap: 'var(--spacing-075)',
            alignItems: 'flex-start'
          }}>
            {m.sender === 'assistant' && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)',
                boxShadow: 'var(--neo-inset-sm)',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles size={18} color="var(--accent-1)" />
              </div>
            )}

            <div className={m.sender === 'user' ? "" : "glass-panel"} data-interactive-card={m.sender === 'user' ? undefined : 'off'} style={{
              padding: m.sender === 'user' ? 'var(--spacing-075) var(--spacing-1)' : 'var(--spacing-085) var(--spacing-125)',
              maxWidth: m.sender === 'user' ? 'min(80%, 640px)' : 'min(85%, 760px)',
              borderRadius: m.sender === 'user' ? 'var(--radius-md) var(--radius-md) 4px var(--radius-md)' : '4px var(--radius-md) var(--radius-md) var(--radius-md)',
              fontSize: 'var(--font-sm)',
              lineHeight: '1.6',
              background: m.sender === 'user' ? 'var(--accent-grad)' : 'var(--bg-panel)',
              backgroundImage: m.sender === 'user' ? undefined : 'var(--neo-convex-grad)',
              border: m.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              borderTop: m.sender === 'user' ? undefined : 'var(--neo-bevel-top)',
              color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
              boxShadow: m.sender === 'user' ? 'var(--neo-raised-md)' : 'var(--neo-raised-sm)'
            }}>
              <FormattedMarkdown text={m.text} />
            </div>

            {m.sender === 'user' && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)',
                boxShadow: 'var(--neo-inset-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid var(--border-color)'
              }}>
                <User size={18} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div role="status" aria-live="polite" style={{ display: 'flex', gap: 'var(--spacing-075)', alignItems: 'center', animation: 'fade-in 0.3s ease' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-secondary)', boxShadow: 'var(--neo-inset-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Compass size={18} color="var(--accent-1)" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-06) var(--spacing-1)', borderRadius: '4px var(--radius-md) var(--radius-md) var(--radius-md)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', gap: 'var(--spacing-04)', alignItems: 'center' }}>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%' }}></span>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%', animationDelay: '0.2s' }}></span>
              <span className="typing-dot" style={{ background: 'currentColor', width: '4px', height: '4px', borderRadius: '50%', animationDelay: '0.4s' }}></span>
              <span style={{ marginLeft: 'var(--spacing-04)' }}>Analyzing financial context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* One-click Quick Prompts Ribbon */}
      <div
        className="mobile-tabs-scroll"
        style={{
          display: 'flex',
          gap: 'var(--spacing-05)',
          overflowX: 'auto',
          paddingBottom: 'var(--spacing-075)',
          marginBottom: 'var(--spacing-05)',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            type="button"
            className="badge-tag interactive-card interactive-card--normal"
            onClick={() => processQueryText(qp.prompt)}
            disabled={isProcessing}
            style={{
              fontSize: 'var(--font-xs)', padding: 'var(--spacing-04) var(--spacing-075)', whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)',
              borderTop: 'var(--neo-bevel-top)',
              color: 'var(--text-secondary)', fontWeight: 'var(--fw-medium)',
              background: 'var(--bg-panel)',
              backgroundImage: 'var(--neo-convex-grad)',
              boxShadow: 'var(--neo-raised-sm)',
              display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-025)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all var(--transition-fast)'
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--spacing-05)', alignItems: 'center', background: 'var(--bg-secondary)', padding: 'var(--spacing-04) var(--spacing-05)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
        <input
          type="text"
          aria-label="Ask AI financial assistant"
          style={{ flex: 1, padding: 'var(--spacing-05) var(--spacing-075)', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 'var(--font-sm)', outline: 'none', fontFamily: 'var(--font-body)' }}
          placeholder={mode === 'local' ? "Ask AI: 'Compare my tax slabs' or 'Net worth'..." : "Ask Gemini anything about your finances..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isProcessing}
        />
        <Button
          type="submit"
          variant="primary"
          aria-label="Send query"
          style={{
            padding: 0,
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            minWidth: '38px',
            minHeight: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          disabled={isProcessing || !query.trim()}
        >
          <Send size={16} />
        </Button>
      </form>

    </div>
    <ConfirmModal state={confirmModal} onClose={closeConfirm} />
    </div>
  );
};
