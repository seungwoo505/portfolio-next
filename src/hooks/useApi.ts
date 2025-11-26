import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
export interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}
export function useApi<T = unknown>(options: UseApiOptions = {}) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = '요청이 성공적으로 처리되었습니다.',
    errorMessage = '요청 처리 중 오류가 발생했습니다.'
  } = options;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });
  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      setState({ data: null, loading: false, error: errorMsg });
      if (showErrorToast) {
        toast.error(errorMsg);
      }
      throw error;
    }
  }, [showSuccessToast, showErrorToast, successMessage, errorMessage]);
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  return {
    ...state,
    execute,
    reset
  };
}
export function useApiCall<T = unknown>(apiCall: () => Promise<T>, options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  const call = useCallback(() => {
    return api.execute(apiCall);
  }, [api, apiCall]);
  return {
    ...api,
    call
  };
}
