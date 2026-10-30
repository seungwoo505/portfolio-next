'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { startListMotion } from '@/lib/list-motion';

export function AnimatedList({ items, className, children }: {
  items: readonly string[];
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<ReturnType<typeof startListMotion> | null>(null);
  useLayoutEffect(() => {
    if (!root.current) return;
    motion.current = startListMotion(root.current);
    return () => { motion.current?.stop(); motion.current = null; };
  }, []);
  useLayoutEffect(() => { motion.current?.update(); }, [items]);
  return <div ref={root} className={className} data-animated-list>{children}</div>;
}
