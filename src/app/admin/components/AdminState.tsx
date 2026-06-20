import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2 } from "lucide-react";

type AdminStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
};

type AdminStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: AdminStateAction;
  compact?: boolean;
  embedded?: boolean;
};

type AdminListSkeletonProps = {
  rows?: number;
  variant?: "card" | "table";
};

function AdminStateActionButton({ action }: { action: AdminStateAction }) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
      <span>{action.label}</span>
    </>
  );
  const className =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200";

  if (action.href) {
    return (
      <Link href={action.href} className={className} prefetch={false}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  compact = false,
  embedded = false,
}: AdminStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        embedded ? "" : "rounded-lg border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
      } ${
        compact ? "px-4 py-8" : "px-6 py-12"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <AdminStateActionButton action={action} />
        </div>
      )}
    </div>
  );
}

export function AdminPageLoading({ label = "로딩 중..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex min-h-[24rem] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

export function AdminListSkeleton({
  rows = 5,
  variant = "card",
}: AdminListSkeletonProps) {
  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-lg">
        {[...Array(rows)].map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-700"
          >
            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, index) => (
        <div
          key={index}
          className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700"
        >
          <div className="mb-3 h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
