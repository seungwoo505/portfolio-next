"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { ChevronDown } from "lucide-react";
import ScrollProgress from "@/components/ScrollProgress";
import { personalApi, blogApi, projectApi } from "@/lib/api";
import { BlogPost } from "@/types";
const BLOG_PLACEHOLDER_COUNT = 1;
const PROJECT_PLACEHOLDER_COUNT = 1;
const SKILL_PLACEHOLDER_COUNT = 1;
const CARD_REVEAL_INTERVAL = 120;
const SKILL_REVEAL_INTERVAL = 80;
const SKILL_REVEAL_STEP = 3;
const FALLBACK_PROFILE = {
  name: "승우.dev",
  titleWords: ["웹", "프론트엔드", "개발자"],
  description:
    "Next.js와 TypeScript로 빠르고 안정적인 웹 경험을 만듭니다. 인터랙션, 콘텐츠 구조, 운영 도구까지 하나의 흐름으로 다듬습니다.",
};
const FALLBACK_SKILLS = [
  "Next.js",
  "TypeScript",
  "React",
  "Node.js",
  "UI Engineering",
  "Performance",
  "Accessibility",
  "Admin Tools",
];
const Galaxy = lazy(() => import("./OptimizedGalaxy"));
/**
 * @interface Project
 * @description 홈 화면에 노출되는 프로젝트 정보를 나타냅니다.
 * @property {string} id 프로젝트 고유 식별자.
 * @property {string} title 프로젝트 제목.
 * @property {string} description 카드에 표시할 간단한 요약.
 * @property {string} [detailed_description] 상세 설명.
 * @property {string} [excerpt] 티저용으로 사용할 발췌문.
 * @property {string} [meta_description] 프로젝트용 SEO 최적화 설명.
 * @property {string} slug 네비게이션에 사용할 슬러그.
 * @property {boolean} featured 대표 프로젝트 여부.
 * @property {string} [image_url] 프로젝트 대표 이미지 URL.
 * @property {string} created_at 프로젝트 생성 일시.
 * @property {string[]} [tags] 프로젝트와 연관된 태그 목록.
 * @property {string[]} [skills] 프로젝트에서 강조하는 기술 스택.
 * @property {number} [view_count] 조회수.
 */
interface Project {
  id: string;
  title: string;
  description: string;
  detailed_description?: string;
  excerpt?: string;
  meta_description?: string;
  slug: string;
  featured: boolean;
  image_url?: string;
  created_at: string;
  tags?: string[];
  skills?: string[];
  view_count?: number;
}
/**
 * @interface Skill
 * @description API에서 가져온 단일 기술 정보를 나타냅니다.
 * @property {string} id 기술 고유 식별자.
 * @property {string} name 화면에 표시할 기술명.
 * @property {number} proficiency_level 숙련도를 나타내는 숫자 값.
 * @property {string} [category_name] 기술이 속한 카테고리 이름.
 */
interface Skill {
  id: string;
  name: string;
  proficiency_level: number;
  category_name?: string;
}
/**
 * @interface PersonalInfo
 * @description 히어로 섹션을 구성하는 개인 프로필 정보입니다.
 * @property {string} [full_name] 정식 이름.
 * @property {string} [name] 선호하는 표시 이름.
 * @property {string} [bio] 짧은 소개 문장.
 * @property {string} [about] 확장된 자기소개 내용.
 */
interface PersonalInfo {
  full_name?: string;
  name?: string;
  bio?: string;
  about?: string;
}
/**
 * @interface ClientHomeProps
 * @description 클라이언트 홈 컴포넌트에 전달되는 초기 데이터와 상태 플래그입니다.
 * @property {BlogPost[]} [blogPosts] 미리 불러온 블로그 포스트 목록.
 * @property {Project[]} [projects] 미리 불러온 프로젝트 목록.
 * @property {Skill[]} [skills] 미리 불러온 기술 목록.
 * @property {boolean} [loading] 서버에서 전달된 초기 로딩 상태.
 * @property {string} [error] 페이지 대신 표시할 오류 메시지.
 * @property {PersonalInfo} [personalInfo] 초기 개인 정보 데이터.
 * @property {boolean} [hasError] 서버에서 오류가 감지되었는지 여부.
 */
