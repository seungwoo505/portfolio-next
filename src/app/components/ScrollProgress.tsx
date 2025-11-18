"use client";

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

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

  // 메모이제이션으로 불필요한 리렌더링 방지
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
