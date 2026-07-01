"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  ExternalLink,
  Eye,
  Github,
  PackageCheck,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import ScrollProgress from "@/components/ScrollProgress";
import ProjectCoverImage from "@/components/ProjectCoverImage";
import { projectApi, api } from "@/lib/api";
import { Project } from "@/types";
import Pagination from "@/components/Pagination";
const PROJECT_CARD_REVEAL_INTERVAL = 120;
const PROJECTS_PAGE_SIZE = 6;

/**
 * 한글 초성 변환 함수
 * @param str 변환할 문자열
 * @returns 초성으로 변환된 문자열
 */
const getInitialConsonant = (str: string): string => {
  const initialConsonants = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    // 한글 범위 (가-힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const initialIndex = Math.floor((code - 0xAC00) / 588);
      return initialConsonants[initialIndex] || char;
    }
    // 초성이 이미 입력된 경우
    if (initialConsonants.includes(char)) {
      return char;
    }
    // 영문자나 숫자는 그대로 유지
    return char.toLowerCase();
  }).join('');
};

/**
 * 초성 검색이 포함된 검색 함수
 * @param text 검색 대상 텍스트
 * @param query 검색어
 * @returns 검색 결과 매치 여부
 */
const matchesSearch = (text: string | undefined | null, query: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 일반 문자열 검색 (대소문자 구분 없음)
  if (lowerText.includes(lowerQuery)) {
    return true;
  }
  
  // 초성 검색
  const textInitial = getInitialConsonant(text);
  const queryInitial = getInitialConsonant(query);
  if (textInitial.includes(queryInitial)) {
    return true;
  }
  
  return false;
};
/**
 * @component Projects
 * @description 프로젝트 목록, 검색, 태그 필터링, 페이지네이션을 제공하는 공개 프로젝트 페이지.
 * @returns {JSX.Element} 프로젝트 페이지 컴포넌트.
 */
