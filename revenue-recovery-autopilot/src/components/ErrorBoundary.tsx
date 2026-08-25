import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Application Error Recovered</h2>
                <p className="text-xs text-slate-500">The application encountered an unexpected runtime issue.</p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-xs text-rose-700 break-words">
                {this.state.error.message || 'Unknown error occurred.'}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-md text-xs font-medium bg-black hover:bg-slate-800 text-white flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
