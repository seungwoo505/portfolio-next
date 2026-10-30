'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { startProjectImageTransitions } from '@/lib/project-image-transition';

export function ProjectTransitions({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { if (root.current) return startProjectImageTransitions(root.current); }, []);
  return <div ref={root}>{children}</div>;
}
