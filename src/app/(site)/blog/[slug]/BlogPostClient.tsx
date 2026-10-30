"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { blogApi } from "@/lib/api";
import { BlogPost as BlogPostType } from "@/types";
import toast from 'react-hot-toast';

interface BlogPostClientProps {
  slug: string;
  initialPost?: BlogPostType | null;
}
/**
 * @component BlogPostContent
 * @description 블로그 상세 데이터를 로딩하고 렌더링하는 클라이언트 컴포넌트.
 * @returns {JSX.Element} 블로그 포스트 상세 콘텐츠.
 */
function BlogPostContent({ slug, initialPost }: BlogPostClientProps) {
  const [post, setPost] = useState<BlogPostType | null>(initialPost ?? null);
  const [loading, setLoading] = useState(!initialPost);
  const [postContentHtml, setPostContentHtml] = useState('');

  useEffect(() => {
    if (!slug) {
      toast.error('포스트를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const incrementViewCount = async () => {
      try {
        await blogApi.incrementViewCount(slug);
        if (!cancelled) {
          setPost(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
        }
      } catch {
      }
    };

    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      incrementViewCount();
      return () => {
        cancelled = true;
      };
    }

    /**
     * @function fetchPost
     * @description 슬러그에 해당하는 블로그 포스트를 조회하고 조회수를 갱신한다.
     * @returns {Promise<void>} 포스트 로딩 작업.
     */
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await blogApi.getPostBySlug(slug);
        if (response.success && response.data) {
          if (!cancelled) {
            setPost(response.data);
          }
          await incrementViewCount();
        } else {
          toast.error('포스트를 찾을 수 없습니다.');
        }
      } catch {
        toast.error('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchPost();
    return () => {
      cancelled = true;
    };
  }, [slug, initialPost]);
  useEffect(() => {
    let cancelled = false;
    if (!post?.content_html?.trim() && !post?.content) {
      setPostContentHtml('');
      return;
    }
    import('@/utils/markdown').then(({ markdownToHtml, sanitizeHtml }) => {
      if (!cancelled) {
        setPostContentHtml(
          post.content_html?.trim()
            ? sanitizeHtml(post.content_html)
            : markdownToHtml(post.content || '')
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [post?.content, post?.content_html]);
  if (loading) {
    return <div className="site-container site-section" role="status"><div className="mx-auto max-w-[720px] space-y-5 motion-safe:animate-pulse"><div className="h-4 w-28 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-12 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-5 w-full rounded bg-zinc-100 dark:bg-zinc-800" /><p className="muted-text">포스트를 불러오는 중...</p></div></div>;
  }
  if (!post) {
    return <div className="site-container site-section"><div className="surface-card mx-auto max-w-[720px] p-8 sm:p-12"><p className="section-label">개발 기록</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">포스트를 찾을 수 없습니다.</h1><p className="muted-text mt-4">주소를 확인하거나 블로그 목록에서 다시 찾아보세요.</p><Link href="/blog" prefetch={false} className="action-secondary mt-8">모든 포스트 보기</Link></div></div>;
  }  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const readingTime = post.read_time_minutes
    ? `${post.read_time_minutes}분 읽기`
    : null;

  const tagList = Array.isArray(post.tags)
    ? post.tags.map(tag => (typeof tag === 'string' ? tag : tag.name))
    : [];

  const viewCount = post.view_count ?? 0;

  return (
    <div className="site-container site-section">
      <div className="mx-auto max-w-[720px]">
        <nav aria-label="현재 위치" className="muted-text mb-10 flex min-w-0 items-center gap-3 text-sm"><Link href="/" prefetch={false} className="shrink-0 hover:text-teal-700 dark:hover:text-teal-400">홈</Link><span aria-hidden="true">/</span><Link href="/blog" prefetch={false} className="shrink-0 hover:text-teal-700 dark:hover:text-teal-400">블로그</Link><span aria-hidden="true">/</span><span aria-current="page" className="truncate">{post.title}</span></nav>
        <header className="border-b border-zinc-200 pb-10 dark:border-zinc-800">
          <p className="section-label">개발 기록</p>
          <h1 className="page-heading mt-4 break-words">{post.title}</h1>
          {(post.excerpt || post.meta_description) && <p className="page-intro mt-6">{post.excerpt || post.meta_description}</p>}
          <div className="muted-text mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><time dateTime={post.created_at}>{formattedDate}</time>{readingTime && <span>{readingTime}</span>}<span>조회 {viewCount}</span></div>
          {tagList.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{tagList.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>}
        </header>
        {post.featured_image && <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"><Image src={post.featured_image} alt={post.title} fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" /></div>}
        <article className="py-10 sm:py-12" aria-label="포스트 본문">
          <div className="prose-content">
            {(post.content_html?.trim() || post.content) ? postContentHtml ? <div className="blog-post-block-content" dangerouslySetInnerHTML={{ __html: postContentHtml }} /> : <p className="muted-text" role="status">포스트 내용을 렌더링하는 중입니다.</p> : <p className="muted-text">콘텐츠를 불러올 수 없습니다.</p>}
          </div>
        </article>
        <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-zinc-200 pt-8 dark:border-zinc-800"><Link href="/blog" prefetch={false} className="action-secondary">← 모든 포스트 보기</Link><Link href="/projects" prefetch={false} className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">프로젝트 살펴보기 →</Link></footer>
      </div>
    </div>
  );
}

export default function BlogPostClient({ slug, initialPost }: BlogPostClientProps) {
  return <BlogPostContent slug={slug} initialPost={initialPost} />;
}
