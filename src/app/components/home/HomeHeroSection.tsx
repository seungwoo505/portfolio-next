import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Code2,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import type { GalaxyConfig, MousePosition } from "./homeTypes";

interface HomeHeroSectionProps {
  displayName: string;
  displayDescription: string;
  titleWords: string[];
  mousePosition: MousePosition;
  galaxyProps: GalaxyConfig;
}

const STORE_METRICS = [
  { label: "Curated", value: "Projects", text: "완성도 중심의 대표 작업" },
  { label: "Stack", value: "Next.js", text: "운영 가능한 웹 제품 경험" },
  { label: "Support", value: "Docs", text: "개발 기록과 의사결정 정리" },
];

const SHELF_ITEMS = [
  {
    title: "Frontend Experience",
    description: "사용자가 바로 이해하고 반복해서 쓰기 쉬운 화면",
    badge: "Best",
    Icon: Sparkles,
    accent: "bg-emerald-500",
  },
  {
    title: "Admin Workflow",
    description: "콘텐츠와 데이터를 빠르게 관리하는 운영 도구",
    badge: "Ready",
    Icon: PackageCheck,
    accent: "bg-blue-500",
  },
  {
    title: "Performance Notes",
    description: "측정값과 근거가 남는 개선 기록",
    badge: "New",
    Icon: Code2,
    accent: "bg-rose-500",
  },
];

export default function HomeHeroSection({
  displayName,
  displayDescription,
  titleWords,
  mousePosition: _mousePosition,
  galaxyProps: _galaxyProps,
}: HomeHeroSectionProps) {
  const categories = titleWords.length > 0 ? titleWords : ["웹", "프론트엔드", "개발자"];

  return (
    <section className="relative overflow-hidden bg-[#f8faf7] text-slate-950 dark:bg-neutral-950 dark:text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:56px_56px] dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-white/80 dark:bg-neutral-950/80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-normal text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
            <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            Portfolio Market
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
            {displayName}
            <span className="block text-emerald-600 dark:text-emerald-300">
              프로젝트를 고르는 매장처럼
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            {displayDescription}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              >
                {category}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
            >
              <ShoppingBag className="h-4 w-4" />
              프로젝트 둘러보기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-700 active:translate-y-0 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:border-blue-300 dark:hover:text-blue-200"
            >
              <Search className="h-4 w-4" />
              개발 기록 검색
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {STORE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10"
            >
              <p className="text-xs font-bold uppercase tracking-normal text-rose-600 dark:text-rose-300">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {metric.value}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {metric.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-blue-700 dark:text-blue-300">
                Curated Shelf
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                오늘의 대표 진열
              </h2>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-bold text-slate-700 transition hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
            >
              협업 문의
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SHELF_ITEMS.map(({ title, description, badge, Icon, accent }) => (
              <article
                key={title}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/10"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/20 dark:text-amber-200">
                    <Star className="h-3.5 w-3.5" />
                    {badge}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="mx-auto mt-10 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-300 dark:hover:text-emerald-300"
          onClick={() => {
            document.querySelector("#latest-content")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          aria-label="다음 섹션으로 이동"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
