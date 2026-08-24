import React, { useState, useEffect } from 'react';
import { Button, CurrencyInput, CircularProgress, Badge, IconButton, EmptyState, PanelHeader, FormField, FormActions, FormRow, type BadgeVariant } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { SavingsGoal } from '@financeos/shared';
import { Target, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { formatRupee } from '@financeos/shared';

import { useDbSyncCallback } from '../hooks/useDbSync.js';
import { ConfirmModal, useConfirmModal } from './ConfirmModal.js';

interface GoalTrackerProps {
  activeProfileId: string;
}

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '🎓', '💰', '🛡️', '📱', '💍', '🏥'];
const GOAL_COLORS = [
  'var(--color-asset-cash)',    // Cyan
  'var(--color-asset-stocks)',  // Emerald
  'var(--color-asset-gold)',    // Gold / Amber
  'var(--color-asset-crypto)',  // Indigo
  'var(--color-asset-retirement)', // Pink
  'var(--color-asset-fd)',      // Day Blue
  'var(--color-asset-mf)',      // Violet
  'var(--color-asset-realestate)', // Teal
  'var(--warning)',             // Orange
  'var(--error)',               // Crimson
];

export const GoalTracker: React.FC<GoalTrackerProps> = ({ activeProfileId }) => {
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const [goals, setGoals] = useState<SavingsGoal[]>(() => dbService.getGoals().filter(g => g.profileId === activeProfileId));
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('var(--color-asset-cash)');

  const refreshGoals = () => setGoals(dbService.getGoals().filter(g => g.profileId === activeProfileId));

  useEffect(() => {
    refreshGoals();
  }, [activeProfileId]);

  useDbSyncCallback(refreshGoals);

  const resetForm = () => {
    setName(''); setTargetAmount(0); setCurrentAmount(0);
    setDeadline(''); setIcon('🎯'); setColor('var(--color-asset-cash)');
    setShowAdd(false); setEditGoal(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || targetAmount <= 0) return;
    await dbService.addGoal({ profileId: activeProfileId, name, targetAmount, currentAmount, deadline, icon, color, linkedAccountId: undefined });
    resetForm();
    refreshGoals();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGoal) return;
    await dbService.updateGoal(editGoal.id, { name, targetAmount, currentAmount, deadline, icon, color });
    resetForm();
    refreshGoals();
  };

  const handleDelete = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    const details = goal ? ` for "${goal.name}"` : '';
    openConfirm({
      title: 'Delete Savings Goal',
      message: `Permanently delete this savings goal${details}? Recorded progress and target tracking will be lost.`,
      confirmLabel: 'Delete Goal',
      isDanger: true,
      onConfirm: async () => { await dbService.deleteGoal(id); refreshGoals(); }
    });
  };

  const openEdit = (g: SavingsGoal) => {
    setEditGoal(g);
    setName(g.name); setTargetAmount(g.targetAmount); setCurrentAmount(g.currentAmount);
    setDeadline(g.deadline); setIcon(g.icon); setColor(g.color);
    setShowAdd(true);
  };

  const getStatus = (g: SavingsGoal): { variant: BadgeVariant; label: string } => {
    const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
    if (pct >= 100) return { variant: 'success', label: 'Completed' };
    if (!g.deadline) return { variant: 'cyan', label: 'In Progress' };
    const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const remaining = g.targetAmount - g.currentAmount;
    const monthlyNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : remaining;
    if (daysLeft <= 0 && pct < 100) return { variant: 'error', label: 'Overdue' };
    if (monthlyNeeded > g.targetAmount * 0.15) return { variant: 'warning', label: 'At Risk' };
    return { variant: 'success', label: 'On Track' };
  };

  const formContent = (
    <form onSubmit={editGoal ? handleUpdate : handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)', padding: 'var(--spacing-1)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', boxShadow: 'var(--neo-inset-sm)' }}>
      <FormRow gap="var(--spacing-075)">
        <FormField label="Goal Name">
          <input id="goal-name-input" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" style={{ width: '100%', fontSize: 'var(--font-sm)' }} required />
        </FormField>
        <FormField label="Deadline">
          <input id="goal-deadline-input" type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', fontSize: 'var(--font-sm)' }} />
        </FormField>
      </FormRow>
      <FormRow gap="var(--spacing-075)">
        <FormField label="Target Amount (₹)">
          <CurrencyInput id="goal-target-amount" value={targetAmount} onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)} />
        </FormField>
        <FormField label="Current Saved (₹)">
          <CurrencyInput id="goal-current-amount" value={currentAmount} onChange={e => setCurrentAmount(parseFloat(e.target.value) || 0)} />
        </FormField>
      </FormRow>
      <div style={{ display: 'flex', gap: 'var(--spacing-05)', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Icon:</span>
        {GOAL_ICONS.map(i => (
          <Button type="button" key={i} aria-label={`Select icon ${i}`} onClick={() => setIcon(i)} style={{ fontSize: 'var(--font-xl)', background: icon === i ? 'var(--bg-panel-hover)' : 'transparent', border: icon === i ? '1px solid var(--accent-1)' : '1px solid transparent', borderRadius: 'var(--radius-xs)', padding: 'var(--spacing-02) var(--spacing-04)', cursor: 'pointer' }}>{i}</Button>
        ))}
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginLeft: 'var(--spacing-05)' }}>Color:</span>
        {GOAL_COLORS.map(c => (
          <Button type="button" key={c} aria-label={`Select color ${c}`} onClick={() => setColor(c)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
        ))}
      </div>
      <FormActions
        onCancel={resetForm}
        submitLabel={editGoal ? 'Save Goal Changes' : 'Create Savings Goal'}
      />
    </form>
  );

  return (
    <>
    <ConfirmModal state={confirmModal} onClose={closeConfirm} />
    <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-125)' }}>
      <PanelHeader
        icon={<Target size={16} />}
        title="Savings Goals"
        action={
          <Button
            variant="primary"
            onClick={() => { resetForm(); setShowAdd(true); }}
            style={{ padding: 'var(--spacing-02) var(--spacing-06)', fontSize: 'var(--font-xs)', gap: 'var(--spacing-04)' }}
          >
            <Plus size={14} /> New Goal
          </Button>
        }
      />

      {showAdd && formContent}

      {goals.length === 0 && !showAdd && (
        <EmptyState variant="dashed" title="No savings goals yet" description="Set a target for an emergency fund, home down payment, or vacation to track milestone progress." />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'var(--spacing-075)', marginTop: showAdd ? 'var(--spacing-075)' : 0 }}>
        {goals.map(g => {
          const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const status = getStatus(g);
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
          const monthlyNeeded = daysLeft && daysLeft > 0 ? remaining / (daysLeft / 30) : 0;

          return (
            <div key={g.id} className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-1)', position: 'relative', borderColor: `color-mix(in srgb, ${g.color} 20%, transparent)` }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-075)', alignItems: 'center' }}>
                <CircularProgress progress={pct} color={g.color} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', marginBottom: 'var(--spacing-025)' }}>
                    <span style={{ fontSize: 'var(--font-lg)' }}>{g.icon}</span>
                    <span style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: "'tnum' 1" }}>
                    {formatRupee(g.currentAmount)} / {formatRupee(g.targetAmount)}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-05)', alignItems: 'center', marginTop: 'var(--spacing-04)' }}>
                    <Badge variant={status.variant} size="sm">{status.label}</Badge>
                    {daysLeft !== null && pct < 100 && (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{daysLeft}d left</span>
                    )}
                  </div>
                </div>
              </div>
              {monthlyNeeded > 0 && pct < 100 && (
                <div style={{ marginTop: 'var(--spacing-05)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                  <TrendingUp size={12} /> Save {formatRupee(Math.round(monthlyNeeded))}/mo to stay on track
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--spacing-04)', marginTop: 'var(--spacing-05)', justifyContent: 'flex-end' }}>
                <IconButton icon={<Edit2 size={12} />} label={`Edit ${g.name} goal`} onClick={() => openEdit(g)} />
                <IconButton icon={<Trash2 size={12} />} variant="danger" label={`Delete ${g.name} goal`} onClick={() => handleDelete(g.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};