export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [availableTechs, setAvailableTechs] = useState<string[]>([]);
  const [_tags, setTags] = useState<Array<{id: string; name: string; slug: string}>>([]);
  const [sortOrder, setSortOrder] = useState<'created_at' | 'title' | 'view_count' | 'display_order'>('created_at');
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectRevealCount, setProjectRevealCount] = useState(0);
  const [allProjects, setAllProjects] = useState<Project[]>([]); // 모든 프로젝트 저장

  // 프론트엔드에서 검색, 필터, 정렬, 페이지네이션 처리
  const filteredProjects = useMemo(() => {
    let filtered = [...allProjects];

    // 검색어 필터링 (대소문자 구분 없음, 초성 검색 포함)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter(project => 
        matchesSearch(project.title, query) ||
        matchesSearch(project.description, query) ||
        matchesSearch(project.excerpt, query)
      );
    }

    // 기술 스택 필터링
    if (selectedTechs.length > 0) {
      filtered = filtered.filter(project => {
        const projectSkills = project.skills?.map(s => typeof s === 'string' ? s : s.name) || [];
        const projectTags = project.tags?.map(t => typeof t === 'string' ? t : t.name) || [];
        const allTechs = [...projectSkills, ...projectTags];
        return selectedTechs.some(tech => allTechs.includes(tech));
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'title':
          return a.title.localeCompare(b.title, 'ko');
        case 'view_count':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'display_order':
          return (a.display_order || 0) - (b.display_order || 0);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [allProjects, searchQuery, selectedTechs, sortOrder]);

  // 페이지네이션된 프로젝트
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECTS_PAGE_SIZE;
    const endIndex = startIndex + PROJECTS_PAGE_SIZE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);
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
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/10">
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
  // 초기 데이터 로드 (한 번만)
  useEffect(() => {
    /**
     * @function fetchData
     * @description 모든 프로젝트 목록을 한 번에 로드하여 상태를 갱신한다.
     * @returns {Promise<void>} 데이터 로딩 작업.
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectsResponse = await projectApi.getAllProjects({
          status: 'published',
          sort: 'created_at',
          order: 'desc'
        });
        if (projectsResponse.success && projectsResponse.data) {
          setAllProjects(projectsResponse.data);
          setTotalProjects(projectsResponse.data.length);
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
  }, []); // 초기 로드만

  // 필터링된 결과에 따라 페이지네이션 업데이트
  useEffect(() => {
    const total = Math.ceil(filteredProjects.length / PROJECTS_PAGE_SIZE);
    setTotalPages(total || 1);
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredProjects, currentPage]);

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
      <ScrollProgress />
      <div className="min-h-screen bg-[#f8faf7] dark:bg-neutral-950">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <section className="mb-12">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-normal text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                Project Catalog
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-normal text-slate-950 md:text-5xl dark:text-white">
                프로젝트를 상품처럼 고르는 포트폴리오 카탈로그
            </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg dark:text-slate-300">
                기술 스택, 조회수, 데모 링크를 기준으로 프로젝트를 빠르게 비교하고 상세 페이지로 이동할 수 있습니다.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-bold uppercase tracking-normal text-blue-700 dark:text-blue-300">
                  Items
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {totalProjects}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  등록 프로젝트
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-bold uppercase tracking-normal text-emerald-700 dark:text-emerald-300">
                  Filtered
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {filteredProjects.length}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  현재 진열 수
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="text-xs font-bold uppercase tracking-normal text-rose-600 dark:text-rose-300">
                  Tags
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {availableTechs.length}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  선택 가능한 기술
                </p>
              </div>
            </div>
          </section>
          <section className="mb-16">
            <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/10">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-normal text-slate-500 dark:text-slate-400">
                    Store Controls
                  </p>
                  <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
                    <SlidersHorizontal className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    카탈로그 필터
                  </h2>
                </div>

                <div className="relative w-full lg:w-96">
                  <input
                    type="text"
                    placeholder="프로젝트, 설명, 키워드 검색"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 pl-11 text-sm font-semibold text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-white/15 dark:bg-neutral-900 dark:text-white dark:focus:ring-emerald-400/20"
                    aria-label="프로젝트 검색"
                  />
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTechs([])}
                  data-all-projects="true"
                  className={`inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-bold transition-all duration-200 active:scale-95 ${
                    selectedTechs.length === 0
                      ? 'border-slate-950 bg-slate-950 text-white shadow-md dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200'
                  }`}
                >
                  전체 진열
                </button>
                {availableTechs.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => handleTechFilter(tech)}
                    className={`project-filter-btn inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-bold transition-all duration-200 active:scale-95 ${
                      selectedTechs.includes(tech)
                        ? 'project-filter-btn-selected border-emerald-600 bg-emerald-600 text-white shadow-md dark:border-emerald-300 dark:bg-emerald-300 dark:text-slate-950'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                  프로젝트 상품 ({filteredProjects.length}개)
                </h2>
                <div className="flex items-center gap-3">
                  <label htmlFor="project-sort" className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    정렬
                  </label>
                  <select
                    id="project-sort"
                    value={sortOrder}
                    onChange={(e) => {
                      const newSortOrder = e.target.value as 'created_at' | 'title' | 'view_count' | 'display_order';
                      setSortOrder(newSortOrder);
                      const sortLabels = {
                        'created_at': '최신 입고순',
                        'title': '이름순',
                        'view_count': '인기순',
                        'display_order': '추천순'
                      };
                      toast(`${sortLabels[newSortOrder]}으로 정렬합니다.`, {
                        duration: 1500,
                        icon: '🔄',
                      });
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
                    aria-label="프로젝트 정렬 방식 선택"
                  >
                    <option value="created_at">최신 입고순</option>
                    <option value="title">이름순</option>
                    <option value="view_count">인기순</option>
                    <option value="display_order">추천순</option>
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
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/10">
                <p className="mb-3 text-xs font-bold uppercase tracking-normal text-amber-600 dark:text-amber-300">
                  Catalog Pending
                </p>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mb-2">프로젝트 데이터를 연결하는 중입니다</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-5">
                  라이브 서버가 연결되면 대표 프로젝트와 기술 스택이 표시됩니다. 지금은 프로젝트 탐색 흐름을 먼저 확인할 수 있습니다.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200"
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {paginatedProjects.map((project, index) => {
                  const isRevealed = index < projectRevealCount;
                  const baseClass = "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-white/10";
                  const stateClass = isRevealed
                    ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl"
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
	                  const coverImage = project.featured_image || project.image_url;
                    const demoUrl = project.demo_url || project.project_url;
                    const catalogLabel =
                      project.catalog_label || (project.featured ? '추천' : '카탈로그');
                    const catalogStatus =
                      project.catalog_status ||
                      (project.status === 'completed' ? '출시 완료' : '진행 기록');
                    const catalogSummary =
                      project.catalog_summary ||
                      project.excerpt ||
                      project.description ||
                      project.content_text?.slice(0, 160) ||
                      '프로젝트 설명이 없습니다.';
		                  return (
                    <article
                      key={project.id}
                      className={`${baseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/projects/${encodeURIComponent(project.slug)}`) : undefined}
                    >
	                      {isRevealed ? (
	                        <div className="flex h-full flex-col">
                            <div className="relative border-b border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-neutral-900">
                              {coverImage ? (
                                <ProjectCoverImage
                                  src={coverImage}
                                  alt={project.title}
                                  sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                                  priority={index < 2}
                                  className="h-44"
                                />
                              ) : (
                                <div className="flex h-44 items-center justify-center">
                                  <PackageCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-300" />
                                </div>
                              )}
                              <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm dark:bg-neutral-950 dark:text-white">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                {catalogLabel}
                              </div>
                              <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm dark:bg-neutral-950 dark:text-slate-300">
                                <Eye className="h-3.5 w-3.5" />
                                {project.view_count || 0}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <time>{project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}</time>
                                <span>{catalogStatus}</span>
                              </div>
                              <h3 className="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">
                                {project.title}
                              </h3>
                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
	                              {catalogSummary}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {techList.length > 0 ? (
                                  techList.slice(0, 4).map((tech, techIndex) => (
                                    <span
                                      key={`${project.id}-tech-${techIndex}`}
                                      className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-300/15 dark:text-emerald-200"
                                    >
                                      {tech}
                                    </span>
                                  ))
                                ) : (
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                    기술 정보 없음
                                  </span>
                                )}
                              </div>

                              <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
                                <div className="flex items-center gap-1">
                                  {demoUrl && (
                                    <a
                                      href={demoUrl}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-blue-300/15 dark:hover:text-blue-200"
                                      onClick={(e) => e.stopPropagation()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`${project.title} 데모 열기`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}
                                  {project.github_url && (
                                    <a
                                      href={project.github_url}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                                      onClick={(e) => e.stopPropagation()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`${project.title} GitHub 열기`}
                                    >
                                      <Github className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                                <Link
                                  href={`/projects/${encodeURIComponent(project.slug)}`}
                                  className="inline-flex min-h-9 items-center rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  상세 보기
                                </Link>
                              </div>
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
            <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/10">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-4">
                함께 프로젝트를 만들어보실래요?
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                새로운 아이디어나 협업 제안을 언제든 환영합니다
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" prefetch={false} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-8 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 active:translate-y-0 dark:bg-emerald-300 dark:text-slate-950 dark:hover:bg-emerald-200">
                  연락하기
                </Link>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-8 text-sm font-bold text-slate-700 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950 active:translate-y-0 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:border-white dark:hover:text-white">
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
