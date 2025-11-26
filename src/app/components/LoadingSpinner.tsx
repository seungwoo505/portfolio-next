"use client";
import { motion } from 'framer-motion';
/**
 * @interface LoadingSpinnerProps
 * @description 애니메이션 로딩 스피너를 구성하는 속성입니다.
 * @property {'sm' | 'md' | 'lg'} [size] 스피너 크기 옵션.
 * @property {string} [text] 스피너 아래에 표시할 안내 문구.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}
/**
 * @component LoadingSpinner
 * @description 반복되는 애니메이션 스피너와 선택적 설명 문구를 표시합니다.
 * @param {LoadingSpinnerProps} param0 스피너 크기 및 텍스트 설정.
 * @returns {JSX.Element} 전달된 설정에 맞는 스피너 요소를 반환합니다.
 */
export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <motion.p
          className="text-slate-600 dark:text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
