"use client";
import Link from "next/link";
import { Suspense } from "react";

// import Image from "next/image";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Head from "next/head";
import { blogApi } from "@/lib/api";
import { BlogPost as BlogPostType } from "@/types";
import toast from 'react-hot-toast';

// 마크다운 변환 유틸리티
import { markdownToHtml } from '@/utils/markdown';

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

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await blogApi.getPostBySlug(slug);
        if (response.success && response.data) {
          setPost(response.data);
          
          // 조회수 증가 (백그라운드에서 실행, 실패해도 사용자에게 알리지 않음)
          try {
            await blogApi.incrementViewCount(slug);
            // 로컬 상태에서 조회수 즉시 증가
            setPost(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
            // 조회수 증가 후 최신 데이터 다시 로드 (캐시 방지를 위해 약간의 지연)
            await new Promise(resolve => setTimeout(resolve, 100));
            const updatedResponse = await blogApi.getPostBySlug(slug);
            if (updatedResponse.success && updatedResponse.data) {
              setPost(updatedResponse.data);
            }
          } catch {
            // 조회수 증가 실패는 조용히 무시 (사용자 경험에 영향 없음)
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
            <Link href="/blog" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
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

  return (
    <>
      <Head>
        <title>{post.title} | 승우의 포트폴리오</title>
        <meta name="description" content={post.meta_description || post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.'} />
        <meta name="keywords" content={post.meta_keywords || post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ') || '웹개발, 블로그, React, Next.js'} />
        <meta name="author" content="승우" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
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
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.content?.substring(0, 160) || '웹 개발자 승우의 블로그 포스트입니다.'} />
        <meta name="twitter:image" content={post.featured_image || 'https://seungwoo.i234.me/og-image.jpg'} />
        <meta name="twitter:creator" content="@seungwoo" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://seungwoo.i234.me/blog/post?slug=${slug}`} />
        
        {/* 구조화된 데이터 */}
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">홈</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">블로그</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">{post.title}</span>
          </div>
        </nav>

        {/* Back to Blog */}
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>모든 포스트 보기</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4 text-slate-600 dark:text-slate-400 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                  <svg className="w-7 h-7 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-medium">승우</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">웹 개발자</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <time className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              </time>
              {post.read_time_minutes && (
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{post.read_time_minutes}분 읽기</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>조회 {post.view_count || 0}</span>
              </span>
            </div>
          </div>

          {/* 요약 */}
          {(post.excerpt || post.meta_description) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                요약
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {post.excerpt || post.meta_description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags && post.tags.length > 0 ? (
              post.tags.map((tag, index) => (
                <span key={typeof tag === 'string' ? tag : tag.id || index} className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-700 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-300 rounded-full mr-2"></span>
                  {typeof tag === 'string' ? tag : tag.name}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-600">
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mr-2"></span>
                태그 없음
              </span>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div
            className="bg-white dark:bg-slate-800 rounded-xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }} />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  콘텐츠를 불러올 수 없습니다.
                </p>
              </div>
            )}
          </div>
        </article>
      </main>
      </div>
    </>
  );
}

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
