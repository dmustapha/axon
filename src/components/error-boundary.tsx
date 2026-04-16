'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AXON] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100dvh', background: 'var(--ax-bg)', color: 'var(--ax-text)', gap: 16, padding: 32,
        }}>
          <div style={{ fontSize: 40 }}>&#9888;</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: 'var(--ax-text-muted)', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--ax-accent-dim)', border: '1px solid hsla(35, 90%, 55%, 0.2)',
              color: 'var(--ax-accent)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
