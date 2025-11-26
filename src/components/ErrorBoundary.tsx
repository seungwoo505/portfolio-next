'use client';
import React from 'react';
import { toast } from 'react-hot-toast';
/**
 * @interface ErrorBoundaryState
 * @description 하위 컴포넌트에서 발생한 오류 여부와 오류 객체를 기록합니다.
 * @property {boolean} hasError 오류가 감지되었는지 여부.
 * @property {Error} [error] 렌더링 중 포착된 오류 객체.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
/**
 * @interface ErrorBoundaryProps
 * @description 에러 바운더리가 받는 속성입니다.
 * @property {React.ReactNode} children 오류가 없을 때 렌더링할 자식 컴포넌트.
 * @property {React.ComponentType<{ error?: Error; resetError: () => void }>} [fallback] 오류 발생 시 렌더링할 커스텀 폴백 컴포넌트.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}
/**
 * @class ErrorBoundary
 * @classdesc 하위 컴포넌트에서 발생한 오류를 감지해 토스트 알림과 폴백 UI를 제공하는 React 에러 바운더리입니다.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * @constructor
   * @param {ErrorBoundaryProps} props 컴포넌트 속성.
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  /**
   * @static
   * @function getDerivedStateFromError
   * @description 오류를 감지했음을 상태에 반영합니다.
   * @param {Error} error 하위 컴포넌트에서 던져진 오류.
   * @returns {ErrorBoundaryState} 오류 정보를 포함한 새로운 상태.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  /**
   * @function componentDidCatch
   * @description 포착된 오류 정보를 로깅하거나 사용자에게 알립니다.
   * @param {Error} _error 포착된 오류 객체.
   * @param {React.ErrorInfo} _errorInfo React가 제공하는 추가 오류 정보.
   * @returns {void}
   */
  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    toast.error('예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.');
  }
  /**
   * @function resetError
   * @description 기록된 오류를 초기화해 자식 컴포넌트를 다시 렌더링합니다.
   * @returns {void}
   */
  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };
  /**
   * @function render
   * @description 폴백 UI 또는 원래의 자식 컴포넌트를 렌더링합니다.
   * @returns {React.ReactNode} 폴백 컴포넌트 혹은 자식 요소를 반환합니다.
   */
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
