"use client";
import { useEffect, useRef, useState } from 'react';
import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);
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
    <Dialog
      open={isOpen}
      onClose={() => { if (!isConfirming) onClose(); }}
      initialFocus={cancelButtonRef}
      className="admin-shell fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <DialogBackdrop
        className="absolute inset-0 bg-black/75"
      />
      <DialogPanel
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle as="h3" id="confirm-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            aria-label="닫기"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <Description as="p" className="text-slate-600 dark:text-slate-300">
            {message}
          </Description>
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
      </DialogPanel>
    </Dialog>
  );
}
