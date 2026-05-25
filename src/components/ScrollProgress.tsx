"use client";
import { useEffect, useRef } from 'react';
/**
 * @component ScrollProgress
 * @description 사용자의 세로 스크롤 진행률을 보여주는 고정형 진행 바를 렌더링합니다.
 * @returns {JSX.Element} 스크롤 진행률을 CSS transform으로 표시하는 진행 바 요소를 반환합니다.
 */
export default function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      const clampedProgress = Math.min(Math.max(progress, 0), 1);

      progressRef.current?.style.setProperty('transform', `scaleX(${clampedProgress})`);
    };

    const scheduleUpdate = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return (
    <div
      ref={progressRef}
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50 scale-x-0"
      data-scroll-behavior="ignore"
      data-nextjs-scroll-focus-boundary
    />
  );
}
