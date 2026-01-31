'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Warning, ArrowCounterClockwise, Bug } from 'phosphor-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs errors, and displays a fallback UI.
 * 
 * Features:
 * - Automatic error reporting
 * - Retry functionality
 * - Error details display (dev mode)
 * - Recovery suggestions
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleRetry = () => {
    // Reset error state and retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Full page reload as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
          <GlassCard variant="dark-medium" blur="lg" className="max-w-2xl w-full p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Warning size={32} className="text-red-400" weight="duotone" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-400">
                  We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
                </p>
              </div>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Bug size={20} className="text-amber-400" weight="duotone" />
                  <h3 className="text-sm font-semibold text-white">Error Details</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Message:</p>
                    <p className="text-sm text-red-400 font-mono">{this.state.error.message}</p>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto p-2 bg-gray-900/50 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Component Stack:</p>
                      <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto p-2 bg-gray-900/50 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Suggestions */}
            <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <h3 className="text-sm font-semibold text-blue-400 mb-3">Recovery Suggestions</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Check your internet connection and ensure the blockchain node is accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Try refreshing the page or navigating back to the dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>If the problem persists, try clearing your browser cache</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Contact support if you continue to experience issues</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                onClick={this.handleRetry}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold"
              >
                <ArrowCounterClockwise size={20} className="mr-2" weight="bold" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1 px-6 py-3 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-semibold"
              >
                Reload Page
              </Button>
            </div>

            {/* Help Link */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Return to Dashboard
              </a>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
