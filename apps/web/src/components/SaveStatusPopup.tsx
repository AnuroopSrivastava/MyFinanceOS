import React, { useState } from 'react';
import { dbService } from '@financeos/database';
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
      const dataStr = localStorage.getItem('financeos_db_cache');
      if (dataStr) {
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeos_backup_emergency_${new Date().toISOString().substring(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('No local database snapshot available to export.');
      }
    } catch (e) {
      console.error('Failed emergency backup export:', e);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '1.75rem',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95), rgba(30, 15, 20, 0.95))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Auto-Save Not Completed
              </h3>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {saveError ? 'Save or cloud synchronization encountered an issue' : 'Unsaved changes pending save completion'}
              </span>
            </div>
          </div>
          <button
            onPointerDown={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Diagnostic info box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}
        >
          {saveError ? (
            <div style={{ color: '#f87171', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontWeight: 600 }}>Diagnostic Log:</div>
              <code style={{ fontSize: '0.825rem', background: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '6px' }}>
                {saveError}
              </code>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Your latest edits are stored in temporary memory, but haven't been confirmed on disk or cloud sync. Retrying will complete auto-saving.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onPointerDown={handleRetry}
            disabled={isRetrying}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            {retrySuccess ? (
              <>
                <CheckCircle2 size={18} color="#10b981" />
                <span>Save Completed Successfully!</span>
              </>
            ) : isRetrying ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>Attempting Auto-Save...</span>
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                <span>Retry Save Now</span>
              </>
            )}
          </button>

          <button
            onPointerDown={handleExportBackup}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <Download size={18} />
            <span>Export Emergency JSON Backup</span>
          </button>

          <button
            onPointerDown={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              textDecoration: 'underline'
            }}
          >
            Dismiss and continue working
          </button>
        </div>
      </div>
    </div>
  );
};
