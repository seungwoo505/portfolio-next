"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProjectCoverImage from "@/components/ProjectCoverImage";
import { projectApi } from "@/lib/api";
import { Project } from "@/types";
import { isProjectFlagEnabled } from "@/utils/project-state";
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
    return <div className="site-container site-section" role="status"><div className="max-w-[720px] space-y-5 motion-safe:animate-pulse"><div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-12 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-5 w-full rounded bg-zinc-100 dark:bg-zinc-800" /><p className="muted-text">프로젝트를 불러오는 중...</p></div></div>;
  }
  if (!project) {
    return <div className="site-container site-section"><div className="surface-card max-w-[720px] p-8 sm:p-12"><p className="section-label">프로젝트</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">프로젝트를 찾을 수 없습니다.</h1><p className="muted-text mt-4">주소를 확인하거나 프로젝트 목록에서 다시 찾아보세요.</p><Link href="/projects" prefetch={false} className="action-secondary mt-8">모든 프로젝트 보기</Link></div></div>;
  }  const tagNames = Array.isArray(project.tags)
    ? project.tags.map(tag => (typeof tag === 'string' ? tag : tag.name))
    : [];

  const skillsList = Array.isArray(project.skills)
    ? project.skills.map(skill => typeof skill === 'string' ? skill : skill.name).filter(Boolean)
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

  const isOngoing = isProjectFlagEnabled(project.is_ongoing);
  const endDate =
    project.end_date && !isOngoing
      ? new Date(project.end_date).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
        })
      : null;

  const statusBadge = (() => {
    if (isOngoing) {
      return {
        label: '진행 중',
        className: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-200',
      };
    }
    switch (project.status) {
      case 'in_progress':
      case 'completed':
        return {
          label: '완료된 프로젝트',
          className: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
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
    <div className="site-container site-section">
      <nav aria-label="현재 위치" className="muted-text mb-10 flex min-w-0 items-center gap-3 text-sm"><Link href="/" prefetch={false} className="shrink-0 hover:text-teal-700 dark:hover:text-teal-400">홈</Link><span aria-hidden="true">/</span><Link href="/projects" prefetch={false} className="shrink-0 hover:text-teal-700 dark:hover:text-teal-400">프로젝트</Link><span aria-hidden="true">/</span><span aria-current="page" className="truncate">{project.title}</span></nav>
      <header className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div className="min-w-0"><p className="section-label">프로젝트 기록</p><h1 className="page-heading mt-4 break-words">{project.title}</h1>{(project.excerpt || project.meta_description || project.description || project.content_text) && <p className="page-intro mt-6">{project.excerpt || project.meta_description || project.description || project.content_text?.slice(0, 180)}</p>}<div className="mt-6 flex flex-wrap gap-2">{tagNames.map(tag => <span key={tag} className="tag">{tag}</span>)}</div></div>
        <dl className="self-start divide-y divide-zinc-200 border-y border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex justify-between gap-5 py-4"><dt className="muted-text">상태</dt><dd className="font-medium text-teal-700 dark:text-teal-400">{statusBadge.label}</dd></div>
          <div className="py-4"><dt className="muted-text mb-2">기간</dt><dd className="leading-6">{startDate}{endDate ? ` ~ ${endDate}` : isOngoing ? ' · 진행 중' : ''}</dd></div>
          <div className="flex justify-between gap-5 py-4"><dt className="muted-text">조회</dt><dd>{project.view_count || 0}</dd></div>
        </dl>
      </header>
      <ProjectCoverImage transitionKey={project.slug} transitionRole="detail" src={coverImage} alt={project.title} priority sizes="(min-width: 1200px) 1120px, 100vw" fallbackLabel="대표 이미지가 등록되지 않았습니다." className="mb-14 aspect-[16/9] w-full rounded-[20px] border border-zinc-200 dark:border-zinc-800" />
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)] lg:gap-16">
        <div className="min-w-0 max-w-[720px] space-y-10">
          {project.description && <section><p className="section-label">프로젝트 소개</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">어떤 프로젝트인가요?</h2><p className="muted-text mt-5 whitespace-pre-line text-base leading-8">{project.description}</p></section>}
          {(project.content_html || project.content) && <article className="border-t border-zinc-200 pt-10 dark:border-zinc-800"><h2 className="sr-only">프로젝트 상세</h2><div className="project-block-content prose-content">{projectContentHtml ? <div dangerouslySetInnerHTML={{ __html: projectContentHtml }} /> : <p className="muted-text" role="status">프로젝트 내용을 렌더링하는 중입니다.</p>}</div></article>}
        </div>
        <aside className="space-y-8 border-t border-zinc-200 pt-8 lg:border-t-0 lg:pt-0 dark:border-zinc-800" aria-label="프로젝트 관련 정보">
          {uniqueTech.length > 0 && <section><h2 className="text-sm font-semibold">사용 기술</h2><div className="mt-4 flex flex-wrap gap-2">{uniqueTech.map(tech => <span key={tech} className="tag">{tech}</span>)}</div></section>}
          {(project.demo_url || project.project_url || project.github_url) && <section><h2 className="text-sm font-semibold">관련 링크</h2><div className="mt-4 flex flex-col items-start gap-3">{(project.demo_url || project.project_url) && <a href={project.demo_url || project.project_url} target="_blank" rel="noopener noreferrer" className="action-secondary">프로젝트 화면 보기 ↗</a>}{project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="action-secondary">GitHub 저장소 ↗</a>}</div></section>}
        </aside>
      </div>
      <footer className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-zinc-200 pt-8 dark:border-zinc-800"><Link href="/projects" prefetch={false} className="action-secondary">← 모든 프로젝트 보기</Link><Link href="/blog" prefetch={false} className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">개발 기록 읽기 →</Link></footer>
    </div>
  );
}

export default function ProjectDetailClient({ slug, initialProject }: ProjectDetailClientProps) {
  return <ProjectDetailContent slug={slug} initialProject={initialProject} />;
}
