"use client";
import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
/**
 * @component ScrollProgress
 * @description 페이지 스크롤 위치를 반영하는 상단 고정 진행 바를 클라이언트에서 렌더링합니다.
 * @returns {JSX.Element | null} 하이드레이션 완료 전에는 null, 이후에는 진행 바 요소를 반환합니다.
 */
export default function ScrollProgress() {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const progressBar = useMemo(() => {
    if (!isMounted) return null;
    return (
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50"
        style={{ scaleX }}
        data-scroll-behavior="ignore"
        data-nextjs-scroll-focus-boundary
      />
    );
  }, [isMounted, scaleX]);
  return progressBar;
}
