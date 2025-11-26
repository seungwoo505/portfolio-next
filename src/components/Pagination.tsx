"use client";
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
/**
 * @interface PaginationProps
 * @description 페이지네이션 컨트롤을 구성하는 속성입니다.
 * @property {number} currentPage 현재 활성 페이지 번호.
 * @property {number} totalPages 전체 페이지 수.
 * @property {(page: number) => void} onPageChange 다른 페이지를 선택할 때 호출되는 콜백.
 * @property {string} [className] 페이지네이션 컨테이너에 적용할 선택적 클래스.
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}
/**
 * @component Pagination
 * @description 말줄임 처리와 이동 버튼을 포함한 반응형 페이지네이션 UI를 렌더링합니다.
 * @param {PaginationProps} props 페이지 수와 변경 핸들러를 포함한 설정.
 * @returns {JSX.Element | null} 페이지가 하나뿐이면 null, 그 외에는 페이지네이션 UI를 반환합니다.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ""
}) => {
  /**
   * @function getPageNumbers
   * @description 현재 페이지 기준으로 표시할 페이지 번호 범위를 계산합니다.
   * @returns {number[]} 렌더링할 페이지 번호 배열.
   */
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === 1
            ? 'text-slate-400 cursor-not-allowed'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        이전
      </button>
      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
          )}
        </>
      )}
      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {page}
        </button>
      ))}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 py-2 text-slate-500 dark:text-slate-400">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === totalPages
            ? 'text-slate-400 cursor-not-allowed'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        다음
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
};
export default Pagination;
