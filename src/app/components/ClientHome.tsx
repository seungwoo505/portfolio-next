"use client";
import Link from "next/link";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import ScrollProgress from "./ScrollProgress";
import { seoApi, personalApi, blogApi, projectApi } from "@/lib/api";
import toast from "react-hot-toast";


import { BlogPost } from "@/types";

const BLOG_PLACEHOLDER_COUNT = 1;
const PROJECT_PLACEHOLDER_COUNT = 1;
const SKILL_PLACEHOLDER_COUNT = 1;
const CARD_REVEAL_INTERVAL = 120;
const SKILL_REVEAL_INTERVAL = 80;
const SKILL_REVEAL_STEP = 3;

// 동적 import로 OptimizedGalaxy 컴포넌트 지연 로딩
const Galaxy = lazy(() => import("./OptimizedGalaxy"));

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

interface Skill {
  id: string;
  name: string;
  proficiency_level: number;
  category_name?: string;
}

interface PersonalInfo {
  full_name?: string;
  name?: string;
  bio?: string;
  about?: string;
}

interface ClientHomeProps {
  blogPosts?: BlogPost[];
  projects?: Project[];
  skills?: Skill[];
  loading?: boolean;
  error?: string;
  personalInfo?: PersonalInfo;
  hasError?: boolean;
}

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
  
  // 클라이언트 사이드 데이터 상태
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [loading, setLoading] = useState(initialLoading);
  const [_dataError, setDataError] = useState(false);
  const [blogRevealCount, setBlogRevealCount] = useState(0);
  const [projectRevealCount, setProjectRevealCount] = useState(0);
  const [skillsRevealCount, setSkillsRevealCount] = useState(0);


  // 클라이언트 사이드에서 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      
      try {
        // 병렬로 데이터 로딩
        const [blogResponse, projectResponse, skillsResponse] = await Promise.all([
          blogApi.getPosts({ limit: 2, featured: true }),
          projectApi.getProjects({ limit: 2, featured: true }),
          personalApi.getFeaturedSkills()
        ]);

        // 블로그 포스트 설정
        if (blogResponse.success && blogResponse.data) {
          setBlogPosts(blogResponse.data);
        }

        // 프로젝트 설정
        if (projectResponse.success && projectResponse.data) {
          setProjects(projectResponse.data as Project[]);
        }

        // 기술 스택 설정
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

    // 초기 데이터가 없는 경우에만 로딩
    if (initialBlogPosts.length === 0 && initialProjects.length === 0 && initialSkills.length === 0) {
      loadData();
    } else {
      setIsDataLoading(false);
    }
  }, [initialBlogPosts.length, initialProjects.length, initialSkills.length]);

  // 개인정보 동적 로딩 (서버에서 빈 객체로 전달된 경우에만 백업 로딩)
  useEffect(() => {
    const loadPersonalInfo = async () => {
      // 서버에서 개인정보를 가져오지 못한 경우에만 클라이언트에서 재시도
      if (!personalInfo || Object.keys(personalInfo).length === 0) {
        try {
          const response = await personalApi.getPersonalInfo();
          
          if (response.success && response.data) {
            // 클라이언트에서 성공적으로 가져온 경우
            setPersonalInfo(response.data);
          } else {
            // 서버에서도 데이터를 가져올 수 없는 경우
            toast.error('개인정보를 불러올 수 없습니다. 서버 상태를 확인해주세요.');
          }
        } catch {
          // API 호출 자체가 실패한 경우
          toast.error('개인정보 서버에 연결할 수 없습니다.');
        }
      }
    };

    // 서버에서 개인정보를 가져오지 못한 경우에만 백업 로딩 실행
    loadPersonalInfo();
  }, [personalInfo]);

  // SEO 설정 동적 업데이트 (최적화: useCallback 사용)
  const updateSeoMetadata = useCallback(async () => {
    try {
      const seoResponse = await seoApi.getSeoSettings();
      if (seoResponse.success && seoResponse.data) {
        const seo = seoResponse.data;
        
        // 페이지 제목 업데이트
        if (seo.seo_title || seo.site_title) {
          document.title = seo.seo_title || seo.site_title || '승우의 포트폴리오 | 프론트엔드 개발자';
        }

        // 메타 설명 업데이트
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', seo.seo_description || seo.site_description || '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.');
        }

        // 메타 키워드 업데이트
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords && seo.seo_keywords) {
          metaKeywords.setAttribute('content', seo.seo_keywords);
        }

        // Open Graph 메타 태그 업데이트
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          ogTitle.setAttribute('content', seo.og_title || seo.seo_title || seo.site_title || '승우의 포트폴리오 | 프론트엔드 개발자');
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
          ogDescription.setAttribute('content', seo.og_description || seo.seo_description || seo.site_description || '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.');
        }

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && seo.og_image) {
          ogImage.setAttribute('content', seo.og_image);
        }

        const ogAlt = document.querySelector('meta[property="og:image:alt"]');
        if (ogAlt && seo.og_alt) {
          ogAlt.setAttribute('content', seo.og_alt);
        }

        // Twitter 카드 메타 태그 업데이트
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
          twitterTitle.setAttribute('content', seo.twitter_title || seo.og_title || seo.seo_title || seo.site_title || '승우의 포트폴리오 | 프론트엔드 개발자');
        }

        const twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (twitterDescription) {
          twitterDescription.setAttribute('content', seo.twitter_description || seo.og_description || seo.seo_description || seo.site_description || '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.');
        }

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage && seo.og_image) {
          twitterImage.setAttribute('content', seo.og_image);
        }

        const twitterUsername = document.querySelector('meta[name="twitter:creator"]');
        if (twitterUsername && seo.twitter_username) {
          twitterUsername.setAttribute('content', seo.twitter_username);
        }

        // Google 인증 코드 업데이트
        const googleVerification = document.querySelector('meta[name="google-site-verification"]');
        if (googleVerification && seo.google_verification && seo.google_verification !== 'your-google-verification-code') {
          googleVerification.setAttribute('content', seo.google_verification);
        }

        // 정규 URL 업데이트
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical && seo.canonical_url) {
          canonical.setAttribute('href', seo.canonical_url);
        }
      }
    } catch {
      // SEO 설정 로딩 실패는 조용히 무시 (사용자 경험에 영향 없음)
    }
  }, []);

  useEffect(() => {
    updateSeoMetadata();
  }, [updateSeoMetadata]);
  


  // 갤럭시 props를 상수로 분리하여 리렌더링 방지
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

  // 데이터 로딩 상태 관리
  useEffect(() => {
    // API 호출이 완료되면 로딩 상태 해제 (데이터가 있든 없든)
    setIsDataLoading(false);
  }, [blogPosts, projects, skills]);

  // 카테고리별 기술 스택 분류
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

  // 현재 활성 탭의 기술 스택
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
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100
      }
    }
  };

  const nameVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 80,
        duration: 0.8
      }
    }
  };

  // 스켈레톤 UI 컴포넌트 - 실제 UI와 유사하게 개선
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

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <CardSkeletonContent />
    </div>
  );

  const SkillSkeletonContent = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16 mx-auto" />
    </div>
  );

  const SkeletonSkill = () => (
    <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-center">
      <SkillSkeletonContent />
    </div>
  );

  // 오류 상태 처리
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

  // 로딩 중일 때 스켈레톤 UI 표시
  if (isDataLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <ScrollProgress />
        
        {/* Hero Section Skeleton */}
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black"></div>
          <div className="relative z-10 text-center">
            <div className="h-16 bg-white/30 rounded w-1/3 mx-auto mb-6 animate-pulse"></div>
            <div className="h-8 bg-white/30 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-white/30 rounded w-1/3 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* Skills Section Skeleton */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
          
          {/* 탭 네비게이션 스켈레톤 */}
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

        {/* Projects Section Skeleton */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/4 mx-auto mb-12 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Blog Section Skeleton */}
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



      {/* Hero Section - Spectacular Name Display with Galaxy Background */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Galaxy Background - Pure Black - 모든 모드에서 검은색 유지 */}
        <div className="absolute inset-0 bg-black overflow-hidden galaxy-section">
          <div className="w-full h-full relative galaxy-container">
            
            
                         {/* Galaxy 컴포넌트만 사용 - 다크 모드 변경 시 강제 리렌더링 */}
            <Suspense fallback={<div className="w-full h-full bg-black" />}>
              <Galaxy 
                key="galaxy-static" 
                {...galaxyProps} 
              />
            </Suspense>
            
            
          </div>
        </div>
        
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-transparent to-slate-900/80 pointer-events-none"></div>
        
        {/* Mouse-following gradient */}
        <motion.div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
          }}
        />

        <motion.div className="relative z-10 text-center px-4 sm:px-6 lg:px-8" variants={itemVariants}>
          {/* Main Name Display */}
          <motion.div className="mb-8" variants={nameVariants}>
            <motion.h1 
              className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tight cursor-pointer"
              whileHover={{ 
                scale: 1.05,
                transition: { type: "spring", stiffness: 300 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span 
                className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                {personalInfo?.full_name || personalInfo?.name || '개인 정보를 불러올 수 없습니다'}
              </motion.span>
            </motion.h1>
            
            {/* Interactive Decorative Elements */}
            <motion.div 
              className="flex justify-center items-center space-x-4 mt-6"
              variants={itemVariants}
            >
              <motion.div 
                className="h-px w-16 bg-gradient-to-r from-transparent to-blue-500"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 1 }}
              />
              <motion.div 
                className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity 
                }}
              />
              <motion.div 
                className="h-px w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 1.5 }}
              />
              <motion.div 
                className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  delay: 1
                }}
              />
            </motion.div>
          </motion.div>

                             {/* Animated Subtitle */}
                   <motion.div className="mb-12" variants={itemVariants}>
                     <motion.p className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-200 mb-4">
                       {["웹", "프론트엔드", "개발자"].map((word, index) => (
                         <motion.span
                           key={word}
                           className="inline-block mx-2"
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{
                             delay: 0.5 + index * 0.1,
                             duration: 0.6,
                             type: "spring" as const,
                             stiffness: 120
                           }}
                         >
                           {word}
                         </motion.span>
                       ))}
                     </motion.p>
                     <motion.p
                       className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       transition={{ delay: 1.2, duration: 0.8 }}
                     >
{personalInfo?.bio || personalInfo?.about || '개인 정보를 불러올 수 없습니다'}
                     </motion.p>
                   </motion.div>

                                      {/* CTA Buttons */}
                   <motion.div 
                     className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
                     variants={itemVariants}
                   >
                     <motion.a
                       href="/projects"
                       className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                     >
                       프로젝트 보기
                     </motion.a>
                     <motion.a
                       href="/contact"
                       className="px-8 py-3 border-2 border-slate-300 text-slate-300 font-semibold rounded-lg hover:bg-slate-300 hover:text-slate-900 transition-all duration-300 contact-btn"
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                     >
                       연락하기
                     </motion.a>
                   </motion.div>

                   {/* Animated Scroll Indicator - 버튼 아래에 자연스럽게 배치 */}
                   <motion.div 
                     className="flex flex-col items-center mt-8 scroll-indicator"
                     animate={{ 
                       y: [0, 10, 0],
                       opacity: 1 
                     }}
                     initial={{ opacity: 0 }}
                     transition={{ 
                       y: { duration: 2, repeat: Infinity },
                       opacity: { delay: 2, duration: 0.8 }
                     }}
                   >
                     <motion.div 
                       className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center cursor-pointer"
                       whileHover={{ scale: 1.1 }}
                       onClick={() => {
                         document.querySelector('#latest-content')?.scrollIntoView({ 
                           behavior: 'smooth' 
                         });
                       }}
                     >
                       <motion.div 
                         className="w-1 h-3 bg-slate-400 rounded-full mt-2"
                         animate={{ 
                           opacity: [0.5, 1, 0.5],
                           scale: [1, 1.2, 1]
                         }}
                         transition={{ 
                           duration: 1.5, 
                           repeat: Infinity 
                         }}
                       />
                     </motion.div>
                     <ChevronDown className="w-4 h-4 text-slate-400 mx-auto mt-2" />
                   </motion.div>
                   
                   {/* 추가 인터랙티브 요소 */}
                   <motion.div 
                     className="flex justify-center items-center space-x-6 mt-6"
                     variants={itemVariants}
                   >
                     <motion.div 
                       className="w-2 h-2 rounded-full bg-blue-400"
                       animate={{ 
                         scale: [1, 1.5, 1],
                         opacity: [0.5, 1, 0.5]
                       }}
                       transition={{ 
                         duration: 1.5, 
                         repeat: Infinity,
                         delay: 0.5
                       }}
                     />
                     <motion.div 
                       className="w-1 h-1 rounded-full bg-purple-400"
                       animate={{ 
                         scale: [1, 2, 1],
                         opacity: [0.3, 1, 0.3]
                       }}
                       transition={{ 
                         duration: 2, 
                         repeat: Infinity,
                         delay: 1
                       }}
                     />
                     <motion.div 
                       className="w-2 h-2 rounded-full bg-pink-400"
                       animate={{ 
                         scale: [1, 1.5, 1],
                         opacity: [0.5, 1, 0.5]
                       }}
                       transition={{ 
                         duration: 1.5, 
                         repeat: Infinity,
                         delay: 1.5
                       }}
                     />
                   </motion.div>
                 </motion.div>
      </motion.section>

      {/* Latest Blog Posts & Projects */}
      <section id="latest-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 overflow-x-hidden">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* 블로그 포스트 */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                대표 블로그 포스트
              </h2>
              <Link href="/blog" className="text-blue-600 hover:underline font-medium text-sm">
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
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    아직 블로그 포스트가 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 프로젝트 */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                대표 프로젝트
              </h2>
              <Link href="/projects" className="text-blue-600 hover:underline font-medium text-sm">
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
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    아직 대표 프로젝트가 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
          주요 기술 스택
        </h2>
        
        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setActiveSkillTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeSkillTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {Object.keys(categorizedSkills).map((category) => (
              <button
                key={category}
                onClick={() => setActiveSkillTab(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeSkillTab === category
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
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
            <div className="col-span-full text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {activeSkillTab === 'all' 
                  ? '기술 스택 정보를 불러올 수 없습니다.'
                  : `${activeSkillTab} 카테고리에 기술 스택이 없습니다.`
                }
              </p>
            </div>
          )}
        </div>
      </section>


    </div>
  );
}
