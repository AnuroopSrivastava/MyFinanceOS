import React, { Component, ErrorInfo, ReactNode } from 'react';

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
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh',
          background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem', textAlign: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '1rem', color: '#ff4d4f' }}>Oops, something went wrong.</h1>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              The application encountered an unexpected error. Please restart the app or reload the page.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'left', overflowX: 'auto', marginBottom: '2rem' }}>
              <code>{this.state.errorInfo?.toString()}</code>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
