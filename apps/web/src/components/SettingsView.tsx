import React, { useState } from 'react';
import { dbService } from '@financeos/database';
import { useDbSyncCallback } from '../hooks/useDbSync.js';
import { setTheme, AppTheme, Button, Modal, ConfirmModal, useConfirmModal, SectionHeader, Badge, StatusBadge, FormField, IconInput, FileDropzone, FormRow, FormActions } from '@financeos/ui';
import { UserProfile, SystemSettings, createPinHash, downloadBlob, todayStamp } from '@financeos/shared';
import { ImageCropperModal } from './ImageCropperModal.js';
import {
  Settings, Users, Download, Upload,
  Trash2, Plus, Sliders, CheckCircle2, AlertTriangle,
  Building2, FileText, Lock, X,
  ShieldCheck, Database, Save
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
  const { modal: confirmModal, openConfirm, closeConfirm } = useConfirmModal();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfRole, setNewProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [newProfRel, setNewProfRel] = useState('Spouse');
  const [newProfNominee, setNewProfNominee] = useState(false);
  const [newProfPin, setNewProfPin] = useState('');
  const [newProfAvatar, setNewProfAvatar] = useState('');
  const [addProfError, setAddProfError] = useState<string | null>(null);

  // Edit profile States
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editProfName, setEditProfName] = useState('');
  const [editProfRole, setEditProfRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [editProfRel, setEditProfRel] = useState('Spouse');
  const [editProfNominee, setEditProfNominee] = useState(false);
  const [editProfPin, setEditProfPin] = useState('');
  const [removeExistingPin, setRemoveExistingPin] = useState(false);
  const [editProfAvatar, setEditProfAvatar] = useState('');
  const [editProfError, setEditProfError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Image Cropper State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [activeAvatarSetter, setActiveAvatarSetter] = useState<((val: string) => void) | null>(null);

  // Backup Import State
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdminDeleteWarning, setShowAdminDeleteWarning] = useState(false);

  const refreshData = React.useCallback(() => {
    setProfiles(dbService.getProfiles());
    setSettings(dbService.getSettings());
  }, []);

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

    setImageError(null);
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB");
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

  const handleAddProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddProfError(null);
    if (!newProfName.trim()) {
      setAddProfError("Please enter a profile name.");
      return;
    }

    try {
      const pinHash = newProfPin ? await createPinHash(newProfPin) : undefined;
      await dbService.addProfile({
        name: newProfName.trim(),
        role: newProfRole,
        relationship: newProfRel,
        isNomineeProvided: newProfNominee,
        pinHash,
        avatar: newProfAvatar || undefined
      });

      setNewProfName('');
      setNewProfPin('');
      setNewProfAvatar('');
      setShowAddProfile(false);
      refreshData();
    } catch (err: any) {
      console.error('Failed to add profile:', err);
      setAddProfError('Error adding profile: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleOpenEditProfile = (p: UserProfile) => {
    setEditingProfile(p);
    setEditProfName(p.name);
    setEditProfRole(p.role);
    setEditProfRel(p.relationship || 'Self');
    setEditProfNominee(Boolean(p.isNomineeProvided));
    setEditProfPin('');
    setRemoveExistingPin(false);
    setEditProfAvatar(p.avatar || '');
    setEditProfError(null);
  };

  const handleSaveEditProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEditProfError(null);
    if (!editingProfile) {
      setEditProfError("No profile is currently selected for editing.");
      return;
    }
    if (!editProfName.trim()) {
      setEditProfError("Profile name cannot be empty.");
      return;
    }
    try {
      let pinHash = editingProfile.pinHash;
      if (removeExistingPin) {
        pinHash = undefined;
      } else if (editProfPin.trim()) {
        pinHash = await createPinHash(editProfPin.trim());
      }
      await dbService.updateProfile(editingProfile.id, {
        name: editProfName.trim(),
        role: editProfRole,
        relationship: editProfRel,
        isNomineeProvided: editProfNominee,
        pinHash,
        avatar: editProfAvatar || undefined
      });
      setEditingProfile(null);
      refreshData();
      onActiveProfileChange(activeProfileId);
    } catch (err: any) {
      console.error('Failed to save profile changes:', err);
      setEditProfError('Error saving changes: ' + (err?.message || JSON.stringify(err)));
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const currentProfiles = dbService.getProfiles();
    const profile = profiles.find(p => p.id === profileId) || currentProfiles.find(p => p.id === profileId);
    if (!profile) return;

    const adminCount = currentProfiles.filter(p => p.role === 'Admin').length;
    if (profile.role === 'Admin' && adminCount <= 1) {
      setShowAdminDeleteWarning(true);
      return;
    }

    openConfirm({
      title: 'Delete Profile',
      message: `Permanently delete profile "${profile.name}"? This will irreversibly delete all personal finance records linked to this profile.`,
      confirmLabel: 'Delete Profile',
      isDanger: true,
      onConfirm: async () => {
        await dbService.deleteProfile(profileId);
        const remaining = dbService.getProfiles();
        if (activeProfileId === profileId) {
          if (remaining.length > 0) {
            onActiveProfileChange(remaining[0].id);
          } else {
            onActiveProfileChange('');
          }
        }
        refreshData();
      }
    });
  };

  const handleResetDatabase = async () => {
    localStorage.clear();
    window.location.reload();
  };

  // Backups: Download database JSON
  const handleExportBackup = () => {
    try {
      setExportError(null);
      const dataStr = dbService.getRawDb();
      downloadBlob(
        `financeos_vault_backup_${todayStamp()}.json`,
        new Blob([dataStr], { type: 'application/json' })
      );
    } catch (e) {
      setExportError('Failed to export backup file.');
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
    <div className="gap-stack-25 animate-fade-in" style={{ paddingBottom: 'var(--spacing-30)' }}>

      {/* Page Header Banner */}
      <SectionHeader
        variant="banner"
        icon={<Settings />}
        title="System Settings & Configuration"
        description="Manage visual themes, organizational details, profile privileges, backups, and security activity."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', flexWrap: 'wrap' }}>
            <Badge variant="success" size="md">
              <ShieldCheck size={14} />
              <span>AES-256 Offline Vault</span>
            </Badge>
            <Badge variant="cyan" size="md">
              <Users size={14} />
              <span>{profiles.length} Profiles Active</span>
            </Badge>
          </div>
        }
      />

      {/* Main Responsive Grid Layout */}
      <div className="card-grid-lg responsive-stack" style={{ gridTemplateColumns: '1.2fr 1fr' }}>

        {/* LEFT COLUMN: Appearance, Business Info & Disaster Recovery */}
        <div className="gap-stack-25">

          {/* Theme Customizer Card */}
          <div className="glass-panel" style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)' }}>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', fontFamily: 'var(--font-display)', margin: 0 }}>
                <Sliders size={20} color="var(--accent-1)" /> Appearance & Theme Engine
              </h3>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--fw-heavy)', background: 'var(--border-subtle)', padding: 'var(--spacing-04) var(--spacing-075)', borderRadius: 'var(--radius-md)' }}>
                5 Presets Available
              </span>
            </div>

            <div role="radiogroup" aria-label="Visual Themes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-1)' }}>
              {themeOptions.map(t => {
                const isActive = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`Select ${t.label} theme`}
                    className="btn"
                    onClick={() => handleThemeChange(t.id)}
                    style={{
                      padding: 'var(--spacing-1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: isActive ? `1.5px solid ${t.color}` : '1px solid var(--border-color)',
                      borderRight: isActive ? `1.5px solid ${t.color}` : '1px solid var(--border-color)',
                      borderBottom: isActive ? `1.5px solid ${t.color}` : '1px solid var(--border-color)',
                      borderTop: isActive ? `1.5px solid ${t.color}` : 'var(--neo-bevel-top)',
                      background: 'var(--bg-panel)',
                      backgroundImage: 'var(--neo-convex-grad)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: isActive ? `var(--neo-raised-sm), 0 0 14px ${t.color}35` : 'var(--neo-raised-sm)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      textAlign: 'left',
                      position: 'relative',
                      minHeight: '100px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{
                        width: 'var(--spacing-075)',
                        height: 'var(--spacing-075)',
                        borderRadius: '50%',
                        background: t.color,
                        boxShadow: `0 0 8px ${t.color}`,
                        border: '1px solid rgba(255,255,255,0.3)'
                      }} />
                      {isActive && <CheckCircle2 size={15} color={t.color} />}
                    </div>

                    <div style={{ marginTop: 'var(--spacing-05)' }}>
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: isActive ? 700 : 500, color: 'var(--text-primary)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        {t.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business & Invoicing Details Card */}
          <div className="glass-panel" style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', marginBottom: 'var(--spacing-05)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', fontFamily: 'var(--font-display)', margin: 0 }}>
              <Building2 size={20} color="var(--accent-1)" /> Business & GSTIN Profile
            </h3>
            <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-15)', marginTop: 'var(--spacing-05)', lineHeight: 1.5 }}>
              Organizational info used to generate client invoices and tax reports.
            </p>

            <form onSubmit={handleSaveBusinessSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <IconInput
                id="business-entity-name"
                icon={<Building2 />}
                label="Registered Entity / Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Financial Technologies Pvt Ltd"
                required
              />

              <IconInput
                id="business-gstin-number"
                icon={<FileText />}
                label="GSTIN Registration Number"
                value={businessGSTIN}
                onChange={(e) => setBusinessGSTIN(e.target.value.toUpperCase())}
                placeholder="e.g. 27AAAAA0000A1Z5"
                required
                style={{ letterSpacing: '0.03em', fontFamily: 'monospace' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-08)', marginTop: 'var(--spacing-02)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  style={{
                    padding: 'var(--spacing-06) var(--spacing-125)',
                    fontSize: 'var(--font-sm)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-05)'
                  }}
                >
                  <Save size={15} /> Save Business Profile
                </Button>

                {isSavedBusiness && (
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-04)', fontWeight: 'var(--fw-semibold)' }}>
                    <CheckCircle2 size={15} /> Updated successfully
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Backup, Restore & Danger Zone Card */}
          <div className="glass-panel" style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', marginBottom: 'var(--spacing-05)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', fontFamily: 'var(--font-display)', margin: 0 }}>
              <Database size={20} color="var(--accent-2)" /> Offline Data Backup & Vault
            </h3>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)', marginTop: 'var(--spacing-02)' }}>
              Create encrypted offline backups or import external snapshot data.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-085)' }}>

              {/* Export Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-085) var(--spacing-1)',
                background: 'var(--surface-faint)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Export Database (.JSON)</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Snapshot of all ledgers, accounts, portfolios & logs</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleExportBackup}
                  style={{ padding: 'var(--spacing-05) var(--spacing-09)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', whiteSpace: 'nowrap' }}
                >
                  <Download size={14} /> Download Backup
                </Button>
              </div>

              {/* Restore Toggle Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-085) var(--spacing-1)',
                background: 'var(--surface-faint)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>Restore Database Vault</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Paste JSON payload to restore system state</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowRestoreBox(prev => !prev)}
                  style={{ padding: 'var(--spacing-05) var(--spacing-09)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', whiteSpace: 'nowrap' }}
                >
                  <Upload size={14} /> {showRestoreBox ? 'Hide Panel' : 'Restore Data'}
                </Button>
              </div>

              {/* Restore Form Box */}
              {showRestoreBox && (
                <form onSubmit={handleImportBackup} className="animate-fade-in" style={{
                  padding: 'var(--spacing-1)',
                  background: 'var(--overlay-scrim)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-075)'
                }}>
                  <FileDropzone
                    accept=".json"
                    label="Upload Backup JSON File"
                    sublabel="Drag & drop exported backup .json file or click to browse"
                    variant="compact"
                    onFileSelect={(file) => {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const content = e.target?.result as string;
                        if (content) setBackupJson(content);
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <label className="form-label" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                    — OR Paste Raw Backup JSON Content —
                  </label>
                  <textarea
                    className="form-input"
                    style={{ height: '90px', fontSize: 'var(--font-xs)', fontFamily: 'monospace', resize: 'vertical' }}
                    placeholder='{"settings":{...},"profiles":[...]}'
                    value={backupJson}
                    onChange={(e) => setBackupJson(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-05)' }}>
                    <Button
                      type="submit"
                      variant="primary"
                      style={{ padding: 'var(--spacing-04) var(--spacing-1)', fontSize: 'var(--font-sm)' }}
                    >
                      <Upload size={13} /> Confirm &amp; Restore Backup
                    </Button>
                  </div>
                </form>
              )}

              {importStatus && (
                <div style={{
                  padding: 'var(--spacing-06) var(--spacing-085)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-05)',
                  background: importStatus.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                  border: importStatus.type === 'success' ? '1px solid var(--status-paid-border)' : '1px solid var(--status-overdue-border)',
                  color: importStatus.type === 'success' ? 'var(--success)' : 'var(--error)'
                }}>
                  {importStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{importStatus.msg}</span>
                </div>
              )}

              {/* Danger Zone */}
              <div style={{
                marginTop: 'var(--spacing-05)',
                padding: 'var(--spacing-1)',
                background: 'var(--status-overdue-bg)',
                border: '1px solid var(--status-overdue-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-1)',
                flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)' }}>
                    <AlertTriangle size={15} /> Factory System Reset
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-02)' }}>
                    Permanently erases all local profiles, encryption keys, accounts, and financial records from this browser.
                  </div>
                </div>

                <Button
                  variant="danger"
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    padding: 'var(--spacing-04) var(--spacing-09)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--fw-semibold)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Trash2 size={14} /> Reset All Data
                </Button>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Profiles Registry & Audit Security Logs */}
        <div className="gap-stack-25">

          {/* Family Profiles & Nominees Registry Card */}
          <div className="glass-panel" data-interactive-card="off" style={{ padding: 'var(--spacing-2)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)', fontFamily: 'var(--font-display)', margin: 0 }}>
                  <Users size={22} color="var(--accent-1)" /> Profiles & Access Registry
                </h3>
                <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', margin: 'var(--spacing-05) 0 0 var(--spacing-125)', lineHeight: 1.5 }}>
                  Manage family members, nominee mappings, and passcode protection.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => setShowAddProfile(true)}
                style={{ padding: 'var(--spacing-075) var(--spacing-125)', fontSize: 'var(--font-base)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', fontWeight: 'var(--fw-semibold)' }}
              >
                <Plus size={16} /> Add Profile
              </Button>
            </div>

            {/* Profiles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              {profiles.map(p => {
                const isAdmin = p.role === 'Admin';
                const isCurrentSession = p.id === activeProfileId;

                return (
                  <div
                    key={p.id}
                    data-interactive-card="off"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--spacing-1) var(--spacing-125)',
                      background: isCurrentSession ? 'var(--accent-soft)' : 'var(--surface-faint)',
                      border: isCurrentSession ? '1px solid var(--accent-1)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      gap: 'var(--spacing-1)',
                      boxShadow: isCurrentSession ? '0 0 16px var(--border-color-glow)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', minWidth: 0, flex: '1 1 auto' }}>
                      {/* Avatar with theme-adaptive border & glow */}
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          minWidth: '48px',
                          minHeight: '48px',
                          borderRadius: '50%',
                          background: 'var(--accent-grad)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-on-action)',
                          fontWeight: 'var(--fw-heavy)',
                          fontSize: 'var(--font-md)',
                          flexShrink: 0,
                          boxShadow: isCurrentSession
                            ? '0 0 0 2px var(--accent-1), 0 0 14px var(--accent-1)'
                            : '0 0 0 2px var(--border-color)',
                          overflow: 'hidden',
                        }}
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          (p.name || 'User').charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Name & Metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-035)', minWidth: 0 }}>
                        {/* Name & Relation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'var(--fw-heavy)', fontSize: 'var(--font-base)', color: 'var(--text-primary)', letterSpacing: 'var(--ls-tight)' }}>
                            {p.name || 'Unnamed Profile'}
                          </span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
                            ({p.relationship || 'Self'})
                          </span>
                        </div>

                        {/* Badges Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-04)', flexWrap: 'wrap' }}>
                          {isCurrentSession && (
                            <StatusBadge status="active" label="Active" />
                          )}
                          <Badge variant={isAdmin ? 'indigo' : 'default'} size="sm">
                            {p.role}
                          </Badge>
                          {p.isNomineeProvided ? (
                            <StatusBadge status="nominee" />
                          ) : (
                            <StatusBadge status="warning" label="No Nominee" />
                          )}
                          {p.pinHash ? (
                            <Badge variant="default" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-02)' }}>
                              <Lock size={11} /> PIN Protected
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Theme-Aware Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)', flexShrink: 0 }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditProfile(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-035)',
                        }}
                        title="Edit Profile"
                      >
                        <Settings size={14} /> Edit
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteProfile(p.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-035)',
                        }}
                        title="Delete Profile"
                      >
                        <Trash2 size={14} /> Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



        </div>

      </div>

      {/* DIALOG MODAL: Add Profile */}
      {showAddProfile && (
        <Modal
          isOpen={showAddProfile}
          onClose={() => setShowAddProfile(false)}
          title="Add Family Profile"
          size="md"
        >
        <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
          {addProfError && (
            <div style={{ padding: 'var(--spacing-04) var(--spacing-06)', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)' }}>
              {addProfError}
            </div>
          )}
          <FormField label="Full Name" style={{ margin: 0 }}>
            <input
              type="text"
              className="form-input"
              value={newProfName}
              onChange={(e) => setNewProfName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
              style={{ width: '100%', fontSize: 'var(--font-sm)' }}
            />
          </FormField>

          <FormField label="Profile Picture (Optional)" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                minWidth: '48px',
                minHeight: '48px',
                borderRadius: '50%', background: 'var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                border: '1px solid var(--border-color)',
                flexShrink: 0
              }}>
                {newProfAvatar ? (
                  <img src={newProfAvatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Users size={20} color="var(--text-muted)" />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
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
                  style={{ padding: 'var(--spacing-04) var(--spacing-08)', fontSize: 'var(--font-xs)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-04)' }}
                >
                  <Upload size={14} /> Upload Image
                </label>
                {newProfAvatar && (
                  <button
                    type="button"
                    onClick={() => setNewProfAvatar('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 'var(--spacing-04)', display: 'flex', alignItems: 'center' }}
                    title="Remove Image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </FormField>

          <FormRow gap="var(--spacing-075)">
            <FormField label="Relationship" style={{ margin: 0 }}>
              <select
                className="form-input"
                value={newProfRel}
                onChange={(e) => setNewProfRel(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--font-sm)' }}
              >
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </FormField>

            <FormField label="Access Role" style={{ margin: 0 }}>
              <select
                className="form-input"
                value={newProfRole}
                onChange={(e) => setNewProfRole(e.target.value as any)}
                style={{ width: '100%', fontSize: 'var(--font-sm)' }}
              >
                <option value="Member">Member (Read & Write)</option>
                <option value="Viewer">Viewer (Read-only)</option>
                <option value="Admin">Admin (Full access)</option>
              </select>
            </FormField>
          </FormRow>

          <FormField label="Passcode PIN (Optional 4 digits)" style={{ margin: 0 }}>
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
              style={{ width: '100%', fontSize: 'var(--font-sm)' }}
            />
          </FormField>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-06)',
            padding: 'var(--spacing-05) var(--spacing-075)',
            background: 'var(--surface-tint)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }} onClick={() => setNewProfNominee(!newProfNominee)}>
            <input
              type="checkbox"
              checked={newProfNominee}
              onChange={(e) => setNewProfNominee(e.target.checked)}
              id="nomineeCheck"
              style={{ width: 'var(--spacing-05)', height: 'var(--spacing-05)', cursor: 'pointer' }}
            />
            <label htmlFor="nomineeCheck" style={{ fontSize: 'var(--font-xs)', cursor: 'pointer', color: 'var(--text-primary)', margin: 0 }}>
              Designate as nominee on primary accounts
            </label>
          </div>

          <FormActions
            onCancel={() => setShowAddProfile(false)}
            onSubmit={() => { handleAddProfile(); }}
            submitLabel="Add Profile"
          />
        </form>
      </Modal>
      )}

      {/* DIALOG MODAL: Edit Profile */}
      {editingProfile && (
        <Modal
          isOpen={!!editingProfile}
          onClose={() => { setEditingProfile(null); setEditProfError(null); }}
          title="Edit Profile Details"
          size="md"
        >
          <form onSubmit={handleSaveEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
            {editProfError && (
              <div style={{ padding: 'var(--spacing-04) var(--spacing-06)', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)' }}>
                {editProfError}
              </div>
            )}
            <FormField label="Full Name" style={{ margin: 0 }}>
              <input
                type="text"
                className="form-input"
                value={editProfName}
                onChange={(e) => setEditProfName(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--font-sm)' }}
                required
              />
            </FormField>

            <FormField label="Profile Picture (Optional)" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  minHeight: '48px',
                  borderRadius: '50%', background: 'var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  {editProfAvatar ? (
                    <img src={editProfAvatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Users size={20} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-05)' }}>
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
                    style={{ padding: 'var(--spacing-04) var(--spacing-08)', fontSize: 'var(--font-xs)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-04)' }}
                  >
                    <Upload size={14} /> Upload Image
                  </label>
                  {editProfAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditProfAvatar('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 'var(--spacing-04)', display: 'flex', alignItems: 'center' }}
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </FormField>

            <FormRow gap="var(--spacing-075)">
              <FormField label="Relationship" style={{ margin: 0 }}>
                <select
                  className="form-input"
                  value={editProfRel}
                  onChange={(e) => setEditProfRel(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--font-sm)' }}
                >
                  <option value="Self">Self</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField label="Access Role" style={{ margin: 0 }}>
                <select
                  className="form-input"
                  value={editProfRole}
                  onChange={(e) => setEditProfRole(e.target.value as any)}
                  style={{ width: '100%', fontSize: 'var(--font-sm)' }}
                >
                  <option value="Member">Member (Read & Write)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                  <option value="Admin">Admin (Full access)</option>
                </select>
              </FormField>
            </FormRow>

            <FormField
              label={
                editingProfile.pinHash && !removeExistingPin
                  ? "Passcode PIN (PIN currently active — leave blank to keep unchanged)"
                  : "Passcode PIN (Optional 4 digits)"
              }
              style={{ margin: 0 }}
            >
              <div style={{ display: 'flex', gap: 'var(--spacing-05)', alignItems: 'center' }}>
                <input
                  type="password"
                  className="form-input"
                  value={editProfPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                      setEditProfPin(e.target.value);
                      if (removeExistingPin) setRemoveExistingPin(false);
                    }
                  }}
                  placeholder={
                    editingProfile.pinHash && !removeExistingPin
                      ? "•••• (Unchanged)"
                      : "4-digit PIN"
                  }
                  style={{ width: '100%', fontSize: 'var(--font-sm)' }}
                />
                {editingProfile.pinHash && (
                  <Button
                    type="button"
                    variant={removeExistingPin ? 'secondary' : 'danger'}
                    onClick={() => {
                      setRemoveExistingPin(!removeExistingPin);
                      setEditProfPin('');
                    }}
                    style={{ fontSize: 'var(--font-xs)', padding: 'var(--spacing-04) var(--spacing-075)', whiteSpace: 'nowrap' }}
                  >
                    {removeExistingPin ? 'Keep Existing PIN' : 'Remove PIN'}
                  </Button>
                )}
              </div>
            </FormField>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-06)',
              padding: 'var(--spacing-05) var(--spacing-075)',
              background: 'var(--surface-tint)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }} onClick={() => setEditProfNominee(!editProfNominee)}>
              <input
                type="checkbox"
                checked={editProfNominee}
                onChange={(e) => setEditProfNominee(e.target.checked)}
                id="editNomineeCheck"
                style={{ width: 'var(--spacing-05)', height: 'var(--spacing-05)', cursor: 'pointer' }}
              />
              <label htmlFor="editNomineeCheck" style={{ fontSize: 'var(--font-xs)', cursor: 'pointer', color: 'var(--text-primary)', margin: 0 }}>
                Designate as nominee on primary accounts
              </label>
            </div>

            <FormActions
              onCancel={() => { setEditingProfile(null); setEditProfError(null); }}
              onSubmit={() => { handleSaveEditProfile(); }}
              submitLabel="Save Profile Changes"
            />
          </form>
        </Modal>
      )}

      {/* DIALOG MODAL: Protected Admin Delete Warning */}
      {showAdminDeleteWarning && (
        <Modal
          isOpen={showAdminDeleteWarning}
          onClose={() => setShowAdminDeleteWarning(false)}
          title="Cannot Delete Admin Profile"
          size="sm"
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', alignItems: 'center' }}>
            <p className="type-body-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
              At least one Admin profile must exist to maintain system access and security settings.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowAdminDeleteWarning(false)}
              style={{ padding: 'var(--spacing-05) var(--spacing-125)', fontSize: 'var(--font-sm)' }}
            >
              Understand
            </Button>
          </div>
        </Modal>
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
      {showResetConfirm && (
        <Modal
          isOpen={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          title="Confirm Factory Reset"
          size="sm"
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Are you sure you want to reset the system? All local data, profiles, and configuration settings will be <strong>permanently deleted</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-075)', justifyContent: 'center', width: '100%' }}>
              <Button
                type="button"
                variant="secondary"
                style={{ padding: 'var(--spacing-06) var(--spacing-125)', fontSize: 'var(--font-sm)' }}
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                style={{
                  background: 'var(--error)',
                  color: '#ffffff',
                  padding: 'var(--spacing-06) var(--spacing-125)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--fw-semibold)'
                }}
                onClick={handleResetDatabase}
              >
                Yes, Reset System
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal state={confirmModal} onClose={closeConfirm} />
    </div>
  );
};
