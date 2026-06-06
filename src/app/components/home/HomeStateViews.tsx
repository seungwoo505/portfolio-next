import Link from "next/link";
import ScrollProgress from "@/components/ScrollProgress";

export function CardSkeletonContent() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
      </div>
      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-4/5" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-12" />
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-16" />
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-14" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <CardSkeletonContent />
    </div>
  );
}

export function SkillSkeletonContent() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16 mx-auto" />
    </div>
  );
}

export function SkeletonSkill() {
  return (
    <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
      <SkillSkeletonContent />
    </div>
  );
}

export function EmptyState({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {href && action ? (
        <Link
          href={href}
          prefetch={false}
          className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-cyan-500 dark:text-blue-300 dark:hover:text-cyan-200"
        >
          {action} →
        </Link>
      ) : null}
    </div>
  );
}

export function HomeErrorState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <ScrollProgress />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            데이터를 불러올 수 없습니다
          </h1>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomeLoadingState() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <ScrollProgress />
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black"></div>
        <div className="relative z-10 text-center">
          <div className="h-16 bg-white/30 rounded w-1/3 mx-auto mb-6 animate-pulse"></div>
          <div className="h-8 bg-white/30 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-white/30 rounded w-1/3 mx-auto animate-pulse"></div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-12 animate-pulse"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
            <SkeletonSkill key={item} />
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
