"use client";

import { startTransition, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { retryDetail } from "@/lib/retry-detail";

export default function DetailError({ reset }: { reset: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const retrying = useRef(false);
  const [pending, setPending] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const isBlog = pathname.startsWith("/blog/");

  async function retry() {
    if (retrying.current) return;
    retrying.current = true;
    setPending(true);
    setRetryFailed(false);
    try {
      await retryDetail(pathname);
      startTransition(() => {
        router.refresh();
        reset();
      });
    } catch {
      retrying.current = false;
      setPending(false);
      setRetryFailed(true);
    }
  }

  return (
    <section className="site-container py-24 sm:py-32" aria-labelledby="detail-error-heading" aria-busy={pending}>
      <p className="section-label">잠시만 기다려 주세요</p>
      <h1 id="detail-error-heading" className="page-heading mt-6">내용을 불러올 수 없습니다.</h1>
      <p className="page-intro">연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <button type="button" className="action-primary" onClick={retry} disabled={pending}>
          {pending ? "다시 불러오는 중…" : "다시 시도"}
        </button>
        <Link href={isBlog ? "/blog" : "/projects"} prefetch={false} className="text-link">
          {isBlog ? "블로그 목록으로" : "프로젝트 목록으로"}
        </Link>
      </div>
      {retryFailed && <p role="alert" className="muted-text mt-5">다시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
    </section>
  );
}
