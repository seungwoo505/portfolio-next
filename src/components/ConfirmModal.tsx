"use client";
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
/**
 * @interface ConfirmModalProps
 * @description 확인 모달의 노출 여부와 메시지, 콜백을 설정하는 속성입니다.
 * @property {boolean} isOpen 모달이 현재 열려 있는지 여부.
 * @property {() => void} onClose 모달을 닫을 때 호출되는 핸들러.
 * @property {() => void | Promise<void>} onConfirm 확인 작업이 승인되었을 때 호출되는 핸들러.
 * @property {string} title 모달 상단에 표시할 제목.
 * @property {string} message 확인이 필요한 내용을 설명하는 메시지.
 * @property {string} [confirmText] 확인 버튼에 사용할 문구.
 * @property {string} [cancelText] 취소 버튼에 사용할 문구.
 * @property {boolean} [isDestructive] 파괴적 행동임을 나타내는 스타일을 적용할지 여부.
 */
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}
/**
 * @component ConfirmModal
 * @description 중요한 작업에 대한 확인 또는 취소를 요청하는 접근성 친화적인 모달을 제공합니다.
 * @param {ConfirmModalProps} props 콜백과 메시지를 포함한 모달 설정.
 * @returns {JSX.Element | null} 모달 오버레이 또는 닫힌 상태에서는 null을 반환합니다.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = false
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  useEffect(() => {
    /**
     * @function handleEscape
     * @description 사용자가 Esc 키를 누를 때 모달을 닫아 접근성을 보장합니다.
     * @param {KeyboardEvent} e keydown 리스너로부터 전달된 키보드 이벤트.
     * @returns {void}
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConfirming) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isConfirming, onClose]);
  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);
  if (!isOpen) return null;
  /**
   * @function handleConfirm
   * @description 확인 콜백을 실행한 뒤 즉시 모달을 닫습니다.
   * @returns {Promise<void>}
   */
  const handleConfirm = async () => {
    if (isConfirming) {
      return;
    }
    try {
      setIsConfirming(true);
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/75"
        onClick={isConfirming ? undefined : onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            aria-label="닫기"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {isConfirming ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
