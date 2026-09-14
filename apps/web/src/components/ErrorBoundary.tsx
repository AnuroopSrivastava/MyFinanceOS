import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@financeos/ui';
import posthog from 'posthog-js';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: Error | null;
  isRecovering: boolean;
}

// A ChunkLoadError means the browser could not fetch a route chunk. After a new
// deploy, an open tab still points at chunk names the server no longer serves,
// so a one-time reload pulls the fresh bundle. The session flag stops a
// genuinely broken build from reloading forever.
const CHUNK_RELOAD_FLAG = 'financeos:chunk-reload-attempted';

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return error.name === 'ChunkLoadError' || /Loading (?:CSS )?chunk [^\s]+ failed/i.test(error.message ?? '');
}

// Returns true only when a chunk reload has not been tried yet this session.
// Any sessionStorage failure reports "already attempted" so we never loop.
function canReloadForChunkError(): boolean {
  try {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(CHUNK_RELOAD_FLAG) !== '1';
  } catch {
    return false;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null,
    isRecovering: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorInfo: error,
      isRecovering: isChunkLoadError(error) && canReloadForChunkError()
    };
  }

  public componentDidMount() {
    // A clean load clears the flag so a later deploy in this session can
    // recover again.
    if (!this.state.hasError) {
      try {
        window.sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
      } catch {
        // sessionStorage unavailable; nothing to clear.
      }
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.state.isRecovering) {
      try {
        window.sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
      } catch {
        // sessionStorage unavailable; the reload still proceeds once.
      }
      window.location.reload();
      return;
    }
    console.error("Uncaught error:", error, errorInfo);
    posthog.captureException(error);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        // Reloading to fetch the fresh chunk; render nothing to avoid a flash
        // of the error UI.
        return null;
      }
      return (
        <div role="alert" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh',
          background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 'var(--spacing-2)', textAlign: 'center'
        }}>
          <div className="glass-panel" data-interactive-card="off" style={{
            padding: 'var(--spacing-25)', maxWidth: '600px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            borderTop: 'var(--neo-bevel-top)',
            borderBottom: 'var(--neo-bevel-bottom)',
            backgroundImage: 'var(--neo-convex-grad)',
            boxShadow: 'var(--neo-raised-lg)',
          }}>
            <h1 style={{ marginBottom: 'var(--spacing-1)', color: 'var(--error)' }}>Something went wrong.</h1>
            <p style={{ marginBottom: 'var(--spacing-15)', color: 'var(--text-secondary)' }}>
              FinanceOS hit an unexpected error. Your data is safe — reload the page to continue.
            </p>
            <div style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--neo-inset-sm)', border: '1px solid var(--border-color)', padding: 'var(--spacing-1)', borderRadius: 'var(--radius-sm)', textAlign: 'left', overflowX: 'auto', marginBottom: 'var(--spacing-2)' }}>
              <code>{this.state.errorInfo?.toString()}</code>
            </div>
            <Button 
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