interface ClientHomeProps {
  blogPosts?: BlogPost[];
  projects?: Project[];
  skills?: Skill[];
  loading?: boolean;
  error?: string;
  personalInfo?: PersonalInfo;
  hasError?: boolean;
}
/**
 * @component ClientHome
 * @description 개인 정보, 대표 프로젝트, 블로그 글, 애니메이션 배경을 결합한 인터랙티브 랜딩 페이지를 렌더링합니다.
 * @param {ClientHomeProps} param0 UI 하이드레이션에 필요한 사전 로딩 데이터와 상태 플래그.
 * @returns {JSX.Element} 퍼블릭 랜딩 페이지에 특화된 콘텐츠를 반환합니다.
 */
export default function ClientHome({ 
  blogPosts: initialBlogPosts = [], 
  projects: initialProjects = [], 
  skills: initialSkills = [], 
  loading: initialLoading = false, 
  error, 
  personalInfo: initialPersonalInfo, 
  hasError: _hasError 
}: ClientHomeProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeSkillTab, setActiveSkillTab] = useState('all');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [loading, setLoading] = useState(initialLoading);
  const [_dataError, setDataError] = useState(false);
  const [blogRevealCount, setBlogRevealCount] = useState(0);
  const [projectRevealCount, setProjectRevealCount] = useState(0);
  const [skillsRevealCount, setSkillsRevealCount] = useState(0);
  useEffect(() => {
    /**
     * @function loadData
     * @description 홈 화면에 표시할 대표 블로그, 프로젝트, 기술 정보를 불러옵니다.
     * @returns {Promise<void>} 데이터 상태 갱신이 완료되면 해결됩니다.
     */
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const [blogResponse, projectResponse, skillsResponse] = await Promise.all([
          blogApi.getPosts({ limit: 2, featured: true }),
          projectApi.getProjects({ limit: 2, featured: true }),
          personalApi.getFeaturedSkills()
        ]);
        if (blogResponse.success && blogResponse.data) {
          setBlogPosts(blogResponse.data);
        }
        if (projectResponse.success && projectResponse.data) {
          setProjects(projectResponse.data as Project[]);
        }
        if (skillsResponse.success && skillsResponse.data) {
          setSkills(skillsResponse.data);
        }
        setLoading(false);
        setDataError(false);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        setDataError(true);
        setLoading(false);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    // 초기 데이터가 없으면 로드
    if (initialBlogPosts.length === 0 && initialProjects.length === 0 && initialSkills.length === 0) {
      loadData();
    } else {
      // 초기 데이터로 먼저 설정 (빠른 렌더링을 위해)
      setBlogPosts(initialBlogPosts);
      setProjects(initialProjects);
      setSkills(initialSkills);
      setIsDataLoading(false);
    }
  }, [initialBlogPosts, initialProjects, initialSkills]);
  
  // 페이지가 포커스를 받을 때 조회수만 조용히 갱신 (깜박임 방지)
  useEffect(() => {
    /**
     * @function updateViewCounts
     * @description 조회수만 조용히 업데이트합니다. 다른 데이터는 변경하지 않습니다.
     * @returns {Promise<void>} 조회수 갱신이 완료되면 해결됩니다.
     */
    const updateViewCounts = async () => {
      try {
        const [blogResponse, projectResponse] = await Promise.all([
          blogApi.getPosts({ limit: 2, featured: true }),
          projectApi.getProjects({ limit: 2, featured: true })
        ]);
        
        // 블로그 포스트 조회수만 업데이트 (깜박임 방지)
        if (blogResponse.success && blogResponse.data && Array.isArray(blogResponse.data)) {
          setBlogPosts(prevPosts => {
            return prevPosts.map(prevPost => {
              const updatedPost = blogResponse.data!.find(p => p.id === prevPost.id);
              // 조회수가 실제로 변경된 경우에만 업데이트
              if (updatedPost && updatedPost.view_count !== prevPost.view_count) {
                return { ...prevPost, view_count: updatedPost.view_count };
              }
              return prevPost;
            });
          });
        }
        
        // 프로젝트 조회수만 업데이트 (깜박임 방지)
        if (projectResponse.success && projectResponse.data && Array.isArray(projectResponse.data)) {
          setProjects(prevProjects => {
            return prevProjects.map(prevProject => {
              const updatedProject = projectResponse.data!.find(p => p.id === prevProject.id);
              // 조회수가 실제로 변경된 경우에만 업데이트
              if (updatedProject && updatedProject.view_count !== prevProject.view_count) {
                return { ...prevProject, view_count: updatedProject.view_count };
              }
              return prevProject;
            });
          });
        }
      } catch (error) {
        console.error('조회수 갱신 실패:', error);
      }
    };
    
    // 페이지가 포커스를 받을 때만 갱신 (너무 자주 호출되지 않도록 디바운스)
    let visibilityTimer: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (visibilityTimer) clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(() => {
          updateViewCounts();
        }, 500); // 500ms 디바운스
      }
    };
    
    let focusTimer: NodeJS.Timeout | null = null;
    const handleFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        updateViewCounts();
      }, 500); // 500ms 디바운스
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      if (focusTimer) clearTimeout(focusTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  useEffect(() => {
    /**
     * @function loadPersonalInfo
     * @description 서버에서 전달되지 않은 경우 개인 프로필 정보를 조회합니다.
     * @returns {Promise<void>} 개인 정보 상태 설정이 완료되면 해결됩니다.
     */
    const loadPersonalInfo = async () => {
      if (!personalInfo || Object.keys(personalInfo).length === 0) {
        try {
          const response = await personalApi.getPersonalInfo();
          if (response.success && response.data) {
            setPersonalInfo(response.data);
          }
        } catch {
          setDataError(true);
        }
      }
    };
    loadPersonalInfo();
  }, [personalInfo]);
  const galaxyProps = useMemo(() => ({
    mouseRepulsion: true,
    mouseInteraction: true,
    density: 1.5,
    glowIntensity: 0.5,
    saturation: 0.8,
    hueShift: 240,
    transparent: true,
    disableAnimation: false,
    speed: 1.0,
  }), []);
  useEffect(() => {
    setIsDataLoading(false);
  }, [blogPosts, projects, skills]);
  const categorizedSkills = useMemo(() => {
    if (!skills || skills.length === 0) return {};
    const categories: { [key: string]: Skill[] } = {};
    skills.forEach(skill => {
      const category = skill.category_name || '기타';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(skill);
    });
    return categories;
  }, [skills]);
  const currentSkills = useMemo(() => {
    if (activeSkillTab === 'all') {
      return skills;
    }
    return categorizedSkills[activeSkillTab] || [];
  }, [activeSkillTab, skills, categorizedSkills]);
  const featuredProjectItems = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects.filter((project) => project.featured);
  }, [projects]);
  const displayName = personalInfo?.full_name || personalInfo?.name || FALLBACK_PROFILE.name;
  const displayDescription = personalInfo?.bio || personalInfo?.about || FALLBACK_PROFILE.description;
  const blogSkeletonCount = blogPosts.length > 0 ? blogPosts.length : BLOG_PLACEHOLDER_COUNT;
  const projectSkeletonCount = featuredProjectItems.length > 0 ? featuredProjectItems.length : PROJECT_PLACEHOLDER_COUNT;
  const skillSkeletonCount = currentSkills.length > 0 ? currentSkills.length : SKILL_PLACEHOLDER_COUNT;
  useEffect(() => {
    if (loading || !blogPosts || blogPosts.length === 0) {
      setBlogRevealCount(0);
      return;
    }
    setBlogRevealCount(0);
    const interval = window.setInterval(() => {
      setBlogRevealCount((prev) => {
        const next = Math.min(prev + 1, blogPosts.length);
        if (next === blogPosts.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, CARD_REVEAL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [loading, blogPosts]);
  useEffect(() => {
    if (loading || featuredProjectItems.length === 0) {
      setProjectRevealCount(0);
      return;
    }
    setProjectRevealCount(0);
    const interval = window.setInterval(() => {
      setProjectRevealCount((prev) => {
        const next = Math.min(prev + 1, featuredProjectItems.length);
        if (next === featuredProjectItems.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, CARD_REVEAL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [loading, featuredProjectItems]);
  useEffect(() => {
    if (loading || !currentSkills || currentSkills.length === 0) {
      setSkillsRevealCount(0);
      return;
    }
    setSkillsRevealCount(0);
    const interval = window.setInterval(() => {
      setSkillsRevealCount((prev) => {
        const next = Math.min(prev + SKILL_REVEAL_STEP, currentSkills.length);
        if (next >= currentSkills.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, SKILL_REVEAL_INTERVAL);
    return () => window.clearInterval(interval);
  }, [loading, currentSkills, activeSkillTab]);
  useEffect(() => {
    /**
     * @function handleMouseMove
     * @description 배경 인터랙션에 활용하기 위해 마우스 좌표를 추적합니다.
     * @param {MouseEvent} e 원본 mousemove 이벤트.
     * @returns {void}
     */
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  /**
   * @component CardSkeletonContent
   * @description 로딩 중 프로젝트/블로그 카드를 대신할 플레이스홀더 콘텐츠를 렌더링합니다.
   * @returns {JSX.Element} 스켈레톤 카드 마크업을 반환합니다.
   */
  const CardSkeletonContent = () => (
    <div className="p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
      </div>
      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4 mb-3" />
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
   * @component SkeletonCard
   * @description 목록 로딩 시 사용할 테두리 있는 스켈레톤 카드를 제공합니다.
   * @returns {JSX.Element} 스켈레톤 카드 컨테이너.
   */
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <CardSkeletonContent />
    </div>
  );
  /**
   * @component SkillSkeletonContent
   * @description 기술 항목 로딩 동안 간단한 스켈레톤 라인을 표시합니다.
   * @returns {JSX.Element} 기술 스켈레톤 마크업.
   */
  const SkillSkeletonContent = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16 mx-auto" />
    </div>
  );
  /**
   * @component SkeletonSkill
   * @description 기술 스켈레톤 콘텐츠를 스타일링된 컨테이너로 감쌉니다.
   * @returns {JSX.Element} 스켈레톤 기술 카드.
   */
  const SkeletonSkill = () => (
    <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
      <SkillSkeletonContent />
    </div>
  );
  const EmptyState = ({
    eyebrow,
    title,
    description,
    href,
    action,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    href?: string;
    action?: string;
  }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {href && action ? (
        <Link
          href={href}
          prefetch={false}
          className="mt-5 inline-flex items-center text-sm font-semibold text-blue-600 transition hover:text-cyan-500 dark:text-blue-300 dark:hover:text-cyan-200"
        >
          {action} →
        </Link>
      ) : null}
    </div>
  );
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <ScrollProgress />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">데이터를 불러올 수 없습니다</h1>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (isDataLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <ScrollProgress />
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black"></div>
          <div className="relative z-10 text-center">
            <div className="h-16 bg-white/30 rounded w-1/3 mx-auto mb-6 animate-pulse"></div>
            <div className="h-8 bg-white/30 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-white/30 rounded w-1/3 mx-auto animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-12 animate-pulse"></div>
              <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-16 animate-pulse"></div>
              <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-20 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <SkeletonSkill key={i} />
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <ScrollProgress />
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black overflow-hidden galaxy-section">
          <div className="w-full h-full relative galaxy-container">
            <Suspense fallback={<div className="w-full h-full bg-black" />}>
              <Galaxy 
                key="galaxy-static" 
                {...galaxyProps} 
              />
            </Suspense>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/20 to-black/90 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
          }}
        />
        <div className="relative z-10 mx-auto max-w-6xl text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
            Galaxy Interface
          </div>
          <div className="mb-7 animate-fade-in-up">
            <h1 className="mx-auto max-w-5xl cursor-pointer text-5xl font-black leading-[0.95] tracking-normal transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.5rem]">
              <span
                className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x"
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                {displayName}
              </span>
            </h1>
            <div className="flex justify-center items-center space-x-4 mt-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500" />
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse-slow" />
              <div className="h-px w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse-slow animation-delay-1000" />
            </div>
          </div>
          <div className="mb-10 animate-fade-in-up">
            <p className="text-xl font-light text-slate-200 sm:text-2xl md:text-3xl">
              {FALLBACK_PROFILE.titleWords.map((word, index) => (
                <span
                  key={word}
                  className={`inline-block mx-2 animate-fade-in-up ${
                    index === 0 ? 'animation-delay-500' : index === 1 ? 'animation-delay-700' : 'animation-delay-900'
                  }`}
                >
                  {word}
                </span>
              ))}
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg md:text-xl animate-fade-in-up animation-delay-1100">
              {displayDescription}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in-up">
            <a
              href="/projects"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              프로젝트 보기
            </a>
            <a
              href="/contact"
              className="px-8 py-3 border-2 border-slate-300 text-slate-300 font-semibold rounded-lg hover:bg-slate-300 hover:text-slate-900 transition-all duration-300 contact-btn active:scale-95"
            >
              연락하기
            </a>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3 animate-fade-in-up">
            {[
              ["Focus", "인터랙션과 콘텐츠가 함께 살아있는 화면"],
              ["Stack", "Next.js, TypeScript, 운영형 관리자 경험"],
              ["Mission", "빠르고 읽기 쉬운 웹 경험 설계"],
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center mt-10 scroll-indicator animate-float">
            <button
              type="button"
              className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center cursor-pointer transition-transform duration-150 hover:scale-110"
              onClick={() => {
                document.querySelector('#latest-content')?.scrollIntoView({
                  behavior: 'smooth'
                });
              }}
            >
              <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse-slow" />
            </button>
            <ChevronDown className="w-4 h-4 text-slate-400 mx-auto mt-2" />
          </div>
          <div className="flex justify-center items-center space-x-6 mt-6 animate-fade-in-up">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow animation-delay-500" />
            <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse-slow animation-delay-1000" />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse-slow animation-delay-1500" />
          </div>
        </div>
      </section>
      <section id="latest-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 overflow-x-hidden">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Signal Notes</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  대표 블로그 포스트
                </h2>
              </div>
              <Link href="/blog" prefetch={false} className="text-blue-600 hover:underline font-medium text-sm">
                모든 포스트 보기 →
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: blogSkeletonCount }).map((_, index) => (
                  <SkeletonCard key={`blog-loading-skeleton-${index}`} />
                ))
              ) : blogPosts && blogPosts.length > 0 ? (
                blogPosts.map((post, index) => {
                  const isRevealed = index < blogRevealCount;
                  const cardBaseClass = "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 group overflow-hidden";
                  const stateClass = isRevealed
                    ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
                    : "cursor-default pointer-events-none";
                  return (
                    <article
                      key={post.id}
                      className={`${cardBaseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/blog/post?slug=${encodeURIComponent(post.slug)}`) : undefined}
                    >
                      {isRevealed ? (
                        <div className="p-6">
                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
                            <span className="text-sm text-slate-400">블로그</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <Link
                              href={`/blog/post?slug=${post.slug}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                            {post.excerpt || post.content.substring(0, 100) + '...'}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags && post.tags.length > 0
                              ? post.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span
                                    key={tag.id || `${tag.name}-${tagIndex}`}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                  >
                                    {typeof tag === 'string' ? tag : tag.name}
                                  </span>
                                ))
                              : null}
                          </div>
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/blog/post?slug=${post.slug}`}
                              className="inline-flex items-center text-blue-600 hover:underline font-medium text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              자세히 보기 →
                            </Link>
                            <span className="text-xs text-slate-400">
                              조회 {post.view_count || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <CardSkeletonContent />
                      )}
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  eyebrow="Content Standby"
                  title="대표 글을 연결하는 중입니다"
                  description="라이브 API가 준비되면 최신 개발 기록이 이 영역에 표시됩니다. 지금은 포트폴리오의 방향과 탐색 흐름을 먼저 확인할 수 있습니다."
                  href="/blog"
                  action="블로그 화면 보기"
                />
              )}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">Mission Archive</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  대표 프로젝트
                </h2>
              </div>
              <Link href="/projects" prefetch={false} className="text-blue-600 hover:underline font-medium text-sm">
                모든 프로젝트 보기 →
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: projectSkeletonCount }).map((_, index) => (
                  <SkeletonCard key={`project-loading-skeleton-${index}`} />
                ))
              ) : featuredProjectItems.length > 0 ? (
                featuredProjectItems.map((project, index) => {
                  const isRevealed = index < projectRevealCount;
                  const cardBaseClass = "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden";
                  const stateClass = isRevealed
                    ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md"
                    : "cursor-default pointer-events-none";
                  return (
                    <article
                      key={project.id}
                      className={`${cardBaseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/projects/detail?slug=${encodeURIComponent(project.slug)}`) : undefined}
                    >
                      {isRevealed ? (
                        <div className="p-6">
                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <time>{project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}</time>
                            <span className="text-sm text-slate-400">프로젝트</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2">
                            {project.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                            {project.excerpt || project.detailed_description || project.description || '프로젝트 설명이 없습니다.'}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.skills && Array.isArray(project.skills) && project.skills.length > 0 ? (
                              project.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                                <span
                                  key={`${project.id}-skill-${skillIndex}`}
                                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : project.tags && Array.isArray(project.tags) && project.tags.length > 0 ? (
                              project.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                <span
                                  key={`${project.id}-tag-${tagIndex}`}
                                  className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/projects/detail?slug=${encodeURIComponent(project.slug)}`}
                              className="inline-flex items-center text-blue-600 hover:underline font-medium text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              자세히 보기 →
                            </Link>
                            <span className="text-xs text-slate-400">
                              조회 {project.view_count || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <CardSkeletonContent />
                      )}
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  eyebrow="Project Standby"
                  title="대표 프로젝트를 연결하는 중입니다"
                  description="프로젝트 데이터가 연결되면 이미지, 기술 스택, 결과 중심의 카드로 보여줍니다. 빈 상태에서도 화면 흐름이 무너지지 않도록 정리했습니다."
                  href="/projects"
                  action="프로젝트 화면 보기"
                />
              )}
            </div>
          </div>
        </div>
      </section>
      <section 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Tool Orbit</p>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            주요 기술 스택
          </h2>
        </div>
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setActiveSkillTab('all')}
              className={`skill-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeSkillTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {Object.keys(categorizedSkills).map((category) => (
              <button
                key={category}
                onClick={() => setActiveSkillTab(category)}
                className={`skill-tab-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSkillTab === category
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 bg-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: skillSkeletonCount }).map((_, index) => (
              <SkeletonSkill key={`skill-loading-${index}`} />
            ))
          ) : currentSkills && currentSkills.length > 0 ? (
            currentSkills.map((skill, index) => {
              const isRevealed = index < skillsRevealCount;
              const baseClass = "p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-all duration-300";
              const stateClass = isRevealed
                ? "cursor-pointer transform hover:-translate-y-1 hover:scale-105"
                : "cursor-default pointer-events-none";
              return (
                <div key={skill.id} className={`${baseClass} ${stateClass}`}>
                  {isRevealed ? (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{skill.name}</span>
                  ) : (
                    <SkillSkeletonContent />
                  )}
                </div>
              );
            })
          ) : (
            FALLBACK_SKILLS.map((skill) => (
              <div
                key={skill}
                className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-center shadow-sm transition hover:-translate-y-1 dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)]"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {skill}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
