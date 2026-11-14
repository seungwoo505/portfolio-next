'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { startSiteMotion } from '@/lib/site-motion';

export function SiteMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (root.current) return startSiteMotion(root.current);
  }, []);
  return <div ref={root}>{children}</div>;
}
