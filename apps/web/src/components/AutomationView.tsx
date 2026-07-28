import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutomationRule } from '@financeos/shared';
import {
  Zap, Calendar, Bell, Plus, Trash2, ToggleLeft, ToggleRight,
  Sparkles, X
} from 'lucide-react';
import { formatRupee } from '../utils/currency.js';

interface AutomationViewProps {
  profileId: string;
}

const INITIAL_RULES: AutomationRule[] = [];
const INITIAL_REMINDERS: any[] = [];

export const AutomationView: React.FC<AutomationViewProps> = ({ profileId }) => {
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [reminders] = useState(INITIAL_REMINDERS);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationRule['triggerType']>('DescriptionContains');
  const [matchPattern, setMatchPattern] = useState('');
  const [targetCategory, setTargetCategory] = useState('Food & Dining');

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !matchPattern.trim()) return;

    const newRule: AutomationRule = {
      id: 'rule_' + Math.random().toString(36).substring(2, 8),
      profileId,
      name: ruleName,
      triggerType,
      matchPattern,
      targetCategory,
      isActive: true
    };

    setRules([newRule, ...rules]);
    setRuleName('');
    setMatchPattern('');
    setIsCreatingRule(false);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Automation Rules & Reminders</h2>
            <span style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--accent-1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Sparkles size={12} /> Auto-Pilot Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Configure smart auto-categorization rules, SIP/EMI schedules, recurring transaction bots, and GST reminders
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsCreatingRule(!isCreatingRule)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>Create Rule</span>
        </button>
      </div>

      {/* New Rule Modal / Form Panel */}
      <AnimatePresence>
        {isCreatingRule && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddRule}
            className="glass-panel"
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={18} color="var(--accent-1)" /> New Smart Rule
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="responsive-stack">
              <div className="form-group">
                <label className="form-label">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tag Salary Credit"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trigger Condition</label>
                <select
                  value={triggerType}
                  onChange={e => setTriggerType(e.target.value as any)}
                  className="form-input"
                >
                  <option value="DescriptionContains">Description Contains String</option>
                  <option value="AmountOver">Amount Over Threshold (₹)</option>
                  <option value="CategoryMatch">Exact Category Match</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pattern Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix or 10000"
                  value={matchPattern}
                  onChange={e => setMatchPattern(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Zap size={14} /> Save Rule
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="responsive-stack">
        {/* Rules Section */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={18} color="var(--accent-1)" /> Categorization & Tagging Rules
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {rules.filter(r => r.isActive).length} Active Rules
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {rules.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No automation rules created yet. Click "Create Rule" above to add your first rule.
              </div>
            ) : rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{rule.name}</h4>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '9999px',
                      background: rule.isActive ? 'var(--success-bg)' : 'rgba(255,255,255,0.06)',
                      color: rule.isActive ? 'var(--success)' : 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      {rule.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    When <strong style={{ color: 'var(--text-primary)' }}>{rule.triggerType}</strong> matches{' '}
                    <span style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      color: 'var(--accent-1)'
                    }}>
                      "{rule.matchPattern}"
                    </span>{' '}
                    → Assign <strong style={{ color: 'var(--text-primary)' }}>{rule.targetCategory}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.isActive ? 'var(--accent-1)' : 'var(--text-secondary)' }}
                    title={rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                  >
                    {rule.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.8 }}
                    title="Delete Rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reminders & Schedules Section */}
        <motion.div
          className="glass-panel"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bell size={18} color="var(--accent-1)" /> Scheduled Reminders & Obligations
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {reminders.length} Scheduled
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reminders.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No active recurring reminders or obligations scheduled.
              </div>
            ) : reminders.map(rem => (
              <div
                key={rem.id}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      {rem.title}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Due: {rem.dueDate} • {rem.category}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {rem.amount > 0 && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatRupee(rem.amount)}
                    </div>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    fontWeight: 600,
                    display: 'inline-block',
                    marginTop: '0.2rem'
                  }}>
                    {rem.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AutomationView;
