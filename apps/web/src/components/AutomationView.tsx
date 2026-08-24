import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Modal, SectionHeader, Badge, FormField, FormActions, EmptyState, ActionRow, IconButton, FormRow } from '@financeos/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { AutomationRule } from '@financeos/shared';
import { dbService } from '@financeos/database';
import { useDbSyncCallback, useDbVersion } from '../hooks/useDbSync.js';
import {
  Zap, Calendar, Bell, Plus, Trash2, ToggleLeft, ToggleRight,
  Sparkles, X
} from 'lucide-react';
import { formatRupee } from '@financeos/shared';

interface AutomationViewProps {
  profileId: string;
}

export const AutomationView: React.FC<AutomationViewProps> = ({ profileId }) => {
  const dbVersion = useDbVersion();
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    try {
      return dbService.getAutomationRules(profileId);
    } catch {
      return [];
    }
  });

  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationRule['triggerType']>('DescriptionContains');
  const [matchPattern, setMatchPattern] = useState('');
  const [targetCategory, setTargetCategory] = useState('Food & Dining');

  const refreshRules = useCallback(() => {
    try {
      setRules(dbService.getAutomationRules(profileId));
    } catch {
      setRules([]);
    }
  }, [profileId]);

  useEffect(() => {
    refreshRules();
  }, [profileId, refreshRules]);

  useDbSyncCallback(refreshRules);

  // Live reminders derived from actual database state
  const reminders = useMemo(() => {
    try {
      const list: any[] = [];
      
      // 1. Recurring SIPs / Transactions
      const recurring = dbService.getRecurringTransactions().filter(r => r.profileId === profileId && r.isActive);
      recurring.forEach(r => {
        list.push({
          id: 'rec_' + r.id,
          title: r.description,
          dueDate: r.nextDueDate,
          category: r.category,
          amount: r.amount,
          status: 'Auto-Scheduled'
        });
      });

      // 2. Fixed Deposit Maturities
      const fds = dbService.getFDs().filter(f => f.profileId === profileId && !f.isMatured);
      fds.forEach(f => {
        list.push({
          id: 'fd_' + f.id,
          title: `FD Maturity: ${f.bankName}`,
          dueDate: f.maturityDate,
          category: 'Fixed Deposit',
          amount: f.maturityAmount,
          status: 'Maturity Pending'
        });
      });

      // 3. Unpaid Invoices
      const invoices = dbService.getInvoices().filter(i => i.profileId === profileId && i.status !== 'Paid');
      invoices.forEach(inv => {
        list.push({
          id: 'inv_' + inv.id,
          title: `Invoice Due: ${inv.customerName} (${inv.invoiceNumber})`,
          dueDate: inv.dueDate,
          category: 'Business Invoicing',
          amount: inv.grandTotal,
          status: inv.status
        });
      });

      return list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    } catch {
      return [];
    }
  }, [profileId, dbVersion]);

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    await dbService.updateAutomationRule(id, { isActive: !rule.isActive });
    refreshRules();
  };

  const deleteRule = async (id: string) => {
    await dbService.deleteAutomationRule(id);
    refreshRules();
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !matchPattern.trim()) return;

    await dbService.addAutomationRule({
      profileId,
      name: ruleName,
      triggerType,
      matchPattern,
      targetCategory,
      isActive: true
    });

    refreshRules();
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
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}
    >
      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<Sparkles />}
        title="Automation Rules & Reminders"
        badge={<><Zap size={12} /> Auto-Pilot Active</>}
        description="Configure smart auto-categorization rules, SIP and EMI schedules, automated recurring transactions, and statutory tax reminders."
        action={
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
            onClick={() => setIsCreatingRule(!isCreatingRule)}
            style={{ padding: 'var(--spacing-05) var(--spacing-1)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
          >
            <Plus size={16} />
            <span>Create Rule</span>
          </motion.button>
        }
      />

      {/* New Rule Modal */}
      <Modal
        isOpen={isCreatingRule}
        onClose={() => setIsCreatingRule(false)}
        title="Create Smart Automation Rule"
        description="Automatically tag or categorize incoming transactions matching your patterns."
        size="lg"
      >
        <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-125)' }}>
          <FormRow>
            <FormField label="Rule Name" htmlFor="auto-rule-name">
              <input
                id="auto-rule-name"
                type="text"
                required
                placeholder="e.g. Tag Salary Credit"
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Trigger Condition" htmlFor="auto-trigger-type">
              <select
                id="auto-trigger-type"
                value={triggerType}
                onChange={e => setTriggerType(e.target.value as any)}
                className="form-input"
              >
                <option value="DescriptionContains">Description Contains Text</option>
                <option value="AmountOver">Amount Exceeds Threshold (₹)</option>
                <option value="CategoryMatch">Exact Category Match</option>
              </select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Pattern Value" htmlFor="auto-match-pattern">
              <input
                id="auto-match-pattern"
                type="text"
                required
                placeholder="e.g. Netflix, Swiggy, or 10000"
                value={matchPattern}
                onChange={e => setMatchPattern(e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Assign Category" htmlFor="auto-target-category">
              <select
                id="auto-target-category"
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="form-input"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Investments">Investments</option>
                <option value="Salary">Salary</option>
                <option value="Utilities & Bills">Utilities & Bills</option>
                <option value="Shopping & E-Commerce">Shopping & E-Commerce</option>
                <option value="Transport & Travel">Transport & Travel</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Business Expense">Business Expense</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
          </FormRow>
          <FormActions
            divided
            onCancel={() => setIsCreatingRule(false)}
            submitLabel="Save Smart Rule"
          />
        </form>
      </Modal>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-125)' }} className="responsive-stack">
        {/* Rules Section */}
        <motion.div
          className="glass-panel" data-interactive-card="off"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          style={{ padding: 'var(--spacing-125)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-05)' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-heavy)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
              <Zap size={18} color="var(--accent-1)" /> Categorization & Tagging Rules
            </h3>
            <Badge variant="neutral">
              {rules.filter(r => r.isActive).length} Active Rules
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
            {rules.length === 0 ? (
              <EmptyState
                variant="dashed"
                icon={<Zap size={24} />}
                title="No automation rules created"
                description="Click &quot;Create Rule&quot; above to auto-categorize incoming transactions automatically."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setIsCreatingRule(true)}
                    style={{ padding: 'var(--spacing-04) var(--spacing-1)', fontSize: 'var(--font-sm)', borderRadius: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}
                  >
                    <Plus size={14} /> Create First Rule
                  </Button>
                }
              />
            ) : rules.map(rule => (
              <ActionRow
                key={rule.id}
                title={rule.name}
                badge={
                  <Badge variant={rule.isActive ? 'success' : 'neutral'}>
                    {rule.isActive ? 'Active' : 'Paused'}
                  </Badge>
                }
                wrapDescription
                description={
                  <>
                    When <strong style={{ color: 'var(--text-primary)' }}>{rule.triggerType}</strong> matches{' '}
                    <span style={{
                      background: 'var(--surface-tint)',
                      padding: 'var(--spacing-02) var(--spacing-04)',
                      borderRadius: 'var(--radius-xs)',
                      fontFamily: 'monospace',
                      color: 'var(--accent-1)'
                    }}>
                      &quot;{rule.matchPattern}&quot;
                    </span>{' '}
                    → Assign <strong style={{ color: 'var(--text-primary)' }}>{rule.targetCategory}</strong>
                  </>
                }
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                    <IconButton label={rule.isActive ? `Pause rule ${rule.name}` : `Activate rule ${rule.name}`} icon={rule.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />} onClick={() => toggleRule(rule.id)} />
                    <IconButton variant="danger" label={`Delete rule ${rule.name}`} icon={<Trash2 size={16} />} onClick={() => deleteRule(rule.id)} />
                  </div>
                }
              />
            ))}
          </div>
        </motion.div>

        {/* Reminders & Schedules Section */}
        <motion.div
          className="glass-panel" data-interactive-card="off"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          style={{ padding: 'var(--spacing-125)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-05)' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-heavy)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
              <Bell size={18} color="var(--accent-1)" /> Scheduled Reminders & Obligations
            </h3>
            <Badge variant="neutral">{reminders.length} Scheduled</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
            {reminders.length === 0 ? (
              <EmptyState
                variant="dashed"
                icon={<Bell size={24} />}
                title="No active reminders"
                description="Recurring SIPs, loan EMIs, and tax deadlines will appear here automatically."
              />
            ) : reminders.map(rem => (
              <ActionRow
                key={rem.id}
                icon={
                  <span style={{
                    padding: 'var(--spacing-05)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--badge-cyan-bg)',
                    color: 'var(--badge-cyan-text)',
                    border: '1px solid var(--badge-cyan-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={18} />
                  </span>
                }
                title={rem.title}
                description={`Due: ${rem.dueDate} • ${rem.category}`}
                action={
                  <div style={{ textAlign: 'right' }}>
                    {rem.amount > 0 && (
                      <div style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-heavy)', color: 'var(--text-primary)' }}>
                        {formatRupee(rem.amount)}
                      </div>
                    )}
                    <div style={{ marginTop: 'var(--spacing-02)' }}>
                      <Badge variant={rem.status === 'Completed' ? 'success' : 'amber'}>
                        {rem.status}
                      </Badge>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AutomationView;
