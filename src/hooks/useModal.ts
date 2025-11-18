// 모달 관리 커스텀 훅

import { useState, useCallback } from 'react';

export interface UseModalOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  closeOnSuccess?: boolean; // 성공 시 모달 닫기 여부
}

export function useModal(options: UseModalOptions = {}) {
  const { onSuccess, onError, closeOnSuccess = true } = options;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsSubmitting(false);
  }, []);

  const handleApiCall = useCallback(async (apiCall: () => Promise<{ success: boolean; message?: string }>) => {
    try {
      setIsSubmitting(true);
      const result = await apiCall();
      
      if (result.success) {
        onSuccess?.();
        
        if (closeOnSuccess) {
          closeModal();
        }
        
        return result;
      } else {
        onError?.(new Error(result.message || 'API 호출에 실패했습니다.'));
        return result;
      }
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess, onError, closeOnSuccess, closeModal]);

  return {
    isOpen,
    isSubmitting,
    openModal,
    closeModal,
    handleApiCall
  };
}
