import React, { useState, useMemo } from 'react';
import { dbService } from '@financeos/database';
import { setTheme, AppTheme } from '@financeos/ui';
import { UserProfile, AuditLog, SystemSettings } from '@financeos/shared';
import {
  Settings, Users, Shield, Download, Upload, Clipboard,
  Trash2, Plus, Sliders
} from 'lucide-react';

interface SettingsViewProps {
  activeProfileId: string;
  onActiveProfileChange: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeProfileId, onActiveProfileChange }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => dbService.getSettings());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => dbService.getProfiles());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dbService.getAuditLogs());

  // Business settings states
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [businessGSTIN, setBusinessGSTIN] = useState(settings.businessGSTIN || '');

  // Add profile States
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfRole, setNewProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [newProfRel, setNewProfRel] = useState('Spouse');
  const [newProfNominee, setNewProfNominee] = useState(false);
  const [newProfPin, setNewProfPin] = useState('');

  // Edit profile States
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editProfName, setEditProfName] = useState('');
  const [editProfRole, setEditProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [editProfRel, setEditProfRel] = useState('Spouse');
  const [editProfNominee, setEditProfNominee] = useState(false);
  const [editProfPin, setEditProfPin] = useState('');

  // Backup Import State
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState('');



  const refreshData = () => {
    setProfiles(dbService.getProfiles());
    setSettings(dbService.getSettings());
    setAuditLogs(dbService.getAuditLogs());
  };

  const handleThemeChange = async (theme: AppTheme) => {
    setTheme(theme);
    await dbService.updateSettings({ theme });
    refreshData();
  };

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.updateSettings({ businessName, businessGSTIN });
    refreshData();
    alert('Business settings updated successfully!');
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName) return;

    await dbService.addProfile({
      name: newProfName,
      role: newProfRole,
      relationship: newProfRel,
      isNomineeProvided: newProfNominee,
      pin: newProfPin || undefined
    });

    setNewProfName('');
    setNewProfPin('');
    setShowAddProfile(false);
    refreshData();
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editProfName) return;

    await dbService.updateProfile(editingProfile.id, {
      name: editProfName,
      role: editProfRole,
      relationship: editProfRel,
      isNomineeProvided: editProfNominee,
      pin: editProfPin || undefined
    });

    if (activeProfileId === editingProfile.id) {
      onActiveProfileChange(editingProfile.id);
    }

    setEditingProfile(null);
    refreshData();
  };

  const handleDeleteProfile = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (profile.role === 'Admin' && profiles.filter(p => p.role === 'Admin').length <= 1) {
      alert('Cannot delete the only Admin profile. At least one Admin profile must exist.');
      return;
    }

    if (confirm(`Are you sure you want to delete profile "${profile.name}"? This will irreversibly delete ALL their personal finance data (accounts, transactions, investments, budgets).`)) {
      await dbService.deleteProfile(profileId);

      if (activeProfileId === profileId) {
        const remaining = dbService.getProfiles();
        if (remaining.length > 0) {
          onActiveProfileChange(remaining[0].id);
        } else {
          onActiveProfileChange('');
        }
      }
      refreshData();
    }
  };

  const handleResetDatabase = async () => {
    if (confirm('CRITICAL WARNING: Are you sure you want to RESET the entire system? This will permanently erase your PIN config, encryption keys, profiles, and all financial data. This action CANNOT be undone.')) {
      if (confirm('Please confirm one more time. Do you want to wipe out all local data?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  // Backups: Download database JSON
  const handleExportBackup = () => {
    try {
      const dataStr = dbService.getRawDb();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financeos_vault_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to export backup.');
    }
  };

  // Backups: Import database JSON
  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupJson.trim()) return;

    const success = await dbService.importRawDb(backupJson);
    if (success) {
      setImportStatus('Backup restored successfully! Refreshing details.');
      setBackupJson('');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setImportStatus('Invalid backup file. Please check format.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Settings & Security</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customize your themes, manage profiles, audits, and perform backups</p>
      </div>

      {/* Grid: Left - Custom Theme & Backup, Right - Profiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }} className="responsive-stack">

        {/* Themes and Backup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Theme customizer */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Sliders size={18} color="var(--accent-1)" /> System Interface & Slabs Theme
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
              {[
                { id: 'glass-cyan', label: 'Neon Cyan', color: '#06b6d4' },
                { id: 'glass-emerald', label: 'Emerald Green', color: '#10b981' },
                { id: 'glass-gold', label: 'Chrome Gold', color: '#f59e0b' },
                { id: 'dark', label: 'Vantablack', color: '#1e293b' },
                { id: 'light', label: 'Solarized Light', color: '#f8fafc' }
              ].map(t => {
                const isActive = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    className="btn"
                    style={{
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? `1px solid ${t.color}` : '1px solid var(--border-color)',
                      background: isActive ? `${t.color}18` : 'rgba(255,255,255,0.02)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      boxShadow: isActive ? `0 0 10px ${t.color}30` : 'none',
                      transition: 'all 0.2s ease',
                      fontWeight: isActive ? 600 : 400
                    }}
                    onClick={() => handleThemeChange(t.id as AppTheme)}
                  >
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: t.color,
                      boxShadow: `0 0 6px ${t.color}`,
                      flexShrink: 0
                    }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business Details Settings */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Sliders size={18} color="var(--accent-1)" /> Business Details (for Invoicing)
            </h3>
            <form onSubmit={handleSaveBusinessSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="ABCD Enterprises Pvt Ltd"
                  required
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Business GSTIN</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessGSTIN}
                  onChange={(e) => setBusinessGSTIN(e.target.value)}
                  placeholder="27ABCDA1234A1Z5"
                  required
                  style={{ width: '100%', fontSize: '0.88rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', width: '100%', marginTop: '0.25rem' }}>
                Save Business Details
              </button>
            </form>
          </div>

          {/* Local Backups */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Download size={18} color="var(--accent-2)" /> Local Data Backup Vault
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Generate complete offline file copies of your ledgers.
            </p>

            <button className="btn btn-secondary" style={{ width: '100%', padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleExportBackup}>
              <Download size={16} /> Download Backup (.json)
            </button>

            <form onSubmit={handleImportBackup} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Restore Data (Paste Backup JSON contents)</label>
              <textarea
                className="form-input"
                style={{ height: '65px', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.5rem', width: '100%' }}
                placeholder='{"settings":{...},"profiles":[...]}'
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}>
                <Upload size={14} /> Restore Database
              </button>
            </form>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--error)', background: 'rgba(239,68,68,0.06)', padding: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={handleResetDatabase}>
                <Trash2 size={14} color="var(--error)" /> Factory Reset System (Wipe All Data)
              </button>
            </div>

            {importStatus && (
              <div style={{
                marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-1)', background: 'rgba(255,255,255,0.02)',
                padding: '0.4rem', borderRadius: 'var(--radius-sm)'
              }}>
                {importStatus}
              </div>
            )}
          </div>

        </div>

        {/* Family Profiles List */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--accent-1)" /> Profile & Nominees Registry
            </h3>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', borderRadius: '1.5rem' }} onClick={() => setShowAddProfile(true)}>
              <Plus size={14} /> Add Profile
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {profiles.map(p => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-grad)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({p.relationship})</span></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Role: {p.role}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {p.isNomineeProvided ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600, background: 'var(--success-bg)', padding: '0.15rem 0.5rem', borderRadius: '1rem', whiteSpace: 'nowrap' }}>✓ Nominee</span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 600, background: 'var(--warning-bg)', padding: '0.15rem 0.5rem', borderRadius: '1rem', whiteSpace: 'nowrap' }}>⚠️ No Nominee</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingProfile(p);
                      setEditProfName(p.name);
                      setEditProfRole(p.role);
                      setEditProfRel(p.relationship || 'Other');
                      setEditProfNominee(p.isNomineeProvided);
                      setEditProfPin(p.pin || '');
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Edit Profile"
                  >
                    <Sliders size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(p.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '50%', padding: '0.35rem', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Profile"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>



      {/* Dialog: Add Profile */}
      {showAddProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '92%', maxWidth: '380px', padding: '1.25rem', borderRadius: '1.25rem',
            border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 650, marginBottom: '1rem', color: 'var(--text-primary)' }}>Add Family Profile</h3>
            <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" className="form-input" value={newProfName} onChange={(e) => setNewProfName(e.target.value)} placeholder="ABCD Member" required style={{ width: '100%', fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Relationship</label>
                <select
                  className="form-input"
                  value={newProfRel}
                  onChange={(e) => setNewProfRel(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.9)', color: 'var(--text-primary)' }}
                >
                  <option value="Self" style={{ background: '#0f172a', color: '#e2e8f0' }}>Self</option>
                  <option value="Spouse" style={{ background: '#0f172a', color: '#e2e8f0' }}>Spouse</option>
                  <option value="Child" style={{ background: '#0f172a', color: '#e2e8f0' }}>Child</option>
                  <option value="Parent" style={{ background: '#0f172a', color: '#e2e8f0' }}>Parent</option>
                  <option value="Sibling" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sibling</option>
                  <option value="Other" style={{ background: '#0f172a', color: '#e2e8f0' }}>Other</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Access Role</label>
                <select
                  className="form-input"
                  value={newProfRole}
                  onChange={(e) => setNewProfRole(e.target.value as any)}
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.9)', color: 'var(--text-primary)' }}
                >
                  <option value="Member" style={{ background: '#0f172a', color: '#e2e8f0' }}>Member (Read & Write)</option>
                  <option value="Viewer" style={{ background: '#0f172a', color: '#e2e8f0' }}>Viewer (Read-only)</option>
                  <option value="Admin" style={{ background: '#0f172a', color: '#e2e8f0' }}>Admin (Full access)</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Profile passcode PIN (Optional 4 digits)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newProfPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                      setNewProfPin(e.target.value);
                    }
                  }}
                  placeholder="••••"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <input type="checkbox" checked={newProfNominee} onChange={(e) => setNewProfNominee(e.target.checked)} id="nomineeCheck" />
                <label htmlFor="nomineeCheck" style={{ fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Is designated nominee on primary assets</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '1.5rem' }} onClick={() => setShowAddProfile(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '1.5rem' }}>Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Dialog: Edit Profile */}
      {editingProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '92%', maxWidth: '380px', padding: '1.25rem', borderRadius: '1.25rem',
            border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 650, marginBottom: '1rem', color: 'var(--text-primary)' }}>Edit Profile Details</h3>
            <form onSubmit={handleEditProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" className="form-input" value={editProfName} onChange={(e) => setEditProfName(e.target.value)} required style={{ width: '100%', fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Relationship</label>
                <select
                  className="form-input"
                  value={editProfRel}
                  onChange={(e) => setEditProfRel(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.9)', color: 'var(--text-primary)' }}
                >
                  <option value="Self" style={{ background: '#0f172a', color: '#e2e8f0' }}>Self</option>
                  <option value="Spouse" style={{ background: '#0f172a', color: '#e2e8f0' }}>Spouse</option>
                  <option value="Child" style={{ background: '#0f172a', color: '#e2e8f0' }}>Child</option>
                  <option value="Parent" style={{ background: '#0f172a', color: '#e2e8f0' }}>Parent</option>
                  <option value="Sibling" style={{ background: '#0f172a', color: '#e2e8f0' }}>Sibling</option>
                  <option value="Other" style={{ background: '#0f172a', color: '#e2e8f0' }}>Other</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Access Role</label>
                <select
                  className="form-input"
                  value={editProfRole}
                  onChange={(e) => setEditProfRole(e.target.value as any)}
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.9)', color: 'var(--text-primary)' }}
                >
                  <option value="Member" style={{ background: '#0f172a', color: '#e2e8f0' }}>Member (Read & Write)</option>
                  <option value="Viewer" style={{ background: '#0f172a', color: '#e2e8f0' }}>Viewer (Read-only)</option>
                  <option value="Admin" style={{ background: '#0f172a', color: '#e2e8f0' }}>Admin (Full access)</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Profile passcode PIN (Optional 4 digits)</label>
                <input
                  type="password"
                  className="form-input"
                  value={editProfPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                      setEditProfPin(e.target.value);
                    }
                  }}
                  placeholder="••••"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                <input type="checkbox" checked={editProfNominee} onChange={(e) => setEditProfNominee(e.target.checked)} id="editNomineeCheck" />
                <label htmlFor="editNomineeCheck" style={{ fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Is designated nominee on primary assets</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '1.5rem' }} onClick={() => setEditingProfile(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '1.5rem' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
