import React, { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Error Boundary
 * ----------------------------------------------------------------------------
 * Catches render-time JS errors anywhere in its child tree and shows a
 * recoverable fallback UI instead of a blank white screen.
 *
 * NOTE: Error boundaries can only be class components — React has no hook
 * equivalent for componentDidCatch / getDerivedStateFromError as of React 19.
 *
 * Integration points
 * ----------------------------------------------------------------------------
 * 1) App-wide safety net (wrap the whole app once, in App.tsx / main.jsx):
 *
 *      <ErrorBoundary>
 *        <Router>...</Router>
 *      </ErrorBoundary>
 *
 * 2) Per-route reset — pass `resetKeys` so the boundary automatically clears
 *    itself when the user navigates away from the page that crashed (avoids
 *    getting stuck on the fallback screen forever):
 *
 *      const location = useLocation();
 *      <ErrorBoundary resetKeys={[location.pathname]}>
 *        <Outlet />
 *      </ErrorBoundary>
 *
 * 3) Isolating a risky widget (e.g. a chart) so one broken widget doesn't take
 *    down the whole dashboard — use the `level="section"` compact fallback:
 *
 *      <ErrorBoundary level="section" name="Spending Chart">
 *        <SpendingChart data={data} />
 *      </ErrorBoundary>
 *
 * 4) HOC form, for wrapping a page component at export time:
 *
 *      export default withErrorBoundary(Dashboard, { name: 'Dashboard' });
 */

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback renderer. Receives the error + a `reset()` callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called once when an error is caught — wire this up to a logging/reporting service. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * When any value in this array changes (shallow compare) after an error was
   * caught, the boundary automatically resets. Typical use: `[location.pathname]`.
   */
  resetKeys?: unknown[];
  /**
   * 'page'    — full-page fallback (default), used for top-level/route boundaries.
   * 'section' — compact inline fallback for isolating a single widget/card.
   */
  level?: 'page' | 'section';
  /** Friendly name shown in the fallback + logged with the error, e.g. "Dashboard". */
  name?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Always log locally so the trace survives even if reporting fails.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, errorInfo);

    try {
      this.props.onError?.(error, errorInfo);
    } catch (reportingError) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] onError handler itself threw:', reportingError);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.error) return;
    const prevKeys = prevProps.resetKeys ?? [];
    const nextKeys = this.props.resetKeys ?? [];
    const changed =
      prevKeys.length !== nextKeys.length || nextKeys.some((key, i) => key !== prevKeys[i]);
    if (changed) this.reset();
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    const { children, fallback, level = 'page', name } = this.props;

    if (!error) return children;

    if (fallback) return fallback(error, this.reset);

    return level === 'section' ? (
      <SectionErrorFallback error={error} name={name} onRetry={this.reset} />
    ) : (
      <PageErrorFallback
        error={error}
        errorInfo={this.state.errorInfo}
        name={name}
        onRetry={this.reset}
        onReload={this.handleReload}
      />
    );
  }
}

function PageErrorFallback({
  error,
  errorInfo,
  name,
  onRetry,
  onReload,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  name?: string;
  onRetry: () => void;
  onReload: () => void;
}) {
  const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.DEV);

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-dark, #0f172a)',
      }}
    >
      <div
        className="glass-card"
        style={{ maxWidth: '560px', width: '100%', padding: '40px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '8px', lineHeight: 1 }}>💥</div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800 }}>
          Something went wrong{name ? ` in ${name}` : ''}
        </h1>
        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.95rem' }}>
          This part of the app hit an unexpected error. Your data is safe — try again, or reload
          the page. If this keeps happening, please let us know.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            🔄 Try Again
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReload}>
            ⟳ Reload Page
          </button>
        </div>

        {isDev && (
          <details style={{ marginTop: '28px', textAlign: 'left' }}>
            <summary
              style={{
                cursor: 'pointer',
                color: 'var(--text-tertiary, #94a3b8)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Technical details (visible in development only)
            </summary>
            <pre
              style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border, #374151)',
                color: '#fca5a5',
                fontSize: '0.75rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.toString()}
              {errorInfo?.componentStack ? `\n${errorInfo.componentStack}` : ''}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function SectionErrorFallback({
  error,
  name,
  onRetry,
}: {
  error: Error;
  name?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="glass-card"
      style={{
        padding: '24px',
        textAlign: 'center',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      }}
    >
      <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>⚠️</div>
      <p style={{ margin: '0 0 4px 0', fontWeight: 700 }}>
        {name ? `${name} couldn't load` : "This section couldn't load"}
      </p>
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '0.82rem',
          color: 'var(--text-tertiary, #94a3b8)',
        }}
        title={error.message}
      >
        {error.message || 'An unexpected error occurred'}
      </p>
      <button type="button" className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={onRetry}>
        🔄 Retry
      </button>
    </div>
  );
}

/** HOC for wrapping a page/component with an ErrorBoundary at export time. */
export function withErrorBoundary<P extends object>(
  Wrapped: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = Wrapped.displayName || Wrapped.name || 'Component';
  const Wrapper = (props: P) => (
    <ErrorBoundary {...boundaryProps} name={boundaryProps?.name ?? displayName}>
      <Wrapped {...props} />
    </ErrorBoundary>
  );
  Wrapper.displayName = `withErrorBoundary(${displayName})`;
  return Wrapper;
}
