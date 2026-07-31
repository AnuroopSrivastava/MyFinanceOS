import React, { useState, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { SavingsGoal } from '@financeos/shared';
import { Target, Plus, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { formatRupee } from '../utils/currency.js';
import { CurrencyInput } from './ui/CurrencyInput.js';

interface GoalTrackerProps {
  activeProfileId: string;
}

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '🎓', '💰', '🛡️', '📱', '💍', '🏥'];
const GOAL_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];

const CircularProgress: React.FC<{ progress: number; color: string; size?: number }> = ({ progress, color, size = 72 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={size * 0.19} fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

export const GoalTracker: React.FC<GoalTrackerProps> = ({ activeProfileId }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>(() => dbService.getGoals().filter(g => g.profileId === activeProfileId));
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#06b6d4');

  const refreshGoals = () => setGoals(dbService.getGoals().filter(g => g.profileId === activeProfileId));

  const resetForm = () => {
    setName(''); setTargetAmount(0); setCurrentAmount(0);
    setDeadline(''); setIcon('🎯'); setColor('#06b6d4');
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
    if (!confirm('Delete this savings goal?')) return;
    await dbService.deleteGoal(id);
    refreshGoals();
  };

  const handleAddContribution = async (goal: SavingsGoal, amount: number) => {
    await dbService.updateGoal(goal.id, { currentAmount: goal.currentAmount + amount });
    refreshGoals();
  };

  const openEdit = (g: SavingsGoal) => {
    setEditGoal(g);
    setName(g.name); setTargetAmount(g.targetAmount); setCurrentAmount(g.currentAmount);
    setDeadline(g.deadline); setIcon(g.icon); setColor(g.color);
    setShowAdd(true);
  };

  const getStatus = (g: SavingsGoal) => {
    const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
    if (pct >= 100) return { label: 'Completed', color: 'var(--success)' };
    if (!g.deadline) return { label: 'In Progress', color: 'var(--accent-1)' };
    const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const remaining = g.targetAmount - g.currentAmount;
    const monthlyNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : remaining;
    if (daysLeft <= 0 && pct < 100) return { label: 'Overdue', color: 'var(--error)' };
    if (monthlyNeeded > g.targetAmount * 0.15) return { label: 'At Risk', color: 'var(--warning)' };
    return { label: 'On Track', color: 'var(--success)' };
  };

  const formContent = (
    <form onSubmit={editGoal ? handleUpdate : handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Goal Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emergency Fund" style={{ width: '100%', fontSize: '0.85rem' }} required />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Deadline</label>
          <input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', fontSize: '0.85rem' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Target Amount (₹)</label>
          <CurrencyInput value={targetAmount} onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Current Saved (₹)</label>
          <CurrencyInput value={currentAmount} onChange={e => setCurrentAmount(parseFloat(e.target.value) || 0)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Icon:</span>
        {GOAL_ICONS.map(i => (
          <button type="button" key={i} onPointerDown={() => setIcon(i)} style={{ fontSize: '1.2rem', background: icon === i ? 'rgba(255,255,255,0.1)' : 'transparent', border: icon === i ? '1px solid var(--accent-1)' : '1px solid transparent', borderRadius: '6px', padding: '0.2rem 0.4rem', cursor: 'pointer' }}>{i}</button>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Color:</span>
        {GOAL_COLORS.map(c => (
          <button type="button" key={c} onPointerDown={() => setColor(c)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onPointerDown={resetForm} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>{editGoal ? 'Update Goal' : 'Add Goal'}</button>
      </div>
    </form>
  );

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={16} color="var(--accent-1)" /> Savings Goals
        </h4>
        <button
          className="btn btn-primary"
          onPointerDown={() => { resetForm(); setShowAdd(true); }}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
        >
          <Plus size={14} /> New Goal
        </button>
      </div>

      {showAdd && formContent}

      {goals.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No savings goals yet. Create your first goal to start tracking progress!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginTop: showAdd ? '0.75rem' : 0 }}>
        {goals.map(g => {
          const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
          const status = getStatus(g);
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const daysLeft = g.deadline ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
          const monthlyNeeded = daysLeft && daysLeft > 0 ? remaining / (daysLeft / 30) : 0;

          return (
            <div key={g.id} className="glass-panel" style={{ padding: '1rem', position: 'relative', borderColor: `${g.color}33` }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CircularProgress progress={pct} color={g.color} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {formatRupee(g.currentAmount)} / {formatRupee(g.targetAmount)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: `${status.color}22`, color: status.color, fontWeight: 600 }}>{status.label}</span>
                    {daysLeft !== null && pct < 100 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{daysLeft}d left</span>
                    )}
                  </div>
                </div>
              </div>
              {monthlyNeeded > 0 && pct < 100 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <TrendingUp size={12} /> Save {formatRupee(Math.round(monthlyNeeded))}/mo to stay on track
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onPointerDown={() => openEdit(g)} style={{ padding: '0.2rem 0.4rem', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                  <Edit2 size={12} />
                </button>
                <button className="btn btn-secondary" onPointerDown={() => handleDelete(g.id)} style={{ padding: '0.2rem 0.4rem', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                  <Trash2 size={12} color="var(--error)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
