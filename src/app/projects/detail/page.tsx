"use client";
import Link from "next/link";
import { Suspense } from "react";

// import Image from "next/image";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Head from "next/head";
import { projectApi } from "@/lib/api";
import { Project } from "@/types";
import toast from 'react-hot-toast';

// 마크다운 변환 유틸리티
import { markdownToHtml } from '@/utils/markdown';

function ProjectDetailContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    if (!slug) {
      toast.error('프로젝트를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        // URL 디코딩 (한글 slug 처리)
        const decodedSlug = decodeURIComponent(slug);
        
        const response = await projectApi.getProject(decodedSlug);
        if (response.success && response.data) {
          setProject(response.data);
          
          // 조회수 증가 (백그라운드에서 실행, 실패해도 사용자에게 알리지 않음)
          try {
            await projectApi.incrementViewCount(decodedSlug);
            // 로컬 상태에서 조회수 즉시 증가
            setProject(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
            // 조회수 증가 후 최신 데이터 다시 로드 (캐시 방지를 위해 약간의 지연)
            await new Promise(resolve => setTimeout(resolve, 100));
            const updatedResponse = await projectApi.getProject(decodedSlug);
            if (updatedResponse.success && updatedResponse.data) {
              setProject(updatedResponse.data);
            }
          } catch {
            // 조회수 증가 실패는 조용히 무시 (사용자 경험에 영향 없음)
          }
        } else {
          toast.error('프로젝트를 찾을 수 없습니다.');
        }
      } catch {
        // 에러 처리
        toast.error('프로젝트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

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
            <Link href="/projects" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
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

  return (
    <>
      <Head>
        <title>{project.title} | 승우의 포트폴리오</title>
        <meta name="description" content={project.excerpt || project.meta_description || project.description || '웹 개발자 승우의 프로젝트입니다.'} />
        <meta name="keywords" content={project.meta_keywords || project.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ') || '웹개발, 프로젝트, React, Next.js'} />
        <meta name="author" content="승우" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={project.title} />
        <meta property="og:description" content={project.excerpt || project.meta_description || project.description || '웹 개발자 승우의 프로젝트입니다.'} />
        <meta property="og:url" content={`https://seungwoo.i234.me/projects/detail?slug=${encodeURIComponent(slug || '')}`} />
        <meta property="og:image" content={project.image_url || 'https://seungwoo.i234.me/og-image.jpg'} />
        <meta property="og:image:alt" content={project.title} />
        <meta property="og:site_name" content="승우의 포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={project.title} />
        <meta name="twitter:description" content={project.excerpt || project.meta_description || project.description || '웹 개발자 승우의 프로젝트입니다.'} />
        <meta name="twitter:image" content={project.image_url || 'https://seungwoo.i234.me/og-image.jpg'} />
        <meta name="twitter:creator" content="@seungwoo" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://seungwoo.i234.me/projects/detail?slug=${encodeURIComponent(slug || '')}`} />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              "name": project.title,
              "description": project.excerpt || project.meta_description || project.description,
              "author": {
                "@type": "Person",
                "name": "승우",
                "url": "https://seungwoo.i234.me"
              },
              "url": `https://seungwoo.i234.me/projects/detail?slug=${encodeURIComponent(slug || '')}`,
              "image": project.image_url ? {
                "@type": "ImageObject",
                "url": project.image_url,
                "width": 1200,
                "height": 630
              } : undefined,
              "dateCreated": project.start_date,
              "dateModified": project.updated_at,
              "keywords": project.meta_keywords ? project.meta_keywords.split(',').map(k => k.trim()) : project.tags?.map(tag => typeof tag === 'string' ? tag : tag.name),
              "about": project.tags?.map(tag => typeof tag === 'string' ? tag : tag.name),
              "isPartOf": {
                "@type": "WebSite",
                "name": "승우의 포트폴리오",
                "url": "https://seungwoo.i234.me"
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "name": project.title,
                "description": project.excerpt || project.meta_description || project.description,
                "applicationCategory": "WebApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "KRW"
                },
                "url": project.demo_url,
                "downloadUrl": project.github_url,
                "screenshot": project.image_url
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
            <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">프로젝트</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">{project.title}</span>
          </div>
        </nav>

        {/* Back to Projects */}
        <div className="mb-8">
          <Link href="/projects" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>모든 프로젝트 보기</span>
          </Link>
        </div>

        {/* Project Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            {project.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4 text-slate-600 dark:text-slate-400 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                  <svg className="w-7 h-7 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-medium">승우</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">웹 개발자</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <time className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '시작일 미정'}
                  {project.end_date && project.status !== 'in_progress' ? ` - ${new Date(project.end_date).toLocaleDateString('ko-KR')}` : ''}
                  {project.status === 'in_progress' ? ' - 진행중' : ''}
                </span>
              </time>
              
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>조회 {project.view_count || 0}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags && project.tags.length > 0 ? (
              project.tags.map((tag, index) => (
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

          {/* 요약 */}
          {(project.excerpt || project.meta_description) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                프로젝트 요약
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.excerpt || project.meta_description}
              </p>
            </div>
          )}
        </header>

        {/* Project Description - 상단 요약 섹션 */}
        {project.description && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-blue-100 dark:border-slate-600">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">이 프로젝트는</h2>
                  <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Content */}
        {project.content && (
          <article className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-700">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(project.content) }} />
            </div>
          </article>
        )}

        {/* Project Links */}
        {(project.demo_url || project.github_url) && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">프로젝트 링크</h3>
            <div className="flex flex-wrap gap-4">
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>프로젝트 보기</span>
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  );
}

export default function ProjectDetail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">프로젝트를 불러오는 중...</p>
          </div>
        </main>
      </div>
    }>
      <ProjectDetailContent />
    </Suspense>
  );
}
