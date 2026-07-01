import Link from "next/link";
import type { BlogPost } from "@/types";
import {
  CardSkeletonContent,
  EmptyState,
  SkeletonCard,
} from "./HomeStateViews";
import type { HomeProject } from "./homeTypes";
import {
  ArrowRight,
  BookOpenText,
  Eye,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Star,
} from "lucide-react";

interface HomeLatestContentProps {
  loading: boolean;
  blogPosts: BlogPost[];
  featuredProjectItems: HomeProject[];
  blogRevealCount: number;
  projectRevealCount: number;
  blogSkeletonCount: number;
  projectSkeletonCount: number;
}

const getPostSummary = (post: BlogPost) =>
  post.excerpt || `${post.content.substring(0, 100)}...`;

const getProjectSummary = (project: HomeProject) =>
  project.catalog_summary ||
  project.excerpt ||
  project.detailed_description ||
  project.description ||
  "프로젝트 설명이 없습니다.";

export default function HomeLatestContent({
  loading,
  blogPosts,
  featuredProjectItems,
  blogRevealCount,
  projectRevealCount,
  blogSkeletonCount,
  projectSkeletonCount,
}: HomeLatestContentProps) {
  return (
    <section
      id="latest-content"
      className="border-y border-slate-200 bg-white px-4 py-16 dark:border-white/10 dark:bg-neutral-950 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl overflow-x-hidden">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-normal text-rose-600 dark:text-rose-300">
              New Arrivals
            </p>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">
              새로 진열된 기록과 프로젝트
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              prefetch={false}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-white/15 dark:text-slate-200 dark:hover:border-rose-300 dark:hover:text-rose-200"
            >
              <BookOpenText className="h-4 w-4" />
              블로그
            </Link>
            <Link
              href="/projects"
              prefetch={false}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
            >
              <ShoppingBag className="h-4 w-4" />
              프로젝트
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-normal text-blue-700 dark:text-blue-300">
                  Editorial Shelf
                </p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  개발 기록 신상품
                </h3>
              </div>
              <Link
                href="/blog"
                prefetch={false}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
              >
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: blogSkeletonCount }).map((_, index) => (
                  <SkeletonCard key={`blog-loading-skeleton-${index}`} />
                ))
              ) : blogPosts && blogPosts.length > 0 ? (
                blogPosts.map((post, index) => {
                  const isRevealed = index < blogRevealCount;
                  const cardBaseClass =
                    "group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-white/10";
                  const stateClass = isRevealed
                    ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    : "cursor-default pointer-events-none";

                  return (
                    <article
                      key={post.id}
                      className={`${cardBaseClass} ${stateClass}`}
                      onClick={
                        isRevealed
                          ? () =>
                              (window.location.href = `/blog/${encodeURIComponent(
                                post.slug
                              )}`)
                          : undefined
                      }
                    >
                      {isRevealed ? (
                        <div className="p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-300/15 dark:text-rose-200">
                              <ReceiptText className="h-3.5 w-3.5" />
                              Blog Item
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <Eye className="h-3.5 w-3.5" />
                              {post.view_count || 0}
                            </span>
                          </div>

                          <time className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {new Date(post.created_at).toLocaleDateString("ko-KR")}
                          </time>

                          <h4 className="mt-2 line-clamp-2 text-lg font-black text-slate-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-200">
                            <Link
                              href={`/blog/${encodeURIComponent(post.slug)}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {post.title}
                            </Link>
                          </h4>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {getPostSummary(post)}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.tags && post.tags.length > 0
                              ? post.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-300/15 dark:text-blue-200"
                                  >
                                    {tag.name}
                                  </span>
                                ))
                              : null}
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
                            <Link
                              href={`/blog/${encodeURIComponent(post.slug)}`}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-bold text-slate-900 transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                              onClick={(event) => event.stopPropagation()}
                            >
                              자세히 보기
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                            <span className="text-xs font-semibold text-slate-400">
                              Ready
                            </span>
                          </div>
                        </div>
                      ) : (
                        <CardSkeletonContent />
                      )}
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  eyebrow="Content Standby"
                  title="대표 글을 연결하는 중입니다"
                  description="라이브 API가 준비되면 최신 개발 기록이 이 영역에 표시됩니다. 지금은 포트폴리오의 방향과 탐색 흐름을 먼저 확인할 수 있습니다."
                  href="/blog"
                  action="블로그 화면 보기"
                />
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-normal text-emerald-700 dark:text-emerald-300">
                  Featured Shelf
                </p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  추천 프로젝트
                </h3>
              </div>
              <Link
                href="/projects"
                prefetch={false}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-bold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array.from({ length: projectSkeletonCount }).map((_, index) => (
                  <SkeletonCard key={`project-loading-skeleton-${index}`} />
                ))
              ) : featuredProjectItems.length > 0 ? (
                featuredProjectItems.map((project, index) => {
                  const isRevealed = index < projectRevealCount;
                  const cardBaseClass =
                    "group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-white/10";
                  const stateClass = isRevealed
                    ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    : "cursor-default pointer-events-none";
                  const techList =
                    project.skills && Array.isArray(project.skills) && project.skills.length > 0
                      ? project.skills
                      : project.tags && Array.isArray(project.tags)
                        ? project.tags
                        : [];
                  const catalogLabel =
                    project.catalog_label || (project.featured ? "추천 프로젝트" : "프로젝트");
                  const catalogStatus =
                    project.catalog_status || (project.featured ? "Featured" : "Project");

                  return (
                    <article
                      key={project.id}
                      className={`${cardBaseClass} ${stateClass}`}
                      onClick={
                        isRevealed
                          ? () =>
                              (window.location.href = `/projects/${encodeURIComponent(
                                project.slug
                              )}`)
                          : undefined
                      }
                    >
                      {isRevealed ? (
                        <div className="p-5">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200">
                              <PackageCheck className="h-3.5 w-3.5" />
                              {catalogLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              <Star className="h-3.5 w-3.5" />
                              {catalogStatus}
                            </span>
                          </div>

                          <time className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {project.created_at
                              ? new Date(project.created_at).toLocaleDateString(
                                  "ko-KR"
                                )
                              : "날짜 없음"}
                          </time>

                          <h4 className="mt-2 line-clamp-2 text-lg font-black text-slate-950 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-200">
                            {project.title}
                          </h4>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {getProjectSummary(project)}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {techList.slice(0, 3).map((tech, techIndex) => (
                              <span
                                key={`${project.id}-tech-${techIndex}`}
                                className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/15 dark:text-amber-200"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
                            <Link
                              href={`/projects/${encodeURIComponent(project.slug)}`}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-bold text-slate-900 transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
                              onClick={(event) => event.stopPropagation()}
                            >
                              상세 보기
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                              <Eye className="h-3.5 w-3.5" />
                              {project.view_count || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <CardSkeletonContent />
                      )}
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  eyebrow="Project Standby"
                  title="대표 프로젝트를 연결하는 중입니다"
                  description="프로젝트 데이터가 연결되면 이미지, 기술 스택, 결과 중심의 카드로 보여줍니다. 빈 상태에서도 화면 흐름이 무너지지 않도록 정리했습니다."
                  href="/projects"
                  action="프로젝트 화면 보기"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
