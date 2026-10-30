"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { blogApi } from "@/lib/api";
import { BlogPost, BlogTag, RawBlogPost, SiteSettings } from "@/types";
import ScrollProgress from "@/components/ScrollProgress";
import { api } from "@/lib/api";
import { AnimatedList } from '@/components/site/AnimatedList';
import Pagination from "@/components/Pagination";
import { scrollToPageStart } from '@/lib/page-scroll';

const POSTS_PAGE_SIZE = 6;

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
 * @component Blog
 * @description 블로그 메인 페이지를 렌더링하고 포스트 검색, 필터링, 페이지네이션을 처리한다.
 * @returns {JSX.Element} 렌더링된 블로그 페이지 컴포넌트.
 */
export default function Blog() {

  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'published_at' | 'created_at' | 'title' | 'view_count'>('published_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]); // 모든 포스트 저장

  // 프론트엔드에서 검색, 필터, 정렬, 페이지네이션 처리
  const filteredPosts = useMemo(() => {
    let filtered = [...allPosts];

    // 검색어 필터링 (대소문자 구분 없음, 초성 검색 포함)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter(post =>
        matchesSearch(post.title, query) ||
        matchesSearch(post.excerpt, query) ||
        matchesSearch(post.content, query) ||
        matchesSearch(post.meta_description, query)
      );
    }

    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => {
        const postTagSlugs = post.tags?.map(tag => typeof tag === 'string' ? tag : tag.slug) || [];
        return selectedTags.some(selectedSlug => postTagSlugs.includes(selectedSlug));
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'title':
          return a.title.localeCompare(b.title, 'ko');
        case 'view_count':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'published_at':
        default:
          const aDate = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime();
          const bDate = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime();
          return bDate - aDate;
      }
    });

    return filtered;
  }, [allPosts, searchQuery, selectedTags, sortOrder]);

  // 페이지네이션된 포스트
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PAGE_SIZE;
    const endIndex = startIndex + POSTS_PAGE_SIZE;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage]);

  /**
   * @description 사이트 설정 정보를 가져와 페이지 메타 정보에 반영한다.
   * @returns {void}
   */
  useEffect(() => {
    /**
     * @function fetchSettings
     * @description 사이트 설정 정보를 가져와 페이지 메타 데이터에 반영한다.
     * @returns {Promise<void>} 설정 로딩이 완료되면 해결되는 프로미스.
     */
    const fetchSettings = async () => {
      try {
        const response = await api.get<SiteSettings>('/settings');
        setSettings(response.data ?? {});
      } catch {
      }
    };
    fetchSettings();
  }, []);
  /**
   * @description 블로그 포스트와 태그 데이터를 초기에 한 번만 가져온다.
   * @returns {Promise<void>} 비동기 데이터 패치 결과
   */
  useEffect(() => {
    /**
     * @function fetchData
     * @description 모든 블로그 포스트와 태그 데이터를 한 번에 가져와 상태를 갱신한다.
     * @returns {Promise<void>} 데이터 패치가 완료되면 해결되는 프로미스.
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsResponse, tagsResponse] = await Promise.all([
          blogApi.getAllPosts({
            sort: 'published_at',
            order: 'desc'
          }),
          blogApi.getTags(true)
        ]);
        if (postsResponse.success && postsResponse.data) {
          const postsWithTags: BlogPost[] = (postsResponse.data as RawBlogPost[]).map((post) => {
            if (post.tags && Array.isArray(post.tags)) {
              const mappedTags: BlogTag[] = post.tags.map((tagItem) => {
                if (typeof tagItem === 'string') {
                  const foundTag = (tagsResponse.data ?? []).find((tag: BlogTag) => tag.name === tagItem);
                  return foundTag || { id: tagItem, name: tagItem, slug: tagItem } as BlogTag;
                }
                return tagItem;
              });
              return { ...post, tags: mappedTags } as BlogPost;
            }
            return post as BlogPost;
          });
          setAllPosts(postsWithTags);

          setError(null);
        } else {
          setError('블로그 포스트를 불러올 수 없습니다.');
        }
        if (tagsResponse.success && tagsResponse.data) {
          const blogTags = tagsResponse.data.filter((tag: BlogTag) =>
            tag.type === 'blog' || tag.type === 'general'
          );
          setTags(blogTags);
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
    const total = Math.ceil(filteredPosts.length / POSTS_PAGE_SIZE);
    setTotalPages(total || 1);
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredPosts, currentPage]);

  /**
   * @function handlePageChange
   * @description 페이지네이션 이동 시 목록과 스크롤 위치를 갱신한다.
   * @param {number} page 이동할 페이지 번호.
   * @returns {void}
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToPageStart();
  };
  /**
   * @function handleSearch
   * @description 검색어 입력에 따라 포스트 목록을 다시 조회한다.
   * @param {string} query 검색어.
   * @returns {void}
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, []);
  /**
   * @function handleTagToggle
   * @description 태그 선택 또는 해제 시 필터 목록을 업데이트한다.
   * @param {string} tagSlug 토글할 태그 슬러그.
   * @returns {void}
   */
  const handleTagToggle = useCallback((tagSlug: string) => {
    setSelectedTags(prev => {
      const isCurrentlySelected = prev.includes(tagSlug);
      const newTags = isCurrentlySelected
        ? prev.filter(slug => slug !== tagSlug)
        : [...prev, tagSlug];
      const tagName = tags.find(tag => tag.slug === tagSlug)?.name || tagSlug;
      if (isCurrentlySelected) {
        toast(`"${tagName}" 태그를 해제했습니다.`, {
          duration: 1500,
          icon: '🏷️',
        });
      } else {
        toast(`"${tagName}" 태그를 선택했습니다.`, {
          duration: 1500,
          icon: '🏷️',
        });
      }
      return newTags;
    });
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동 (검색어는 유지)
  }, [tags]);
  const clearAllTags = useCallback(() => {
    setSelectedTags([]);
    setCurrentPage(1);
    toast('모든 태그 필터를 해제했습니다.', {
      duration: 1500,
      icon: '🧹',
    });
  }, []);
  return (
    <>
      <ScrollProgress />
      <div className="site-container site-section">
        <header className="mb-12 max-w-3xl"><p className="section-label">개발 기록</p><h1 className="page-heading mt-4">배운 것과 해결한 일의 기록.</h1><p className="page-intro mt-6">개발하며 마주한 문제와 고민, 그 과정에서 배운 내용을 차곡차곡 남깁니다.</p></header>
        <section aria-label="블로그 검색 및 필터" className="mb-10 space-y-5 border-y border-zinc-200 py-6 dark:border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {(settings.enable_search ?? settings.search_enabled) !== false && <label className="block w-full sm:max-w-md"><span className="mb-2 block text-sm font-medium">글 검색</span><input type="search" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="제목, 내용으로 검색 (초성 검색 가능)" aria-label="블로그 포스트 검색" className="field-input w-full" /></label>}
            <label className="block sm:ml-auto sm:w-40"><span className="mb-2 block text-sm font-medium">정렬</span><select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)} aria-label="블로그 정렬 방식 선택" className="field-input w-full"><option value="published_at">발행일순</option><option value="created_at">생성일순</option><option value="title">제목순</option><option value="view_count">조회수순</option></select></label>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="블로그 태그 필터"><button type="button" onClick={clearAllTags} data-all-posts="true" aria-pressed={selectedTags.length === 0} className="filter-chip">모든 포스트</button>{tags.map(tag => <button type="button" key={tag.id} onClick={() => handleTagToggle(tag.slug)} data-blog-tag="true" aria-pressed={selectedTags.includes(tag.slug)} className="filter-chip">{tag.name}{tag.post_count ? ` (${tag.post_count})` : ''}</button>)}</div>
        </section>
        <section aria-label="블로그 목록" aria-busy={loading}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">포스트 <span className="muted-text ml-1 text-sm font-normal">{loading ? '불러오는 중' : `${filteredPosts.length}개`}</span></h2>{selectedTags.length > 0 && <p className="muted-text text-sm">선택한 태그 중 하나를 포함한 글</p>}</div>
          {loading ? <div role="status" className="divide-y divide-zinc-200 dark:divide-zinc-800"><span className="sr-only">포스트를 불러오는 중입니다.</span>{[0, 1, 2].map(index => <div key={index} className="space-y-4 py-9 motion-safe:animate-pulse"><div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-6 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" /><div className="h-4 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" /></div>)}</div> : error ? <div className="surface-card p-8 sm:p-12" role="alert"><h3 className="text-xl font-semibold">글을 불러오지 못했습니다.</h3><p className="muted-text mt-3">{error} 잠시 후 다시 시도해 주세요.</p><button type="button" onClick={() => window.location.reload()} className="action-secondary mt-6">다시 시도</button></div> : paginatedPosts.length > 0 ? (
            <AnimatedList items={paginatedPosts.map(post => post.id)} className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedPosts.map(post => (
                <article data-reveal data-layout-id={post.id} key={post.id} className="group grid min-w-0 gap-4 py-9 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[190px_minmax(0,1fr)]">
                  <div className="muted-text text-sm"><time dateTime={post.published_at || post.created_at}>{new Date(post.published_at || post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time><div className="mt-2 hidden h-5 border-l border-zinc-200 sm:block dark:border-zinc-800" /></div>
                  <div className="max-w-[720px]"><h3 className="text-xl font-semibold tracking-tight sm:text-2xl"><Link href={`/blog/${encodeURIComponent(post.slug)}`} prefetch={false} className="transition-colors hover:text-teal-700 dark:hover:text-teal-400">{post.title}</Link></h3><p className="muted-text mt-3 line-clamp-3 text-sm leading-7">{post.excerpt || post.meta_description || post.content_text?.slice(0, 180) || post.content.substring(0, 120)}</p>
                    {post.tags && post.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{post.tags.slice(0, 3).map(tag => <span key={`${post.id}-${tag.id}`} className="tag">{tag.name}</span>)}</div>}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Link href={`/blog/${encodeURIComponent(post.slug)}`} prefetch={false} className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">글 읽기 <span aria-hidden="true">→</span></Link><span className="muted-text text-xs">{post.read_time_minutes ? `${post.read_time_minutes}분 읽기 · ` : ''}조회 {post.view_count ?? 0}</span></div>
                  </div>
                </article>
              ))}
            </AnimatedList>
          ) : <div className="surface-card px-6 py-16 text-center"><h3 className="text-lg font-semibold">{searchQuery || selectedTags.length > 0 ? '검색 결과가 없습니다.' : '아직 포스트가 없습니다.'}</h3><p className="muted-text mt-3">{searchQuery || selectedTags.length > 0 ? '다른 검색어를 입력하거나 태그 필터를 조정해 보세요.' : '새로운 개발 기록이 등록되면 이곳에서 확인할 수 있습니다.'}</p></div>}
          {!loading && !error && totalPages > 1 && <div className="mt-10 border-t border-zinc-200 pt-10 dark:border-zinc-800"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /><p className="muted-text mt-4 text-center text-sm">총 {filteredPosts.length}개의 포스트 중 {(currentPage - 1) * POSTS_PAGE_SIZE + 1}–{Math.min(currentPage * POSTS_PAGE_SIZE, filteredPosts.length)}번째 포스트</p></div>}
        </section>
      </div>
    </>
  );
}
