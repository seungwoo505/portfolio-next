'use client';

import React from 'react';
import { toast } from 'react-hot-toast';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // 에러 로깅 (실제 환경에서는 에러 리포팅 서비스 사용)
    // console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 사용자에게 에러 알림
    toast.error('예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.');
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={this.resetError}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
