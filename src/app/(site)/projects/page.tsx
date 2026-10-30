"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import ScrollProgress from "@/components/ScrollProgress";
import ProjectCoverImage from "@/components/ProjectCoverImage";
import { projectApi, api } from "@/lib/api";
import { Project } from "@/types";
import { AnimatedList } from '@/components/site/AnimatedList';
import Pagination from "@/components/Pagination";
import { scrollToPageStart } from '@/lib/page-scroll';

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
  const [sortOrder, setSortOrder] = useState<'created_at' | 'title' | 'view_count' | 'display_order'>('created_at');
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  /**
   * @function handlePageChange
   * @description 페이지네이션 이동 시 현재 페이지와 스크롤 위치를 업데이트한다.
   * @param {number} page 이동할 페이지 번호.
   * @returns {void}
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToPageStart();
  };
  return (
    <>
      <ScrollProgress />
      <div className="site-container site-section">
        <header className="mb-12 max-w-3xl">
          <p className="section-label">프로젝트</p>
          <h1 className="page-heading mt-4">만들고, 개선해 온 것들.</h1>
          <p className="page-intro mt-6">프로젝트의 목적과 구현 과정, 사용한 기술을 정리했습니다. 각 작업의 상세 내용과 코드를 함께 살펴보세요.</p>
        </header>

        <section aria-label="프로젝트 검색 및 필터" className="mb-10 space-y-5 border-y border-zinc-200 py-6 dark:border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="block w-full sm:max-w-md">
              <span className="mb-2 block text-sm font-medium">프로젝트 검색</span>
              <input type="search" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="제목, 설명으로 검색 (초성 검색 가능)" aria-label="프로젝트 검색" className="field-input w-full" />
            </label>
            <label className="block sm:w-40">
              <span className="mb-2 block text-sm font-medium">정렬</span>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)} className="field-input w-full" aria-label="프로젝트 정렬 방식 선택">
                <option value="created_at">생성일순</option><option value="title">제목순</option><option value="view_count">조회수순</option><option value="display_order">표시순서</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="기술 스택 필터">
            <button type="button" data-all-projects="true" aria-pressed={selectedTechs.length === 0} onClick={() => { setSelectedTechs([]); setCurrentPage(1); }} className="filter-chip">전체</button>
            {availableTechs.map(tech => <button type="button" key={tech} aria-pressed={selectedTechs.includes(tech)} onClick={() => handleTechFilter(tech)} className="filter-chip">{tech}</button>)}
          </div>
        </section>

        <section aria-label="프로젝트 목록" aria-busy={loading}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">프로젝트 <span className="muted-text ml-1 text-sm font-normal">{loading ? '불러오는 중' : `${filteredProjects.length}개`}</span></h2>
            {selectedTechs.length > 0 && <p className="muted-text text-sm">선택한 기술 중 하나를 포함한 프로젝트</p>}
          </div>
          {loading ? (
            <div role="status" className="grid gap-8 md:grid-cols-2"><span className="sr-only">프로젝트를 불러오는 중입니다.</span>{[0, 1].map(index => <div key={index} className="surface-card overflow-hidden motion-safe:animate-pulse"><div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-800" /><div className="space-y-4 p-6"><div className="h-6 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" /></div></div>)}</div>
          ) : error ? (
            <div className="surface-card p-8 sm:p-12" role="alert"><h3 className="text-xl font-semibold">프로젝트를 불러오지 못했습니다.</h3><p className="muted-text mt-3">{error} 잠시 후 다시 시도해 주세요.</p><button type="button" onClick={() => window.location.reload()} className="action-secondary mt-6">다시 시도</button></div>
          ) : filteredProjects.length === 0 ? (
            <div className="surface-card px-6 py-16 text-center"><h3 className="text-lg font-semibold">{searchQuery || selectedTechs.length > 0 ? '검색 결과가 없습니다.' : '아직 프로젝트가 없습니다.'}</h3><p className="muted-text mt-3">{searchQuery || selectedTechs.length > 0 ? '다른 검색어를 입력하거나 기술 필터를 조정해 보세요.' : '프로젝트가 등록되면 이곳에서 확인할 수 있습니다.'}</p></div>
          ) : (
            <AnimatedList items={paginatedProjects.map(project => project.id)} className="grid gap-8 md:grid-cols-2">
              {paginatedProjects.map((project, index) => {
                const techList = project.technologies ? project.technologies.split(',').map(tech => tech.trim()).filter(Boolean) : project.skills?.length ? project.skills.map(skill => typeof skill === 'string' ? skill : skill.name) : project.tags?.map(tag => typeof tag === 'string' ? tag : tag.name) || [];
                const href = `/projects/${encodeURIComponent(project.slug)}`;
                return (
                  <article data-reveal data-layout-id={project.id} data-project-card={project.slug} key={project.id} className="project-card surface-card group flex min-w-0 flex-col overflow-hidden">
                    <Link data-project-link={project.slug} href={href} prefetch={false} aria-label={`${project.title} 상세 보기`} className="block overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                      <ProjectCoverImage transitionKey={project.slug} src={project.featured_image || project.image_url} alt={project.title} className="project-cover aspect-[16/10] w-full rounded-t-[19px]" imageClassName="object-cover" sizes="(min-width: 768px) 536px, 100vw" priority={index < 2} fallbackLabel="대표 이미지가 등록되지 않았습니다." />
                    </Link>
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <div className="muted-text mb-3 flex items-center justify-between gap-3 text-xs"><time dateTime={project.created_at}>{project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : '날짜 미등록'}</time>{project.featured && <span className="font-medium text-teal-700 dark:text-teal-400">대표 프로젝트</span>}</div>
                      <h3 className="text-2xl font-semibold tracking-tight"><Link data-project-link={project.slug} href={href} prefetch={false} className="transition-colors hover:text-teal-700 dark:hover:text-teal-400">{project.title}</Link></h3>
                      <p className="muted-text mt-3 line-clamp-3 text-sm leading-7">{project.excerpt || project.description || project.content_text?.slice(0, 160)}</p>
                      {techList.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{techList.map((tech, techIndex) => <span key={`${tech}-${techIndex}`} className="tag">{tech}</span>)}</div>}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 text-sm dark:border-zinc-800">
                        <Link data-project-link={project.slug} href={href} prefetch={false} className="font-semibold text-teal-700 hover:underline dark:text-teal-400">프로젝트 살펴보기 <span aria-hidden="true">→</span></Link>
                        <span className="muted-text text-xs">조회 {project.view_count || 0}</span>
                      </div>
                      {(project.demo_url || project.project_url || project.github_url) && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">{(project.demo_url || project.project_url) && <a href={project.demo_url || project.project_url} target="_blank" rel="noopener noreferrer" className="muted-text hover:text-teal-700 dark:hover:text-teal-400">프로젝트 링크 ↗</a>}{project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="muted-text hover:text-teal-700 dark:hover:text-teal-400">GitHub ↗</a>}</div>}
                    </div>
                  </article>
                );
              })}
            </AnimatedList>
          )}
          {!loading && !error && totalPages > 1 && <div className="mt-12"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /><p className="muted-text mt-4 text-center text-sm">총 {filteredProjects.length}개의 프로젝트 중 {(currentPage - 1) * PROJECTS_PAGE_SIZE + 1}–{Math.min(currentPage * PROJECTS_PAGE_SIZE, filteredProjects.length)}번째 프로젝트</p></div>}
        </section>
        <section className="mt-20 flex flex-col gap-6 border-t border-zinc-200 pt-10 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div><p className="section-label">함께 일하기</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">나누고 싶은 이야기가 있나요?</h2><p className="muted-text mt-3">프로젝트와 협업에 관한 이야기를 기다립니다.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/contact" prefetch={false} className="action-primary">연락하기</Link><a href={githubUrl} target="_blank" rel="noopener noreferrer" className="action-secondary">GitHub 보기 ↗</a></div>
        </section>
      </div>
    </>
  );
}
