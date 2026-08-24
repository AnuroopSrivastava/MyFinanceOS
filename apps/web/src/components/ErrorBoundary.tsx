import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@financeos/ui';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorInfo: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
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
