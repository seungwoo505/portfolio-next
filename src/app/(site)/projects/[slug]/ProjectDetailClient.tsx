"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { projectApi } from "@/lib/api";
import { Project } from "@/types";
import toast from 'react-hot-toast';

interface ProjectDetailClientProps {
  slug: string;
  initialProject?: Project | null;
}
/**
 * @component ProjectDetailContent
 * @description 프로젝트 상세 데이터를 로드하고 렌더링하는 클라이언트 컴포넌트.
 * @returns {JSX.Element} 프로젝트 상세 콘텐츠.
 */
function ProjectDetailContent({ slug, initialProject }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project | null>(initialProject ?? null);
  const [loading, setLoading] = useState(!initialProject);
  const [projectContentHtml, setProjectContentHtml] = useState('');

  useEffect(() => {
    if (!slug) {
      toast.error('프로젝트를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const decodedSlug = decodeURIComponent(slug);
    const incrementViewCount = async () => {
      try {
        await projectApi.incrementViewCount(decodedSlug);
        if (!cancelled) {
          setProject(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
        }
      } catch {
      }
    };

    if (initialProject) {
      setProject(initialProject);
      setLoading(false);
      incrementViewCount();
      return () => {
        cancelled = true;
      };
    }

    /**
     * @function fetchProject
     * @description 슬러그에 해당하는 프로젝트 상세 정보를 조회하고 뷰 카운트를 갱신한다.
     * @returns {Promise<void>} 프로젝트 로딩 동작.
     */
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await projectApi.getProject(decodedSlug);
        if (response.success && response.data) {
          if (!cancelled) {
            setProject(response.data);
          }
          await incrementViewCount();
        } else {
          toast.error('프로젝트를 찾을 수 없습니다.');
        }
      } catch {
        toast.error('프로젝트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchProject();
    return () => {
      cancelled = true;
    };
  }, [slug, initialProject]);
  useEffect(() => {
    let cancelled = false;
    if (!project?.content_html && !project?.content) {
      setProjectContentHtml('');
      return;
    }
    import('@/utils/markdown').then(({ markdownToHtml, sanitizeHtml }) => {
      if (!cancelled) {
        setProjectContentHtml(
          project.content_html
            ? sanitizeHtml(project.content_html)
            : markdownToHtml(project.content || '')
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [project?.content, project?.content_html]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">프로젝트를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">프로젝트를 찾을 수 없습니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">요청하신 프로젝트를 찾을 수 없습니다.</p>
            <Link href="/projects" prefetch={false} className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>모든 프로젝트 보기</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  const tagNames = Array.isArray(project.tags)
    ? project.tags.map(tag => (typeof tag === 'string' ? tag : tag.name))
    : [];

  const skillsList = Array.isArray(project.skills)
    ? project.skills.map(skill => skill.name).filter(Boolean)
    : [];

  const technologyList = [
    ...(project.technologies ? project.technologies.split(',').map(item => item.trim()).filter(Boolean) : []),
    ...skillsList,
  ];

  const uniqueTech = Array.from(new Set(technologyList));

  const startDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
      })
    : '시작일 미정';

  const endDate =
    project.end_date && project.status !== 'in_progress'
      ? new Date(project.end_date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
        })
      : null;

  const statusBadge = (() => {
    switch (project.status) {
      case 'completed':
        return {
          label: '완료된 프로젝트',
          className: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
        };
      case 'in_progress':
        return {
          label: '진행 중',
          className: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-200',
        };
      case 'planning':
        return {
          label: '기획 단계',
          className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200',
        };
      case 'on_hold':
        return {
          label: '진행 보류',
          className: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/15 dark:text-slate-200',
        };
      default:
        return {
          label: '프로젝트',
          className: 'bg-slate-200/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
        };
    }
  })();

  const coverImage = project.featured_image || project.image_url;

  return (
    <>
      <div className="project-detail-bg relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-transparent">
            <Link href="/" prefetch={false} className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              홈
            </Link>
            <span>/</span>
            <Link href="/projects" prefetch={false} className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              프로젝트
            </Link>
            <span>/</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
              {project?.title || '상세'}
            </span>
        </nav>

          <header className="relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
            <div className="relative grid gap-12 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] lg:px-14 lg:py-16">
              <div className="space-y-6">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>

                <h1 className="text-3xl font-bold leading-snug text-slate-900 sm:text-4xl md:text-[2.8rem] md:leading-tight dark:text-white">
            {project.title}
          </h1>

                <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                  {project.excerpt || project.meta_description || project.description || project.content_text?.slice(0, 180)}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 dark:bg-slate-800/70">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                    {startDate}
                    {endDate ? ` ~ ${endDate}` : project.status === 'in_progress' ? ' · 진행 중' : ''}
                </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 dark:bg-slate-800/70">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                      조회 {project.view_count || 0}
              </span>
            </div>

                <div className="flex flex-wrap gap-2">
                  {tagNames.length ? (
                    tagNames.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300" />
                        {tag}
                </span>
              ))
            ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-slate-100/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300">
                태그 없음
              </span>
            )}
          </div>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-lg border border-slate-200/70 shadow-sm dark:border-slate-700/60">
                  {coverImage ? (
                    <div className="relative h-full min-h-[260px] w-full">
                      <Image
                        src={coverImage}
                        alt={project.title}
                        fill
                        priority
                        sizes="(min-width: 1280px) 480px, 100vw"
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          console.error('Image load error:', coverImage);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
            </div>
                  ) : (
                    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/70 dark:bg-slate-700/70">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h18" />
                    </svg>
                  </div>
                      <p className="text-sm font-medium">대표 이미지가 등록되지 않았습니다.</p>
                </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-10">
              {project.description && (
                <section className="relative overflow-hidden rounded-lg border border-slate-200/70 bg-white p-10 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
                  <div className="relative z-10 space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
                      프로젝트 소개
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      프로젝트의 핵심
                    </h2>
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                      {project.description}
                    </p>
                  </div>
                </section>
              )}

              {uniqueTech.length > 0 && (
                <section className="rounded-lg border border-slate-200/70 p-8 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">사용 기술</h3>
                    <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      Tech Stack
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    프로젝트를 구현하면서 활용한 주요 기술과 도구들입니다.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {uniqueTech.map(tech => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-600/60 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 dark:bg-blue-300/70" />
                        {tech}
                      </span>
                    ))}
          </div>
                </section>
        )}

        {(project.content_html || project.content) && (
                <article className="relative overflow-hidden rounded-lg border border-slate-200/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-800">
                  <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent dark:via-blue-500/30" />
                  <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
                    <div className="project-block-content prose prose-lg max-w-none prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-code:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-pre:shadow-lg dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-slate-300 dark:prose-a:text-blue-400 dark:prose-strong:text-white dark:prose-code:text-slate-200 dark:prose-code:bg-slate-800 dark:text-slate-200">
              {projectContentHtml ? (
                <div dangerouslySetInnerHTML={{ __html: projectContentHtml }} />
              ) : (
                <p className="text-slate-500 dark:text-slate-400">프로젝트 내용을 렌더링하는 중입니다.</p>
              )}
                    </div>
            </div>
          </article>
        )}

              {(project.demo_url || project.project_url || project.github_url) && (
                <section className="grid gap-6 sm:grid-cols-2">
                  {(project.demo_url || project.project_url) && (
                <a
                      href={project.demo_url || project.project_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                      className="relative overflow-hidden rounded-lg border border-blue-200/70 bg-blue-600/90 p-8 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-white/10" />
                      <div className="relative z-10 space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-50">
                          Live
                        </span>
                        <h3 className="text-2xl font-semibold">실제 서비스 화면 보기</h3>
                        <p className="text-blue-100/80">
                          프로젝트의 실제 경험을 직접 확인해 보세요.
                        </p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-50">
                          바로가기
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L10 16" />
                  </svg>
                        </span>
                      </div>
                </a>
              )}

              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                      className="relative overflow-hidden rounded-lg border border-slate-200/70 bg-slate-900/90 p-8 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/40 via-transparent to-slate-900/40" />
                      <div className="relative z-10 space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100">
                          Code
                        </span>
                        <h3 className="text-2xl font-semibold">GitHub 저장소 살펴보기</h3>
                        <p className="text-slate-200/85">
                          아키텍처와 구현 과정을 확인하며 영감을 얻어 보세요.
                        </p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-50">
                          코드 열기
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </span>
                      </div>
                    </a>
                  )}
                </section>
              )}
          </div>

          <section className="relative overflow-hidden rounded-lg border border-slate-200/70 p-8 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-800">
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
                  다음 단계
                </p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  다른 콘텐츠도 함께 확인해 보세요.
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  다양한 블로그 포스트와 프로젝트 케이스를 정리해 두었습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  다른 프로젝트 보기
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L10 16" />
                  </svg>
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 dark:border-blue-400/30 dark:bg-slate-800/90 dark:text-blue-300 dark:hover:bg-slate-700/90"
                >
                  블로그 포스트 보기
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L10 16" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
      </main>
      </div>
    </>
  );
}
/**
 * @component ProjectDetailClient
 * @description 프로젝트 상세 콘텐츠를 클라이언트에서 렌더링한다.
 * @returns {JSX.Element} 프로젝트 상세 페이지 컨테이너.
 */
export default function ProjectDetailClient({ slug, initialProject }: ProjectDetailClientProps) {
  return <ProjectDetailContent slug={slug} initialProject={initialProject} />;
}
