"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { blogApi } from "@/lib/api";
import { BlogPost, BlogTag, RawBlogPost, SiteSettings } from "@/types";
import ScrollProgress from "../../components/ScrollProgress";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";
const POST_CARD_REVEAL_INTERVAL = 120;
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
  const [_blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'published_at' | 'created_at' | 'title' | 'view_count'>('published_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postRevealCount, setPostRevealCount] = useState(0);
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
  const postSkeletonCount = useMemo(() => {
    if (filteredPosts.length > 0) {
      return filteredPosts.length;
    }
    if (totalPosts > 0) {
      return Math.max(Math.min(totalPosts, POSTS_PAGE_SIZE), 1);
    }
    return 1;
  }, [filteredPosts, totalPosts]);
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
        const response = await api.get<{ data: SiteSettings }>('/settings');
        setSettings(response.data?.data ?? {});
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
        // 모든 포스트를 한 번에 가져오기 (페이지네이션 없이)
        const [postsResponse, tagsResponse] = await Promise.all([
          blogApi.getPosts({
            limit: 1000, // 충분히 큰 값으로 모든 포스트 가져오기
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
          setTotalPosts(postsWithTags.length);
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

  // 현재 페이지의 포스트 설정
  useEffect(() => {
    setBlogPosts(paginatedPosts);
  }, [paginatedPosts]);
  /**
   * @description 카드가 순차적으로 나타나는 애니메이션을 제어한다.
   * @returns {void}
   */
  useEffect(() => {
    if (loading || filteredPosts.length === 0) {
      setPostRevealCount(0);
      return;
    }
    setPostRevealCount(0);
    const interval = window.setInterval(() => {
      setPostRevealCount((prev) => {
        const next = Math.min(prev + 1, filteredPosts.length);
        if (next === filteredPosts.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, POST_CARD_REVEAL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [loading, filteredPosts]);
  /**
   * @function handlePageChange
   * @description 페이지네이션 이동 시 목록과 스크롤 위치를 갱신한다.
   * @param {number} page 이동할 페이지 번호.
   * @returns {void}
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const PostSkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
        </div>
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded mb-3" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-2/3" />
        </div>
        <div className="flex gap-1 mb-4">
          <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-12" />
          <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-16" />
        </div>
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16" />
      </div>
    </div>
  );
  return (
    <>
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            개발 블로그
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            웹 개발 경험과 새로운 기술에 대한 인사이트를 공유합니다
          </p>
          {settings?.search_enabled !== false && (
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="포스트 검색..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 pl-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="블로그 포스트 검색"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          <div 
            className="flex flex-wrap justify-center gap-2 mb-4"
          >
            <button
              onClick={clearAllTags}
              data-all-posts="true"
              className={`px-4 py-2 text-sm border-2 rounded-lg transition-all duration-200 font-semibold active:scale-95 relative group ${
                selectedTags.length === 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-blue-700 ring-4 ring-blue-200 dark:ring-blue-800/50'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800/50'
              }`}
            >
              모든 포스트
              {selectedTags.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  ↺
                </span>
              )}
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.slug)}
                data-blog-tag="true"
                className={`px-4 py-2 text-sm border-2 rounded-lg transition-all duration-200 font-semibold active:scale-95 relative group ${
                  selectedTags.includes(tag.slug)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-slate-400 hover:border-slate-500 hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 ring-4 ring-blue-200 dark:ring-blue-800/50'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800/50'
                }`}
              >
                {tag.name} {tag.post_count && `(${tag.post_count})`}
                {!selectedTags.includes(tag.slug) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    +
                  </span>
                )}
                {selectedTags.includes(tag.slug) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
        {loading ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              포스트
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: postSkeletonCount }).map((_, index) => (
                <PostSkeletonCard key={`blog-loading-${index}`} />
              ))}
            </div>
          </section>
        ) : error ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              포스트
            </h2>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
                Signal Pending
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">블로그 데이터를 연결하는 중입니다</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-5">
                라이브 서버가 연결되면 최신 개발 기록이 표시됩니다. 지금은 탐색 구조를 먼저 확인할 수 있습니다.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                포스트 ({filteredPosts.length}개)
              </h2>
              <select
                value={sortOrder}
                onChange={(e) => {
                  const newSortOrder = e.target.value as 'published_at' | 'created_at' | 'title' | 'view_count';
                  setSortOrder(newSortOrder);
                  const sortLabels = {
                    'published_at': '발행일순',
                    'created_at': '생성일순',
                    'title': '제목순',
                    'view_count': '조회수순'
                  };
                  toast(`${sortLabels[newSortOrder]}으로 정렬합니다.`, {
                    duration: 1500,
                    icon: '🔄',
                  });
                }}
                className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
              >
                <option value="published_at">발행일순</option>
                <option value="created_at">생성일순</option>
                <option value="title">제목순</option>
                <option value="view_count">조회수순</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.length > 0 ? (
                paginatedPosts.map((post, index) => {
                  const isRevealed = index < postRevealCount;
                  const baseClass = "bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 group";
                  const stateClass = isRevealed
                    ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]"
                    : "cursor-default pointer-events-none";
                  return (
                    <article
                      key={post.id}
                      className={`${baseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/blog/${encodeURIComponent(post.slug)}`) : undefined}
                    >
                      {isRevealed ? (
                        <div className="p-6">
                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <Link
                              href={`/blog/${encodeURIComponent(post.slug)}`}
                              prefetch={false}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm line-clamp-3">
                            {post.excerpt || post.content.substring(0, 120) + '...'}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.slice(0, 3).map((tag) => (
                                <span key={`${post.id}-${tag.id}`} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                                태그 없음
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/blog/${encodeURIComponent(post.slug)}`}
                              prefetch={false}
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              자세히 보기 →
                            </Link>
                            <span className="text-xs text-slate-400">
                              조회 {post.view_count}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <PostSkeletonCard />
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    {searchQuery || selectedTags.length > 0 ? '검색 결과가 없습니다.' : '아직 포스트가 없습니다.'}
                  </p>
                </div>
              )}
            </div>
            {!searchQuery && selectedTags.length === 0 && totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <div className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
                  총 {totalPosts}개의 포스트 중 {((currentPage - 1) * 6) + 1}-{Math.min(currentPage * 6, totalPosts)}번째 포스트
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      </div>
    </>
  );
}
