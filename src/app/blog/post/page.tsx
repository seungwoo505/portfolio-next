"use client";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Head from "next/head";
import { blogApi } from "@/lib/api";
import { BlogPost as BlogPostType } from "@/types";
import toast from 'react-hot-toast';
import { markdownToHtml } from '@/utils/markdown';
/**
 * @component BlogPostContent
 * @description 블로그 상세 데이터를 로딩하고 렌더링하는 클라이언트 컴포넌트.
 * @returns {JSX.Element} 블로그 포스트 상세 콘텐츠.
 */
function BlogPostContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) {
      toast.error('포스트를 찾을 수 없습니다.');
      setLoading(false);
      return;
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
          setPost(response.data);
          try {
            await blogApi.incrementViewCount(slug);
            setPost(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
            await new Promise(resolve => setTimeout(resolve, 100));
            const updatedResponse = await blogApi.getPostBySlug(slug);
            if (updatedResponse.success && updatedResponse.data) {
              setPost(updatedResponse.data);
            }
          } catch {
          }
        } else {
          toast.error('포스트를 찾을 수 없습니다.');
        }
      } catch {
        toast.error('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">포스트를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }
  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">포스트를 찾을 수 없습니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">요청하신 포스트를 찾을 수 없습니다.</p>
            <Link href="/blog" prefetch={false} className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>모든 포스트 보기</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  const formattedDate = post.created_at
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
    <>
      <Head>
        <title>{post.title} | 승우의 포트폴리오</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.'} />
        <meta name="keywords" content={post.meta_keywords || post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ') || '웹개발, 블로그, React, Next.js'} />
        <meta name="author" content="승우" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.'} />
        <meta property="og:url" content={`https://seungwoo.i234.me/blog/post?slug=${slug}`} />
        <meta property="og:image" content={post.featured_image || 'https://seungwoo.i234.me/og-image.jpg'} />
        <meta property="og:image:alt" content={post.title} />
        <meta property="og:site_name" content="승우의 포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="article:author" content="승우" />
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        {post.tags && post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={typeof tag === 'string' ? tag : tag.name} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.'} />
        <meta name="twitter:image" content={post.featured_image || 'https://seungwoo.i234.me/og-image.jpg'} />
        <meta name="twitter:creator" content="@seungwoo" />
        <link rel="canonical" href={`https://seungwoo.i234.me/blog/post?slug=${slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.meta_description || post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.',
              "author": {
                "@type": "Person",
                "name": "승우",
                "url": "https://seungwoo.i234.me"
              },
              "publisher": {
                "@type": "Organization",
                "name": "승우의 포트폴리오",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://seungwoo.i234.me/images/logo.png"
                }
              },
              "datePublished": post.published_at || post.created_at,
              "dateModified": post.updated_at,
              "url": `https://seungwoo.i234.me/blog/post?slug=${slug}`,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://seungwoo.i234.me/blog/post?slug=${slug}`
              },
              "image": post.featured_image ? {
                "@type": "ImageObject",
                "url": post.featured_image,
                "width": 1200,
                "height": 630
              } : undefined,
              "keywords": post.meta_keywords ? post.meta_keywords.split(',').map(k => k.trim()) : post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name),
              "articleSection": "Technology",
              "wordCount": post.content ? post.content.split(' ').length : undefined,
              "timeRequired": post.read_time_minutes ? `PT${post.read_time_minutes}M` : undefined,
              "isPartOf": {
                "@type": "Blog",
                "name": "승우의 개발 블로그",
                "url": "https://seungwoo.i234.me/blog"
              }
            })
          }}
        />
      </Head>
      <div className="blog-post-bg relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 -right-28 h-80 w-80 rounded-full bg-gradient-to-br from-transparent via-transparent to-transparent blur-3xl dark:from-blue-500/15 dark:via-cyan-500/10" />
          <div className="absolute bottom-[-10rem] left-[-6rem] h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-transparent via-transparent to-transparent blur-3xl dark:from-purple-500/12 dark:via-blue-500/10" />
        </div>

        <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-transparent">
            <Link href="/" prefetch={false} className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              홈
            </Link>
            <span>/</span>
            <Link href="/blog" prefetch={false} className="inline-flex items-center gap-1 rounded-full px-3 py-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              블로그
            </Link>
            <span>/</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">
              {post?.title || '상세'}
            </span>
        </nav>

          <section className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-2xl shadow-blue-500/10 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-800">
            {post.featured_image ? (
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-40 dark:opacity-30"
              />
            ) : null}
            <div className="absolute -top-24 left-8 h-64 w-64 rounded-full bg-gradient-to-br from-transparent via-transparent to-transparent blur-3xl dark:from-emerald-500/15 dark:via-teal-500/15" />
            <div className="absolute -bottom-28 right-12 h-72 w-72 rounded-full bg-gradient-to-br from-transparent via-transparent to-transparent blur-3xl dark:from-cyan-400/12 dark:via-green-500/10" />

            <div className="relative z-10 space-y-8 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                Featured Insight
        </div>

              <div className="space-y-5">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.85rem] lg:leading-[1.1] dark:text-white">
            {post.title}
          </h1>
                {(post.excerpt || post.meta_description) && (
                  <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                    {post.excerpt || post.meta_description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 dark:bg-slate-800/70">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                  {formattedDate}
                </span>
                {readingTime && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 dark:bg-slate-800/70">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    {readingTime}
                </span>
              )}
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 dark:bg-slate-800/70">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                  조회 {viewCount}
              </span>
            </div>

              <div className="flex flex-wrap gap-2">
                {tagList.length ? (
                  tagList.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300" />
                      {tag}
                </span>
              ))
            ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-slate-100/80 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300">
                태그 없음
              </span>
            )}
          </div>
            </div>
          </section>

          <article className="relative overflow-hidden rounded-3xl border border-slate-200/70 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800">
            <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent dark:via-blue-500/30" />
            <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
              <div className="prose prose-lg max-w-none prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900 prose-code:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-pre:shadow-lg dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-slate-300 dark:prose-a:text-blue-400 dark:prose-strong:text-white dark:prose-code:text-slate-200 dark:prose-code:bg-slate-800 dark:text-slate-200">
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }} />
            ) : (
                  <div className="py-12 text-center text-lg text-slate-500 dark:text-slate-400">
                  콘텐츠를 불러올 수 없습니다.
                  </div>
                )}
              </div>
            </div>
          </article>

          <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 p-8 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800">
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
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  다른 포스트 보기
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h6m0 0v6m0-6L10 16" />
                  </svg>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 dark:border-blue-400/30 dark:bg-slate-800/90 dark:text-blue-300 dark:hover:bg-slate-700/90"
                >
                  프로젝트 살펴보기
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
 * @component BlogPost
 * @description Suspense를 활용해 블로그 상세 콘텐츠를 비동기 로드하는 페이지 컴포넌트.
 * @returns {JSX.Element} 블로그 포스트 페이지 컨테이너.
 */
export default function BlogPost() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">포스트를 불러오는 중...</p>
          </div>
        </main>
      </div>
    }>
      <BlogPostContent />
    </Suspense>
  );
}
