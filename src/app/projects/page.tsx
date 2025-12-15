"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import toast from "react-hot-toast";
import DynamicHead from "@/components/DynamicHead";
import ScrollProgress from "../../components/ScrollProgress";
import { projectApi, api } from "@/lib/api";
import { Project } from "@/types";
import Pagination from "@/components/Pagination";
const PROJECT_CARD_REVEAL_INTERVAL = 120;
const PROJECTS_PAGE_SIZE = 6;
/**
 * @component Projects
 * @description 프로젝트 목록, 검색, 태그 필터링, 페이지네이션을 제공하는 공개 프로젝트 페이지.
 * @returns {JSX.Element} 프로젝트 페이지 컴포넌트.
 */
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [availableTechs, setAvailableTechs] = useState<string[]>([]);
  const [tags, setTags] = useState<Array<{id: string; name: string; slug: string}>>([]);
  const [sortOrder, setSortOrder] = useState<'created_at' | 'title' | 'view_count' | 'display_order'>('created_at');
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectRevealCount, setProjectRevealCount] = useState(0);
  const filteredProjects = useMemo(() => {
    return projects || [];
  }, [projects]);
  const projectSkeletonCount = useMemo(() => {
    if (filteredProjects.length > 0) {
      return filteredProjects.length;
    }
    if (totalProjects > 0) {
      return Math.max(Math.min(totalProjects, PROJECTS_PAGE_SIZE), 1);
    }
    return 1;
  }, [filteredProjects, totalProjects]);
  /**
   * @function handleSearch
   * @description 검색어 입력에 따라 프로젝트 목록 필터를 초기화하고 알림을 표시한다.
   * @param {string} query 검색어.
   * @returns {void}
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); 
    if (query.trim()) {
      toast.success(`"${query}" 검색 결과를 불러오는 중...`, {
        duration: 1500,
        icon: '🔍',
      });
    } else if (query === '') {
      toast('검색을 초기화했습니다.', {
        duration: 1500,
        icon: '✨',
      });
    }
  }, []);
  /**
   * @function handleTechFilter
   * @description 기술 스택 토글에 따라 필터 목록을 업데이트한다.
   * @param {string} tech 선택 또는 해제할 기술 스택 이름.
   * @returns {void}
   */
  const handleTechFilter = useCallback((tech: string) => {
    setSelectedTechs(prev => {
      const isCurrentlySelected = prev.includes(tech);
      const newTechs = isCurrentlySelected 
        ? prev.filter(t => t !== tech)
        : [...prev, tech];
      if (isCurrentlySelected) {
        toast(`"${tech}" 기술 스택을 해제했습니다.`, {
          duration: 1500,
          icon: '💻',
        });
      } else {
        toast(`"${tech}" 기술 스택을 선택했습니다.`, {
          duration: 1500,
          icon: '💻',
        });
      }
      return newTechs;
    });
    setCurrentPage(1); 
  }, []);
  /**
   * @component ProjectSkeletonContent
   * @description 프로젝트 카드 로딩 상태를 위한 스켈레톤 콘텐츠.
   * @returns {JSX.Element} 스켈레톤 카드 콘텐츠.
   */
  const ProjectSkeletonContent = () => (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-300 dark:bg-slate-600 rounded-lg" />
        <div className="flex space-x-3">
          <div className="w-5 h-5 bg-slate-300 dark:bg-slate-600 rounded" />
          <div className="w-5 h-5 bg-slate-300 dark:bg-slate-600 rounded" />
        </div>
      </div>
      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mb-2" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-4/5" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-12" />
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-16" />
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-14" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
      </div>
    </div>
  );
  /**
   * @component SkeletonProjectCard
   * @description 공통 스타일을 적용한 프로젝트 스켈레톤 카드 컨테이너.
   * @returns {JSX.Element} 스켈레톤 프로젝트 카드.
   */
  const SkeletonProjectCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ProjectSkeletonContent />
    </div>
  );
  useEffect(() => {
    /**
     * @function fetchTags
     * @description 프로젝트와 일반 태그를 모두 가져와 필터 옵션을 구성한다.
     * @returns {Promise<void>} 태그 로딩 완료 시 해결되는 프로미스.
     */
    const fetchTags = async () => {
      try {
        const [projectTagsResponse, generalTagsResponse] = await Promise.all([
          api.get('/tags', { type: 'project', popular: 'true' }),
          api.get('/tags', { type: 'general', popular: 'true' })
        ]);
        let allTags: Array<{id: string; name: string; slug: string}> = [];
        if (projectTagsResponse.success && projectTagsResponse.data && Array.isArray(projectTagsResponse.data)) {
          allTags = [...allTags, ...projectTagsResponse.data];
        }
        if (generalTagsResponse.success && generalTagsResponse.data && Array.isArray(generalTagsResponse.data)) {
          allTags = [...allTags, ...generalTagsResponse.data];
        }
        const techNames = allTags.map(tag => tag.name).sort();
        setAvailableTechs(techNames);
        setTags(allTags);
      } catch {
      }
    };
    fetchTags();
  }, []); 
  useEffect(() => {
    /**
     * @function fetchData
     * @description 프로젝트 목록과 관련 설정을 로드하여 페이지 상태를 갱신한다.
     * @returns {Promise<void>} 데이터 로딩 작업.
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const params: {
          limit?: number;
          page?: number;
          featured?: boolean;
          search?: string;
          tags?: string[];
          skills?: string[];
          status?: 'published' | 'draft' | 'all';
          sort?: 'created_at' | 'title' | 'view_count' | 'display_order';
          order?: 'asc' | 'desc';
        } = {
          limit: 6, 
          page: currentPage,
          sort: sortOrder,
          order: 'desc'
        };
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (selectedTechs.length > 0) {
          const selectedSlugs = selectedTechs.map(techName => {
            const tag = tags.find(t => t.name === techName);
            return tag ? tag.slug : techName; 
          });
          params.tags = selectedSlugs; 
        }
        const projectsResponse = await projectApi.getProjects(params);
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
          if (projectsResponse.pagination) {
            setTotalPages(projectsResponse.pagination.totalPages || Math.ceil(projectsResponse.pagination.total / 6));
            setTotalProjects(projectsResponse.pagination.total);
          }
          setError(null);
        } else {
          setError('프로젝트를 불러올 수 없습니다.');
        }
        try {
          const settingsResponse = await api.get<{ [key: string]: string }>('/settings');
          if (settingsResponse.success && settingsResponse.data) {
            const settings = settingsResponse.data;
            const githubUrl = settings.github_url || settings.personal_github_url;
            if (githubUrl && typeof githubUrl === 'string' && githubUrl !== 'https://github.com') {
              setGithubUrl(githubUrl);
            }
          }
        } catch {
        }
      } catch {
        setError('서버와의 연결에 문제가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, searchQuery, selectedTechs, sortOrder, tags]);
  useEffect(() => {
    if (loading || filteredProjects.length === 0) {
      setProjectRevealCount(0);
      return;
    }
    setProjectRevealCount(0);
    const interval = window.setInterval(() => {
      setProjectRevealCount((prev) => {
        const next = Math.min(prev + 1, filteredProjects.length);
        if (next === filteredProjects.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, PROJECT_CARD_REVEAL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [loading, filteredProjects]);
  /**
   * @function handlePageChange
   * @description 페이지네이션 이동 시 현재 페이지와 스크롤 위치를 업데이트한다.
   * @param {number} page 이동할 페이지 번호.
   * @returns {void}
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <>
      <Head>
        <title>프로젝트 | 승우의 포트폴리오</title>
        <meta name="description" content="웹 개발자 승우의 프로젝트 포트폴리오입니다. React, Next.js, Node.js 등을 활용한 다양한 웹 프로젝트들을 확인해보세요." />
        <meta name="keywords" content="웹개발, 프로젝트, 포트폴리오, React, Next.js, Node.js, 프론트엔드, 백엔드" />
        <meta name="author" content="승우" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="프로젝트 | 승우의 포트폴리오" />
        <meta property="og:description" content="웹 개발자 승우의 프로젝트 포트폴리오입니다. React, Next.js, Node.js 등을 활용한 다양한 웹 프로젝트들을 확인해보세요." />
        <meta property="og:url" content="https://seungwoo.i234.me/projects" />
        <meta property="og:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta property="og:image:alt" content="승우의 프로젝트 포트폴리오" />
        <meta property="og:site_name" content="승우의 포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="프로젝트 | 승우의 포트폴리오" />
        <meta name="twitter:description" content="웹 개발자 승우의 프로젝트 포트폴리오입니다. React, Next.js, Node.js 등을 활용한 다양한 웹 프로젝트들을 확인해보세요." />
        <meta name="twitter:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta name="twitter:creator" content="@seungwoo" />
        <link rel="canonical" href="https://seungwoo.i234.me/projects" />
      </Head>
      <DynamicHead pageTitle="프로젝트" />
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              프로젝트 포트폴리오
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
              다양한 기술을 활용하여 제작한 프로젝트들을 소개합니다
            </p>
          </section>
          <section className="mb-16">
            <div className="mb-8">
              <div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="프로젝트 검색..." 
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full sm:w-80 px-4 py-2 pl-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    aria-label="프로젝트 검색"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div 
                className="flex flex-wrap justify-center gap-2 mb-8"
              >
                <button
                  onClick={() => setSelectedTechs([])}
                  data-all-projects="true"
                  className={`px-4 py-2 text-sm border-2 rounded-lg transition-all duration-200 font-semibold active:scale-95 relative group ${
                    selectedTechs.length === 0
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-purple-700 ring-4 ring-purple-200 dark:ring-purple-800/50'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300 dark:hover:border-purple-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-200 dark:hover:ring-purple-800/50'
                  }`}
                >
                  전체
                  {selectedTechs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      ↺
                    </span>
                  )}
                </button>
                {availableTechs.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => handleTechFilter(tech)}
                    className={`px-4 py-2 text-sm border-2 rounded-lg transition-all duration-200 font-semibold active:scale-95 relative group ${
                      selectedTechs.includes(tech)
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-400 hover:border-slate-500 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 ring-4 ring-purple-200 dark:ring-purple-800/50'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300 dark:hover:border-purple-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-purple-200 dark:hover:ring-purple-800/50'
                    }`}
                  >
                    {tech}
                    {!selectedTechs.includes(tech) && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        +
                      </span>
                    )}
                    {selectedTechs.includes(tech) && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  프로젝트 ({filteredProjects.length}개)
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      const newSortOrder = e.target.value as 'created_at' | 'title' | 'view_count' | 'display_order';
                      setSortOrder(newSortOrder);
                      const sortLabels = {
                        'created_at': '생성일순',
                        'title': '제목순',
                        'view_count': '조회수순',
                        'display_order': '표시순서순'
                      };
                      toast(`${sortLabels[newSortOrder]}으로 정렬합니다.`, {
                        duration: 1500,
                        icon: '🔄',
                      });
                    }}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="프로젝트 정렬 방식 선택"
                  >
                    <option value="created_at">생성일순</option>
                    <option value="title">제목순</option>
                    <option value="view_count">조회수순</option>
                    <option value="display_order">표시순서</option>
                  </select>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="grid lg:grid-cols-2 gap-8">
                {Array.from({ length: projectSkeletonCount }).map((_, index) => (
                  <SkeletonProjectCard key={`project-loading-${index}`} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">데이터를 불러올 수 없습니다</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery || selectedTechs.length > 0 ? '검색 결과가 없습니다.' : '아직 프로젝트가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {filteredProjects.map((project, index) => {
                  const isRevealed = index < projectRevealCount;
                  const baseClass = "bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700";
                  const stateClass = isRevealed
                    ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
                    : "cursor-default pointer-events-none";
                  /**
                   * @description 프로젝트에 연결된 기술 스택 목록을 계산합니다.
                   * @returns {string[]} 표시할 기술 스택 배열.
                   */
                  const techList = (() => {
                    if (project.technologies) {
                      return project.technologies.split(',').map((tech) => tech.trim());
                    }
                    if (project.skills && project.skills.length > 0) {
                      return project.skills.map((skill) => skill.name);
                    }
                    if (project.tags && project.tags.length > 0) {
                      return project.tags.map((tag) => (typeof tag === 'string' ? tag : tag.name));
                    }
                    return [] as string[];
                  })();
                  return (
                    <article
                      key={project.id}
                      className={`${baseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/projects/detail?slug=${encodeURIComponent(project.slug)}`) : undefined}
                    >
                      {isRevealed ? (
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              {project.image_url ? (
                                <Image src={project.image_url} alt={project.title} width={24} height={24} className="rounded" style={{ width: "auto", height: "auto" }} />
                              ) : (
                                <span className="text-white font-bold text-sm">
                                  {project.title.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-3">
                              {project.demo_url && (
                                <a
                                  href={project.demo_url}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                              {project.github_url && (
                                <a
                                  href={project.github_url}
                                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <time>{project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}</time>
                            <span className="text-sm text-slate-400">{project.featured ? '주요 프로젝트' : '프로젝트'}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2">
                            {project.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                            {project.excerpt || project.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {techList.length > 0 ? (
                              techList.map((tech, techIndex) => (
                                <span
                                  key={`${project.id}-tech-${techIndex}`}
                                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full cursor-pointer transition-transform transform hover:-translate-y-0.5 hover:scale-105"
                                >
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm rounded-full">
                                기술 정보 없음
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mb-3">
                            {project.demo_url && (
                              <a
                                href={project.demo_url}
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm transition-transform transform hover:translate-x-1"
                                onClick={(e) => e.stopPropagation()}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                데모 보기 →
                              </a>
                            )}
                            {project.github_url && (
                              <a
                                href={project.github_url}
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm transition-transform transform hover:translate-x-1"
                                onClick={(e) => e.stopPropagation()}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                GitHub →
                              </a>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <a
                              href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`}
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm transition-transform transform hover:translate-x-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              자세히 보기 →
                            </a>
                            <span className="text-xs text-slate-400">
                              조회 {project.view_count || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <ProjectSkeletonContent />
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {!searchQuery && selectedTechs.length === 0 && totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <div className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
                  총 {totalProjects}개의 프로젝트 중 {((currentPage - 1) * 6) + 1}-{Math.min(currentPage * 6, totalProjects)}번째 프로젝트
                </div>
              </div>
            )}
          </section>
          <section 
            className="mt-16 text-center"
          >
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                함께 프로젝트를 만들어보실래요?
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                새로운 아이디어나 협업 제안을 언제든 환영합니다
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" prefetch={false} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  연락하기
                </Link>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  GitHub 보기
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
