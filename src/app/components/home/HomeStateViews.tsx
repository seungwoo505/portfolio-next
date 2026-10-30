"use client";
import Link from "next/link";
import { Container } from "@/components/site/Container";

export function CardSkeletonContent() {
  return <div className="space-y-4 p-6" aria-hidden="true"><div className="skeleton h-4 w-24" /><div className="skeleton h-6 w-3/4" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-5/6" /></div>;
}
export function SkeletonCard() { return <div className="surface-card overflow-hidden"><div className="skeleton aspect-[16/7] rounded-none" /><CardSkeletonContent /></div>; }
export function SkillSkeletonContent() { return <div className="skeleton h-4 w-20" aria-hidden="true" />; }
export function SkeletonSkill() { return <div className="surface-card p-5"><SkillSkeletonContent /></div>; }
export function EmptyState({ eyebrow, title, description, href, action }: { eyebrow: string; title: string; description: string; href?: string; action?: string }) {
  return <div className="empty-panel"><p className="section-label">{eyebrow}</p><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="muted-text mt-3 max-w-lg text-sm leading-7">{description}</p>{href && action && <Link href={href} prefetch={false} className="text-link mt-5">{action} →</Link>}</div>;
}
export function HomeErrorState() {
  return <Container className="py-24 sm:py-32"><p className="section-label">잠시만 기다려 주세요</p><h1 className="page-heading mt-6">데이터를 불러올 수 없습니다.</h1><p className="page-intro">연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</p><button type="button" onClick={() => window.location.reload()} className="action-primary mt-8">다시 시도</button></Container>;
}
export function HomeLoadingState() {
  return <Container className="py-20" role="status" aria-busy="true" aria-label="페이지 불러오는 중"><span className="sr-only">페이지를 불러오고 있습니다.</span><div className="max-w-2xl space-y-6"><div className="skeleton h-4 w-28" /><div className="skeleton h-14 w-full" /><div className="skeleton h-14 w-2/3" /><div className="skeleton h-5 w-5/6" /><div className="skeleton h-5 w-3/4" /></div><div className="mt-20 grid gap-8 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div></Container>;
}
