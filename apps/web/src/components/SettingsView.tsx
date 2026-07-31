import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { dbService } from '@financeos/database';
import { useDbSyncCallback } from '../hooks/useDbSync.js';
import { setTheme, AppTheme } from '@financeos/ui';
import { UserProfile, AuditLog, SystemSettings } from '@financeos/shared';
import { ImageCropperModal } from './ImageCropperModal.js';
import {
  Settings, Users, Shield, Download, Upload,
  Trash2, Plus, Sliders, CheckCircle2, AlertTriangle,
  Building2, FileText, Check, Lock, History, X,
  ShieldCheck, RefreshCw, Key, Sparkles, Database, Save
} from 'lucide-react';

interface SettingsViewProps {
  activeProfileId: string;
  onActiveProfileChange: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeProfileId, onActiveProfileChange }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => dbService.getSettings());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => dbService.getProfiles());


  // Business settings states
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [businessGSTIN, setBusinessGSTIN] = useState(settings.businessGSTIN || '');
  const [isSavedBusiness, setIsSavedBusiness] = useState(false);

  // Add profile States
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfRole, setNewProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [newProfRel, setNewProfRel] = useState('Spouse');
  const [newProfNominee, setNewProfNominee] = useState(false);
  const [newProfPin, setNewProfPin] = useState('');
  const [newProfAvatar, setNewProfAvatar] = useState('');

  // Edit profile States
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editProfName, setEditProfName] = useState('');
  const [editProfRole, setEditProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [editProfRel, setEditProfRel] = useState('Spouse');
  const [editProfNominee, setEditProfNominee] = useState(false);
  const [editProfPin, setEditProfPin] = useState('');
  const [editProfAvatar, setEditProfAvatar] = useState('');

  // Image Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [activeAvatarSetter, setActiveAvatarSetter] = useState<((val: string) => void) | null>(null);

  // Backup Import State
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const refreshData = () => {
    setProfiles(dbService.getProfiles());
    setSettings(dbService.getSettings());
  };

  useDbSyncCallback(refreshData);

  // Fix: Sync local input state when db changes in background
  React.useEffect(() => {
    if (!isSavedBusiness) {
      setBusinessName(settings.businessName || '');
      setBusinessGSTIN(settings.businessGSTIN || '');
    }
  }, [settings.businessName, settings.businessGSTIN, isSavedBusiness]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setAvatarState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCropImageSrc(base64String);
      setActiveAvatarSetter(() => setAvatarState);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const handleCropComplete = (croppedBase64: string) => {
    if (activeAvatarSetter) {
      activeAvatarSetter(croppedBase64);
    }
    setCropImageSrc(null);
    setActiveAvatarSetter(null);
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
    setIsSavedBusiness(true);
    setTimeout(() => setIsSavedBusiness(false), 3500);
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim()) {
      alert("Please enter a profile name.");
      return;
    }

    try {
      await dbService.addProfile({
        name: newProfName.trim(),
        role: newProfRole,
        relationship: newProfRel,
        isNomineeProvided: newProfNominee,
        pin: newProfPin || undefined,
        avatar: newProfAvatar || undefined
      });

      setNewProfName('');
      setNewProfPin('');
      setNewProfAvatar('');
      setShowAddProfile(false);
      refreshData();
    } catch (err: any) {
      console.error('Failed to add profile:', err);
      alert('Error adding profile: ' + (err?.message || 'Unknown error'));
    }
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
    localStorage.clear();
    window.location.reload();
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
      setImportStatus({ type: 'success', msg: 'Backup restored successfully! Reloading application...' });
      setBackupJson('');
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } else {
      setImportStatus({ type: 'error', msg: 'Invalid JSON payload. Please ensure file structure is correct.' });
    }
  };

  const themeOptions: { id: AppTheme; label: string; tag: string; color: string; bg: string }[] = [
    { id: 'dark', label: 'Vantablack', tag: 'Stealth Dark', color: '#64748b', bg: '#0f172a' },
    { id: 'glass-cyan', label: 'Neon Cyan', tag: 'Cyber Modern', color: '#06b6d4', bg: '#083344' },
    { id: 'glass-emerald', label: 'Emerald Green', tag: 'Institutional', color: '#10b981', bg: '#064e3b' },
    { id: 'glass-gold', label: 'Chrome Gold', tag: 'Wealth Luxe', color: '#f59e0b', bg: '#451a03' },
    { id: 'light', label: 'Solarized Light', tag: 'Clean Light Mode', color: '#2563eb', bg: '#eff6ff' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '4rem' }}>

      {/* Page Header Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem 3rem',
        borderRadius: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '2rem',
        background: 'var(--header-banner-grad)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--accent-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px hsla(220, 80%, 50%, 0.25)',
            flexShrink: 0
          }}>
            <Settings size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              System Configuration & Security
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem', margin: 0, lineHeight: 1.5 }}>
              Manage visual themes, organizational details, profile privileges, backups, and security activity.
            </p>
          </div>
        </div>

        {/* Quick System Stats Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>AES-256 Offline Vault</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <Users size={14} color="var(--accent-1)" />
            <span>{profiles.length} Profiles Active</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }} className="responsive-stack">

        {/* LEFT COLUMN: Appearance, Business Info & Disaster Recovery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Theme Customizer Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                <Sliders size={20} color="var(--accent-1)" /> Appearance & Theme Engine
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.75rem', borderRadius: '1rem' }}>
                5 Presets Available
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {themeOptions.map(t => {
                const isActive = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    className="btn"
                    onPointerDown={() => handleThemeChange(t.id)}
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? `1.5px solid ${t.color}` : '1px solid var(--border-color)',
                      background: isActive ? `${t.color}15` : 'rgba(255,255,255,0.02)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: isActive ? `0 0 14px ${t.color}25` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      textAlign: 'left',
                      position: 'relative',
                      minHeight: '80px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: t.color,
                        boxShadow: `0 0 8px ${t.color}`,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }} />
                      {isActive && <CheckCircle2 size={15} color={t.color} />}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, color: 'var(--text-primary)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business & Invoicing Details Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
              <Building2 size={20} color="var(--accent-1)" /> Business & GSTIN Profile
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Organizational info used to generate client invoices and tax reports.
            </p>

            <form onSubmit={handleSaveBusinessSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  Registered Entity / Business Name
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Building2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Financial Technologies Pvt Ltd"
                    required
                    style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
                  GSTIN Registration Number
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FileText size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={businessGSTIN}
                    onChange={(e) => setBusinessGSTIN(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    required
                    style={{ paddingLeft: '2.5rem', fontSize: '0.88rem', letterSpacing: '0.03em', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.2rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={15} /> Save Business Profile
                </button>

                {isSavedBusiness && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <CheckCircle2 size={15} /> Updated successfully
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Backup, Restore & Danger Zone Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
              <Database size={20} color="var(--accent-2)" /> Offline Data Backup & Vault
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.1rem', marginTop: '0.2rem' }}>
              Create encrypted offline backups or import external snapshot data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              {/* Export Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Export Database (.JSON)</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Snapshot of all ledgers, accounts, portfolios & logs</div>
                </div>
                <button
                  className="btn btn-secondary"
                  onPointerDown={handleExportBackup}
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                >
                  <Download size={14} /> Download Backup
                </button>
              </div>

              {/* Restore Toggle Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Restore Database Vault</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Paste JSON payload to restore system state</div>
                </div>
                <button
                  className="btn btn-secondary"
                  onPointerDown={() => setShowRestoreBox(prev => !prev)}
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                >
                  <Upload size={14} /> {showRestoreBox ? 'Hide Panel' : 'Restore Data'}
                </button>
              </div>

              {/* Restore Form Box */}
              {showRestoreBox && (
                <form onSubmit={handleImportBackup} className="animate-fade-in" style={{
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Paste Raw Backup JSON Content
                  </label>
                  <textarea
                    className="form-input"
                    style={{ height: '90px', fontSize: '0.76rem', fontFamily: 'monospace', resize: 'vertical' }}
                    placeholder='{"settings":{...},"profiles":[...]}'
                    value={backupJson}
                    onChange={(e) => setBackupJson(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      <Upload size={13} /> Confirm & Overwrite DB
                    </button>
                  </div>
                </form>
              )}

              {importStatus && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: importStatus.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                  border: importStatus.type === 'success' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                  color: importStatus.type === 'success' ? 'var(--success)' : 'var(--error)'
                }}>
                  {importStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{importStatus.msg}</span>
                </div>
              )}

              {/* Danger Zone */}
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={15} /> Danger Zone: Factory System Reset
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Wipes all local profiles, encryption keys, accounts, and journal entries.
                  </div>
                </div>

                <button
                  className="btn"
                  onPointerDown={() => setShowResetConfirm(true)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--error)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Trash2 size={14} /> Wipe All Data
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Profiles Registry & Audit Security Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Family Profiles & Nominees Registry Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                  <Users size={22} color="var(--accent-1)" /> Profiles & Access Registry
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 2.25rem', lineHeight: 1.5 }}>
                  Manage family members, nominee mappings, and passcode protection.
                </p>
              </div>

              <button
                className="btn btn-primary"
                onPointerDown={() => setShowAddProfile(true)}
                style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
              >
                <Plus size={16} /> Add Profile
              </button>
            </div>

            {/* Profiles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profiles.map(p => {
                const isAdmin = p.role === 'Admin';
                const isCurrentSession = p.id === activeProfileId;

                return (
                  <div key={p.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    background: isCurrentSession ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: isCurrentSession ? '1px solid var(--accent-1)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    boxShadow: isCurrentSession ? '0 0 20px rgba(59, 130, 246, 0.1)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--accent-grad)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                        overflow: 'hidden'
                      }}>
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (p.name || 'User').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {p.name || 'Unnamed Profile'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            ({p.relationship || 'Self'})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isCurrentSession && (
                            <span style={{ fontSize: '0.7rem', background: 'var(--accent-1)', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '0.4rem', fontWeight: 650 }}>
                              Active
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.4rem',
                            background: isAdmin ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.06)',
                            color: isAdmin ? '#c084fc' : 'var(--text-secondary)'
                          }}>
                            {p.role}
                          </span>
                          {p.isNomineeProvided ? (
                            <span style={{
                              fontSize: '0.7rem',
                              color: 'var(--success)',
                              fontWeight: 600,
                              background: 'var(--success-bg)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.4rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <ShieldCheck size={11} /> Nominee
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.7rem',
                              color: 'var(--warning)',
                              fontWeight: 600,
                              background: 'var(--warning-bg)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.4rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <AlertTriangle size={11} /> No Nominee
                            </span>
                          )}
                          {p.pin ? (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Lock size={11} /> PIN Protected
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn"
                        onPointerDown={() => {
                          setEditingProfile(p);
                          setEditProfName(p.name);
                          setEditProfRole(p.role);
                          setEditProfRel(p.relationship || 'Self');
                          setEditProfNominee(p.isNomineeProvided);
                          setEditProfPin(p.pin || '');
                          setEditProfAvatar(p.avatar || '');
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Edit Profile"
                      >
                        <Settings size={14} /> Edit
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onPointerDown={() => handleDeleteProfile(p.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: 'var(--error)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Delete Profile"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



        </div>

      </div>

      {/* DIALOG MODAL: Add Profile */}
      {showAddProfile && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '420px', padding: '1.5rem', borderRadius: '1.25rem',
            border: '1px solid var(--border-color)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                Add Family Profile
              </h3>
              <button
                onPointerDown={() => setShowAddProfile(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProfName}
                  onChange={(e) => setNewProfName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Profile Picture (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    {newProfAvatar ? (
                      <img src={newProfAvatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Users size={20} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="addProfAvatarInput"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, setNewProfAvatar)}
                    />
                    <label
                      htmlFor="addProfAvatarInput"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Upload size={14} /> Upload Image
                    </label>
                  </div>
                  {newProfAvatar && (
                    <button
                      type="button"
                      onPointerDown={() => setNewProfAvatar('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Relationship</label>
                  <select
                    className="form-input"
                    value={newProfRel}
                    onChange={(e) => setNewProfRel(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Access Role</label>
                  <select
                    className="form-input"
                    value={newProfRole}
                    onChange={(e) => setNewProfRole(e.target.value as any)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="Member">Member (Read & Write)</option>
                    <option value="Viewer">Viewer (Read-only)</option>
                    <option value="Admin">Admin (Full access)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Passcode PIN (Optional 4 digits)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newProfPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                      setNewProfPin(e.target.value);
                    }
                  }}
                  placeholder="â€¢â€¢â€¢â€¢"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }} onClick={() => setNewProfNominee(!newProfNominee)}>
                <input
                  type="checkbox"
                  checked={newProfNominee}
                  onChange={(e) => setNewProfNominee(e.target.checked)}
                  id="nomineeCheck"
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="nomineeCheck" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)', margin: 0 }}>
                  Designate as nominee on primary accounts
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                  onPointerDown={() => setShowAddProfile(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}
                >
                  Add Profile
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DIALOG MODAL: Edit Profile */}
      {editingProfile && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '420px', padding: '1.5rem', borderRadius: '1.25rem',
            border: '1px solid var(--border-color)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                Edit Profile Details
              </h3>
              <button
                onPointerDown={() => setEditingProfile(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editProfName}
                  onChange={(e) => setEditProfName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Profile Picture (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                  }}>
                    {editProfAvatar ? (
                      <img src={editProfAvatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Users size={20} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="editProfAvatarInput"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, setEditProfAvatar)}
                    />
                    <label
                      htmlFor="editProfAvatarInput"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Upload size={14} /> Upload Image
                    </label>
                  </div>
                  {editProfAvatar && (
                    <button
                      type="button"
                      onPointerDown={() => setEditProfAvatar('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Relationship</label>
                  <select
                    className="form-input"
                    value={editProfRel}
                    onChange={(e) => setEditProfRel(e.target.value)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Access Role</label>
                  <select
                    className="form-input"
                    value={editProfRole}
                    onChange={(e) => setEditProfRole(e.target.value as any)}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="Member">Member (Read & Write)</option>
                    <option value="Viewer">Viewer (Read-only)</option>
                    <option value="Admin">Admin (Full access)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Passcode PIN (Optional 4 digits)</label>
                <input
                  type="password"
                  className="form-input"
                  value={editProfPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                      setEditProfPin(e.target.value);
                    }
                  }}
                  placeholder="â€¢â€¢â€¢â€¢"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }} onClick={() => setEditProfNominee(!editProfNominee)}>
                <input
                  type="checkbox"
                  checked={editProfNominee}
                  onChange={(e) => setEditProfNominee(e.target.checked)}
                  id="editNomineeCheck"
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="editNomineeCheck" style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)', margin: 0 }}>
                  Designate as nominee on primary accounts
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                  onPointerDown={() => setEditingProfile(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}
                  onPointerDown={async (e) => {
                    e.preventDefault();
                    if (!editingProfile) {
                      alert("No profile is currently selected for editing.");
                      return;
                    }
                    if (!editProfName.trim()) {
                      alert("Profile name cannot be empty.");
                      return;
                    }
                    try {
                      await dbService.updateProfile(editingProfile.id, {
                        name: editProfName.trim(),
                        role: editProfRole,
                        relationship: editProfRel,
                        isNomineeProvided: editProfNominee,
                        pin: editProfPin && editProfPin !== '••••' ? editProfPin : editingProfile.pin,
                        avatar: editProfAvatar || undefined
                      });
                      onActiveProfileChange(activeProfileId);
                      setEditingProfile(null);
                      refreshData();
                    } catch (err: any) {
                      alert('Error saving changes: ' + (err?.message || JSON.stringify(err)));
                    }
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {cropImageSrc && (
        <ImageCropperModal
          isOpen={true}
          onClose={() => {
            setCropImageSrc(null);
            setActiveAvatarSetter(null);
          }}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* DIALOG MODAL: Confirm Reset */}
      {showResetConfirm && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '400px', padding: '1.5rem', borderRadius: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(180deg, rgba(30, 20, 20, 0.96) 0%, rgba(15, 10, 10, 0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Confirm Factory Reset
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Are you sure you want to reset the system? All local data, profiles, and configuration settings will be <strong>permanently deleted</strong>. This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                onPointerDown={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: 'var(--error)',
                  color: '#ffffff',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
                onPointerDown={handleResetDatabase}
              >
                Yes, Reset System
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
