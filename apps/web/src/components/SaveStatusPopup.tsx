import React, { useState } from 'react';
import { Button, IconButton, InfoCallout, Modal } from '@financeos/ui';
import { dbService } from '@financeos/database';
import { downloadBlob, todayStamp, STORAGE_KEYS } from '@financeos/shared';
import { AlertTriangle, RefreshCw, Download, X, CheckCircle2 } from 'lucide-react';

interface SaveStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  saveError: string | null;
  hasUnsavedChanges: boolean;
}

export const SaveStatusPopup: React.FC<SaveStatusPopupProps> = ({
  isOpen,
  onClose,
  saveError,
  hasUnsavedChanges
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retrySuccess, setRetrySuccess] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetrySuccess(false);
    try {
      await dbService.syncToCloud();
      setRetrySuccess(true);
      setTimeout(() => {
        setRetrySuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Retry save failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExportBackup = () => {
    try {
      setBackupStatus(null);
      const dataStr = localStorage.getItem(STORAGE_KEYS.dbCache);
      if (dataStr) {
        downloadBlob(
          `financeos_backup_emergency_${todayStamp()}.json`,
          new Blob([dataStr], { type: 'application/json' })
        );
      } else {
        setBackupStatus('No backup file is available to export yet. Make a change first and try again.');
      }
    } catch (e) {
      console.error('Failed emergency backup export:', e);
      setBackupStatus('Failed to generate local backup file.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showClose={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-125)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-075)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-tooltip)',
              background: 'var(--error-bg)',
              border: '1px solid var(--status-overdue-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--error)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 id="save-popup-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-heavy)', letterSpacing: 'var(--ls-tight)', margin: 0, color: 'var(--text-primary)' }}>
              Cloud Sync Pending — Local Vault Intact
            </h3>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)' }}>
              {saveError ? 'Cloud synchronization failed — your data is safely saved in your local vault' : 'Your latest changes are safely stored in your local vault and pending cloud synchronization.'}
            </span>
          </div>
        </div>
        <IconButton icon={<X size={20} />} label="Close dialog" variant="ghost" size="md" onClick={onClose} />
      </div>

      {backupStatus && (
        <InfoCallout variant="warning" style={{ marginBottom: 'var(--spacing-1)' }}>
          {backupStatus}
        </InfoCallout>
      )}

      <div
        style={{
          background: 'var(--surface-tint)',
          borderRadius: 'var(--radius-sm)',
          border: 'var(--neo-milled-border)',
          padding: 'var(--spacing-1)',
          marginBottom: 'var(--spacing-15)',
          fontSize: 'var(--font-base)',
          lineHeight: 'var(--lh-normal)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {saveError ? (
          <div style={{ color: 'var(--error)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-04)' }}>
            <div style={{ fontWeight: 'var(--fw-semibold)' }}>What went wrong:</div>
            <code className="type-mono" style={{ fontSize: 'var(--font-sm)', background: 'var(--bg-primary)', padding: 'var(--spacing-05)', borderRadius: 'var(--radius-xs)' }}>
              {saveError}
            </code>
            <p style={{ margin: 0, fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Your financial data is intact in your local encrypted vault. You can retry cloud sync or download a manual backup file.
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Your latest entries are safely stored in your local encrypted browser database. Click &quot;Retry Sync Now&quot; to push changes to your cloud backup.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-075)' }}>
        <Button
          type="button"
          variant="primary"
          onClick={handleRetry}
          disabled={isRetrying}
          style={{ width: '100%', padding: 'var(--spacing-06) var(--spacing-125)', justifyContent: 'center' }}
        >
          {retrySuccess ? (
            <>
              <CheckCircle2 size={18} />
              <span>Synced to cloud</span>
            </>
          ) : isRetrying ? (
            <>
              <RefreshCw size={18} className="spin" />
              <span>Syncing to cloud...</span>
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              <span>Retry Sync Now</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleExportBackup}
          style={{ width: '100%', padding: 'var(--spacing-06) var(--spacing-125)', justifyContent: 'center' }}
        >
          <Download size={18} />
          <span>Download Local Backup</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          style={{ width: '100%', padding: 'var(--spacing-06) var(--spacing-125)', justifyContent: 'center', opacity: 0.8 }}
        >
          <X size={18} />
          <span>Dismiss</span>
        </Button>
      </div>
    </Modal>
  );
};