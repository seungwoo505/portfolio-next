import Link from "next/link";
import type { BlogPost } from "@/types";
import {
  CardSkeletonContent,
  EmptyState,
  SkeletonCard,
} from "./HomeStateViews";
import type { HomeProject } from "./homeTypes";

interface HomeLatestContentProps {
  loading: boolean;
  blogPosts: BlogPost[];
  featuredProjectItems: HomeProject[];
  blogRevealCount: number;
  projectRevealCount: number;
  blogSkeletonCount: number;
  projectSkeletonCount: number;
}

type LabelLike =
  | string
  | { id?: string | number; name?: string; slug?: string };

const getLabelText = (item: LabelLike): string => {
  if (typeof item === "string") {
    return item;
  }

  return item.name || item.slug || String(item.id ?? "");
};

const getLabelKey = (
  item: LabelLike,
  fallbackPrefix: string,
  index: number
): string => {
  const identity =
    typeof item === "string"
      ? item
      : item.id ?? item.slug ?? item.name ?? "unknown";

  return `${fallbackPrefix}-${identity}-${index}`;
};

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
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 overflow-x-hidden"
    >
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
                Signal Notes
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                대표 블로그 포스트
              </h2>
            </div>
            <Link
              href="/blog"
              prefetch={false}
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              모든 포스트 보기 →
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
                  "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 group overflow-hidden";
                const stateClass = isRevealed
                  ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
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
                      <div className="p-6">
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <time>
                            {new Date(post.created_at).toLocaleDateString("ko-KR")}
                          </time>
                          <span className="text-sm text-slate-400">블로그</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Link
                            href={`/blog/${encodeURIComponent(post.slug)}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                          {post.excerpt || `${post.content.substring(0, 100)}...`}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags && post.tags.length > 0
                            ? (post.tags as LabelLike[])
                                .slice(0, 2)
                                .map((tag, tagIndex) => (
                                  <span
                                    key={getLabelKey(
                                      tag,
                                      `${post.id}-tag`,
                                      tagIndex
                                    )}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                  >
                                    {getLabelText(tag)}
                                  </span>
                                ))
                            : null}
                        </div>
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/blog/${encodeURIComponent(post.slug)}`}
                            className="inline-flex items-center text-blue-600 hover:underline font-medium text-sm"
                            onClick={(event) => event.stopPropagation()}
                          >
                            자세히 보기 →
                          </Link>
                          <span className="text-xs text-slate-400">
                            조회 {post.view_count || 0}
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
                Mission Archive
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                대표 프로젝트
              </h2>
            </div>
            <Link
              href="/projects"
              prefetch={false}
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              모든 프로젝트 보기 →
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
                  "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden";
                const stateClass = isRevealed
                  ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
                  : "cursor-default pointer-events-none";

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
                      <div className="p-6">
                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <time>
                            {project.created_at
                              ? new Date(project.created_at).toLocaleDateString(
                                  "ko-KR"
                                )
                              : "날짜 없음"}
                          </time>
                          <span className="text-sm text-slate-400">프로젝트</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                          {project.excerpt ||
                            project.detailed_description ||
                            project.description ||
                            "프로젝트 설명이 없습니다."}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.skills &&
                          Array.isArray(project.skills) &&
                          project.skills.length > 0
                            ? (project.skills as LabelLike[])
                                .slice(0, 3)
                                .map((skill, skillIndex) => (
                                  <span
                                    key={getLabelKey(
                                      skill,
                                      `${project.id}-skill`,
                                      skillIndex
                                    )}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                                  >
                                    {getLabelText(skill)}
                                  </span>
                                ))
                            : project.tags &&
                                Array.isArray(project.tags) &&
                                project.tags.length > 0
                              ? (project.tags as LabelLike[])
                                  .slice(0, 3)
                                  .map((tag, tagIndex) => (
                                    <span
                                      key={getLabelKey(
                                        tag,
                                        `${project.id}-tag`,
                                        tagIndex
                                      )}
                                      className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full"
                                    >
                                      {getLabelText(tag)}
                                    </span>
                                  ))
                              : null}
                        </div>
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/projects/${encodeURIComponent(project.slug)}`}
                            className="inline-flex items-center text-blue-600 hover:underline font-medium text-sm"
                            onClick={(event) => event.stopPropagation()}
                          >
                            자세히 보기 →
                          </Link>
                          <span className="text-xs text-slate-400">
                            조회 {project.view_count || 0}
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
    </section>
  );
}
