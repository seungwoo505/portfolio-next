"use client";
import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
/**
 * @component ScrollProgress
 * @description 사용자의 세로 스크롤 진행률을 보여주는 고정형 진행 바를 렌더링합니다.
 * @returns {JSX.Element | null} SSR 중에는 null, 그 외에는 애니메이션 진행 바 요소를 반환합니다.
 */
export default function ScrollProgress() {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
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
