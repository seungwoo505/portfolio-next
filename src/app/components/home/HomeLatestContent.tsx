import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ProjectCoverImage from "@/components/ProjectCoverImage";
import { Container } from "@/components/site/Container";
import type { BlogPost } from "@/types";
import type { HomeProject } from "./homeTypes";
import { EmptyState, SkeletonCard } from "./HomeStateViews";

function technologyNames(values?: Array<string | { name: string }>): string[] {
  return (values || []).map(value => typeof value === 'string' ? value : value.name).filter(Boolean);
}

export function HomeFeaturedProjects({ loading, projects }: { loading: boolean; projects: HomeProject[] }) {
  return <Container id="selected-work" className="scroll-mt-24 border-t border-zinc-200 py-16 sm:py-20 dark:border-zinc-800">
    <div data-reveal className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div><p className="section-label">대표 프로젝트</p><h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight sm:text-4xl">직접 만들고, 고민한 것들</h2></div>
      <Link href="/projects" prefetch={false} className="text-link">전체 프로젝트<ArrowUpRight size={16} aria-hidden="true" /></Link>
    </div>
    {loading ? <div className="grid gap-8 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div> : projects.length ? <div className="grid gap-8 md:grid-cols-2">
      {projects.map((project, index) => <article data-reveal data-project-card={project.slug} key={project.id} className="project-card group min-w-0">
        <Link data-project-link={project.slug} href={`/projects/${encodeURIComponent(project.slug)}`} prefetch={false} aria-label={`${project.title} 상세 보기`} className="block overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <ProjectCoverImage transitionKey={project.slug} src={project.image_url} alt={project.title} className="project-cover aspect-[16/10] rounded-[15px]" imageClassName="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        </Link>
        <div className="mt-6 flex items-start justify-between gap-4"><div className="min-w-0"><p className="mb-2 font-mono text-[10px] tracking-wider text-zinc-400">{String(index + 1).padStart(2, '0')} / PROJECT</p><h3 className="text-xl font-bold tracking-tight"><Link data-project-link={project.slug} href={`/projects/${encodeURIComponent(project.slug)}`} prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">{project.title}</Link></h3></div><ArrowUpRight className="project-arrow mt-6 size-5 flex-none text-zinc-400 group-hover:text-teal-600" aria-hidden="true" /></div>
        <p className="muted-text mt-3 line-clamp-2 text-sm leading-7">{project.excerpt || project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{technologyNames(project.skills?.length ? project.skills : project.tags).slice(0, 4).map(tech => <span key={tech} className="tag">{tech}</span>)}</div>
        <p className="muted-text mt-4 text-xs">조회 {project.view_count ?? 0}</p>
      </article>)}
    </div> : <EmptyState eyebrow="프로젝트" title="프로젝트를 준비하고 있습니다" description="진행한 작업과 해결 과정을 이곳에 차근차근 기록합니다." href="/projects" action="프로젝트 목록" />}
  </Container>;
}

export function HomeLatestArticles({ loading, posts }: { loading: boolean; posts: BlogPost[] }) {
  return <Container className="border-t border-zinc-200 py-16 sm:py-20 dark:border-zinc-800">
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-20">
      <div data-reveal><p className="section-label">개발 기록</p><h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight">생각과 배움을<br />기록합니다.</h2><p className="muted-text mt-5 max-w-sm text-sm leading-7">개발하며 마주한 문제와 그 안에서 찾은 방법들을 정리합니다.</p><Link href="/blog" prefetch={false} className="text-link mt-6">모든 글 보기<ArrowRight size={15} aria-hidden="true" /></Link></div>
      <div>{loading ? <SkeletonCard /> : posts.length ? posts.map(post => <article data-reveal key={post.id} className="border-b border-zinc-200 py-7 first:pt-0 last:border-0 dark:border-zinc-800"><div className="flex flex-wrap items-center justify-between gap-3"><time className="font-mono text-xs text-zinc-400" dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time><span className="muted-text text-xs">조회 {post.view_count ?? 0}</span></div><h3 className="mt-3 text-lg font-semibold leading-relaxed tracking-tight"><Link href={`/blog/${encodeURIComponent(post.slug)}`} prefetch={false} className="hover:text-teal-700 dark:hover:text-teal-300">{post.title}</Link></h3><p className="muted-text mt-3 line-clamp-2 text-sm leading-7">{post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 140)}</p><Link href={`/blog/${encodeURIComponent(post.slug)}`} prefetch={false} className="text-link mt-4 text-xs">글 읽기<ArrowUpRight size={14} aria-hidden="true" /></Link></article>) : <EmptyState eyebrow="기록" title="다음 기록을 준비하고 있습니다" description="개발 과정에서 배운 내용을 이곳에 공유합니다." href="/blog" action="블로그 보기" />}</div>
    </div>
  </Container>;
}
