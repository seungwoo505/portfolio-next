"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import "@/components/site/brand-motion.css";

interface HomeHeroSectionProps {
  displayName: string;
  displayDescription: string;
  titleWords: string[];
}

export default function HomeHeroSection({ displayName, displayDescription, titleWords }: HomeHeroSectionProps) {
  const connection = useRef<SVGPathElement>(null);
  useEffect(() => {
    const line = connection.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => preference.matches || document.documentElement.classList.contains('reduced-motion');
    if (!line?.animate || reduce() || document.hidden || !window.matchMedia('(min-width: 1024px)').matches) return;
    const animation = line.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 650, easing: 'ease-out', iterations: 1 });
    const stopIfNeeded = () => { if (reduce() || document.hidden) animation.cancel(); };
    preference.addEventListener('change', stopIfNeeded);
    document.addEventListener('visibilitychange', stopIfNeeded);
    const classes = typeof MutationObserver !== 'undefined' ? new MutationObserver(stopIfNeeded) : null;
    classes?.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      animation.cancel();
      preference.removeEventListener('change', stopIfNeeded);
      document.removeEventListener('visibilitychange', stopIfNeeded);
      classes?.disconnect();
    };
  }, []);
  return (
    <Container className="pb-16 pt-16 sm:pb-24 sm:pt-24 lg:pt-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
        <div>
          <p className="section-label">{titleWords.join(' · ')}</p>
          <h1 className="mt-7 max-w-3xl text-[clamp(2.75rem,5.4vw,4.5rem)] font-bold leading-[1.2] tracking-[-0.055em]">생각을 구조로,<br />경험을 코드로<span className="text-teal-600 dark:text-teal-400">.</span></h1>
          <p className="mt-7 text-lg font-semibold tracking-tight">안녕하세요, {displayName}입니다.</p>
          <p className="muted-text mt-4 max-w-xl text-base leading-8">{displayDescription}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/projects" prefetch={false} className="action-primary">프로젝트 보기<ArrowUpRight size={16} aria-hidden="true" /></Link>
            <Link href="/about" prefetch={false} className="action-secondary">소개 보기</Link>
          </div>
          <a href="#selected-work" className="muted-text mt-10 inline-flex min-h-11 items-center gap-2 text-xs"><ArrowDown size={14} aria-hidden="true" />작업과 기록을 살펴보세요</a>
        </div>
        <div aria-hidden="true" className="relative hidden min-h-[460px] overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 p-7 lg:block dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative flex items-center justify-between border-b border-zinc-200 pb-5 font-mono text-[10px] tracking-[0.15em] text-zinc-400 dark:border-zinc-800"><span>IDEA → EXPERIENCE</span><span>WORKING PROCESS</span></div>
          <div className="relative mt-12 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-4 dark:border-zinc-800"><span className="size-1.5 rounded-full bg-teal-600" /><span className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" /><span className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" /><span className="ml-auto font-mono text-[9px] text-zinc-400">CRAFTED WITH CARE</span></div>
            <div className="mt-5 flex gap-4"><div className="w-10 space-y-2 border-r border-zinc-100 pr-3 dark:border-zinc-800"><div className="h-2 rounded bg-teal-100 dark:bg-teal-900" /><div className="h-2 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-2 rounded bg-zinc-100 dark:bg-zinc-800" /></div><div className="flex-1"><div className="h-2.5 w-20 rounded bg-zinc-800 dark:bg-zinc-200" /><div className="mt-3 h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800" /><div className="mt-2 h-1.5 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="mt-5 grid grid-cols-3 gap-2"><div className="h-14 rounded-lg border border-teal-100 bg-teal-50 dark:border-teal-900 dark:bg-teal-950" /><div className="h-14 rounded-lg border border-zinc-100 dark:border-zinc-800" /><div className="h-14 rounded-lg border border-zinc-100 dark:border-zinc-800" /></div></div></div>
          </div>
          <div className="hero-process relative mt-8 space-y-3"><svg className="hero-process-connection" viewBox="0 0 8 64" fill="none" aria-hidden="true"><path ref={connection} data-hero-line d="M4 5 V25 M4 37 V57" pathLength="1" /></svg><div className="flex items-center gap-3 text-xs text-zinc-500"><span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">01</span><span>문제를 이해하고</span></div><div className="flex items-center gap-3 text-xs text-zinc-500"><span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">02</span><span>더 나은 방법을 고민하고</span></div><div className="flex items-center gap-3 text-xs text-zinc-500"><span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">03</span><span>작은 디테일까지 다듬습니다</span></div></div>
        </div>
      </div>
    </Container>
  );
}
