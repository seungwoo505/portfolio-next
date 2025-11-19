'use client';

import Link from "next/link";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

import Head from 'next/head';
import { api } from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';
import ScrollProgress from '@/components/ScrollProgress';
import { generateStructuredData } from '@/lib/seo';

const SKILL_REVEAL_INTERVAL = 80;
const SKILL_REVEAL_STEP = 3;
const EXPERIENCE_REVEAL_INTERVAL = 120;
const INTEREST_REVEAL_INTERVAL = 120;

interface PersonalInfo {
  id?: number;
  full_name?: string;
  title?: string;
  bio?: string;
  about?: string;
  location?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
}

interface Skill {
  id: number;
  name: string;
  proficiency_level: number;
  category_name?: string;
  type?: string;
  category?: string;
}

interface Experience {
  id: number;
  title: string;
  company?: string;
  company_or_institution?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  type: string;
}

interface Interest {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  display_order?: number;
}

export default function AboutPage() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({});
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);
  const [skillRevealCount, setSkillRevealCount] = useState(0);
  const [experienceRevealCount, setExperienceRevealCount] = useState(0);
  const [interestRevealCount, setInterestRevealCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 모든 API 호출을 병렬로 실행
        const [settingsResponse, personalResponse, skillsResponse, experiencesResponse, interestsResponse] = await Promise.all([
          api.get('/settings'),
          api.get('/personal-info'),
          api.get('/skills'),
          api.get('/experiences'),
          api.get('/interests')
        ]);

        // 개인정보 설정 (설정 우선, 개인정보 테이블 백업)
        let settingsPersonalInfo = {};
        const personalTableInfo = personalResponse.data || {};
        
        if (settingsResponse.success && settingsResponse.data) {
          const settings = settingsResponse.data as { [key: string]: string };
          settingsPersonalInfo = {
            full_name: settings.personal_name || settings.intro_name || '',
            title: settings.personal_title || settings.intro_title || '',
            bio: settings.personal_bio || settings.intro_bio || '',
            about: settings.personal_about || settings.intro_about || '',
            location: settings.personal_location || settings.intro_location || '',
            email: settings.personal_email || settings.intro_email || '',
            phone: settings.personal_phone || settings.intro_phone || '',
            avatar_url: settings.personal_avatar_url || settings.intro_avatar_url || '',
            resume_url: settings.personal_resume_url || settings.intro_resume_url || '',
            github_url: settings.personal_github_url || settings.intro_github_url || '',
            linkedin_url: settings.personal_linkedin_url || settings.intro_linkedin_url || '',
            twitter_url: settings.personal_twitter_url || settings.intro_twitter_url || '',
            instagram_url: settings.personal_instagram_url || settings.intro_instagram_url || ''
          };
        }
        
        // 설정 우선, 개인정보 테이블 백업으로 병합 (빈 값은 덮어씌우지 않음)
        const mergedPersonalInfo = { ...personalTableInfo };
        Object.keys(settingsPersonalInfo).forEach(key => {
          const settingsValue = settingsPersonalInfo[key as keyof typeof settingsPersonalInfo] as string;
          if (settingsValue && typeof settingsValue === 'string' && settingsValue.trim() !== '') {
            (mergedPersonalInfo as Record<string, unknown>)[key] = settingsValue;
          }
        });
        setPersonalInfo(mergedPersonalInfo);
        setSkills((skillsResponse.data as { skills?: Skill[] })?.skills ?? []);
        setCategories((skillsResponse.data as { categories?: Category[] })?.categories ?? []);
        
        const mappedExperiences = ((experiencesResponse.data as Experience[]) ?? []).map((exp: Experience) => ({
          ...exp,
          company: exp.company_or_institution
        }));
        setExperiences(mappedExperiences);
        setInterests((interestsResponse.data as Interest[]) ?? []);
        setError(null);
      } catch {
        setError('서버와의 연결에 문제가 발생했습니다.');
        setHasApiError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const skillsByCategory = useMemo(() => {
    return skills.reduce((acc, skill) => {
      const category = skill.category_name || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
  }, [skills]);

  const finalCategoryOrder = useMemo(() => {
    const orderedCategories = [...categories]
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((cat) => cat.name);

    const defaultOrder = ['프론트엔드', '백엔드', '데이터베이스', '기타'];
    const baseOrder = orderedCategories.length > 0 ? orderedCategories : defaultOrder;

    const categoryKeys = Object.keys(skillsByCategory);
    const sorted = baseOrder.filter((name) => skillsByCategory[name]);
    const remaining = categoryKeys.filter((name) => !baseOrder.includes(name));
    return [...sorted, ...remaining];
  }, [categories, skillsByCategory]);

  const totalSkillsCount = skills.length;
  const skillSkeletonCount = Math.max(totalSkillsCount, 1);

  const experienceSkeletonCount = Math.max(experiences.length, 1);

  const technicalInterests = useMemo(
    () => interests.filter((interest) => interest.category === 'technical'),
    [interests]
  );

  const personalInterests = useMemo(
    () => interests.filter((interest) => interest.category === 'personal'),
    [interests]
  );

  const interestSkeletonCount = Math.max(technicalInterests.length + personalInterests.length, 1);

  useEffect(() => {
    if (isLoading || totalSkillsCount === 0) {
      setSkillRevealCount(0);
      return;
    }

    setSkillRevealCount(0);
    const interval = window.setInterval(() => {
      setSkillRevealCount((prev) => {
        const next = Math.min(prev + SKILL_REVEAL_STEP, totalSkillsCount);
        if (next >= totalSkillsCount) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, SKILL_REVEAL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [isLoading, totalSkillsCount]);

  useEffect(() => {
    if (isLoading || experiences.length === 0) {
      setExperienceRevealCount(0);
      return;
    }

    setExperienceRevealCount(0);
    const interval = window.setInterval(() => {
      setExperienceRevealCount((prev) => {
        const next = Math.min(prev + 1, experiences.length);
        if (next === experiences.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, EXPERIENCE_REVEAL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [isLoading, experiences]);

  useEffect(() => {
    const totalInterestCount = technicalInterests.length + personalInterests.length;
    if (isLoading || totalInterestCount === 0) {
      setInterestRevealCount(0);
      return;
    }

    setInterestRevealCount(0);
    const interval = window.setInterval(() => {
      setInterestRevealCount((prev) => {
        const next = Math.min(prev + 1, totalInterestCount);
        if (next === totalInterestCount) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, INTEREST_REVEAL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [isLoading, technicalInterests, personalInterests]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  // 스켈레톤 UI 컴포넌트 - 실제 UI와 유사하게 개선
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
      </div>
      <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-16 ml-5"></div>
    </div>
  );

  const SkeletonSkill = () => (
    <div className="animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20"></div>
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-8"></div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 rounded-full w-3/4 transition-all duration-1000 ease-out relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonExperience = () => (
    <div className="border-l-4 border-slate-300 dark:border-slate-600 pl-6 animate-pulse">
      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-12"></div>
      </div>
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-4/5"></div>
      </div>
    </div>
  );

  const InterestSkeleton = () => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-600 rounded-full" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24" />
      </div>
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16" />
    </div>
  );

  const HeroSkeleton = () => (
    <div className="text-center">
      <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
      <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded w-48 mx-auto mb-4 animate-pulse" />
      <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-96 max-w-full mx-auto mb-8 animate-pulse" />
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-24 animate-pulse" />
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 animate-pulse" />
      </div>
      <div className="flex justify-center gap-4">
        <div className="h-10 bg-slate-300 dark:bg-slate-600 rounded w-24 animate-pulse" />
        <div className="h-10 bg-slate-300 dark:bg-slate-600 rounded w-24 animate-pulse" />
      </div>
    </div>
  );

  const AboutSkeleton = () => (
    <div className="space-y-3">
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full animate-pulse" />
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6 animate-pulse" />
      <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-4/5 animate-pulse" />
    </div>
  );

  // 오류 상태 처리
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <ScrollProgress />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">데이터를 불러올 수 없습니다</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>소개 | 포트폴리오</title>
        <meta name="description" content="웹 개발자에 대해 알아보세요." />
        <meta name="keywords" content="웹개발자, 소개, 이력서" />
        <meta name="author" content="개발자" />
        
        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content="소개 | 포트폴리오" />
        <meta property="og:description" content="웹 개발자에 대해 알아보세요." />
        <meta property="og:url" content="/about" />
        <meta property="og:image" content={personalInfo?.avatar_url || '/og-image.jpg'} />
        <meta property="og:site_name" content="포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="profile:first_name" content="개발자" />
        <meta property="profile:last_name" content="" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="소개 | 포트폴리오" />
        <meta name="twitter:description" content="웹 개발자에 대해 알아보세요." />
        <meta name="twitter:image" content={personalInfo?.avatar_url || '/og-image.jpg'} />
        <meta name="twitter:creator" content="@developer" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="/about" />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData({
              type: 'Person',
              data: {
                name: personalInfo?.full_name || '승우',
                title: personalInfo?.title || '웹 개발자',
                description: personalInfo?.bio || personalInfo?.about || 'React, Next.js, Node.js를 활용한 웹 개발자',
                url: '/about',
                image: personalInfo?.avatar_url,
                github_url: personalInfo?.github_url,
                linkedin_url: personalInfo?.linkedin_url,
                twitter_url: personalInfo?.twitter_url,
                email: personalInfo?.email,
                location: personalInfo?.location,
              }
            }))
          }}
        />
      </Head>
      <DynamicHead pageTitle="소개" />
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <section className="text-center mb-16">
            {isLoading ? (
              <HeroSkeleton />
            ) : (
              <>
                <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300">
                  {personalInfo.avatar_url ? (
                    <Image
                      src={personalInfo.avatar_url}
                      alt={personalInfo.full_name || 'Profile'}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{personalInfo.full_name?.charAt(0) || 'S'}</span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                  {personalInfo.full_name || (hasApiError ? '데이터를 불러올 수 없습니다' : '이름을 입력해주세요')}
                </h1>

                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                  {personalInfo.bio || (hasApiError ? '데이터를 불러올 수 없습니다' : '소개를 입력해주세요')}
                </p>

                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1">
                      📍 {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <span className="flex items-center gap-1">
                      ✉️ {personalInfo.email}
                    </span>
                  )}
                  {personalInfo.phone && (
                    <span className="flex items-center gap-1">
                      📞 {personalInfo.phone}
                    </span>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  {personalInfo.github_url && (
                    <a
                      href={personalInfo.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                  )}
                  {personalInfo.linkedin_url && (
                    <a
                      href={personalInfo.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                  {personalInfo.twitter_url && (
                    <a
                      href={personalInfo.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </section>

          {/* About Me Section */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              자기소개
            </h2>
            {isLoading ? (
              <AboutSkeleton />
            ) : (
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {personalInfo.about || personalInfo.bio || (hasApiError ? '데이터를 불러올 수 없습니다.' : '자기소개를 입력해주세요.')}
                </p>
              </div>
            )}
          </section>

          {/* Skills Section */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              기술 스택
            </h2>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pr-12 md:pr-8">
                {skills.length > 0 ? (
                  (() => {
                    const revealLimit = !isLoading ? Math.min(skillRevealCount, totalSkillsCount) : 0;
                    let revealedIndex = 0;

                    return finalCategoryOrder.map((categoryName, index) => {
                      const categorySkills = skillsByCategory[categoryName] || [];
                      const isLeftColumn = index % 2 === 0;

                      return (
                        <div
                          key={categoryName}
                          className={`flex-shrink-0 w-80 max-w-80 pr-6 ${isLeftColumn ? 'md:justify-self-start' : 'md:justify-self-end'}`}
                        >
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            {categoryName}
                          </h3>
                          <div className="space-y-3">
                            {categorySkills.slice(0, 6).map((skill) => {
                              const isRevealed = !isLoading && revealedIndex < revealLimit;
                              revealedIndex += 1;

                              return (
                                <div key={skill.id}>
                                  {isRevealed ? (
                                    <>
                                      <div className="flex justify-between mb-1">
                                        <span className="text-slate-700 dark:text-slate-300">{skill.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400">{skill.proficiency_level}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-1000 ease-out relative ${
                                            index % 3 === 0
                                              ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                              : index % 3 === 1
                                              ? 'bg-gradient-to-r from-green-500 to-teal-600'
                                              : 'bg-gradient-to-r from-orange-500 to-red-600'
                                          }`}
                                          style={{ width: `${skill.proficiency_level}%` }}
                                        >
                                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <SkeletonSkill />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : isLoading ? (
                  <div className="col-span-full space-y-3">
                    {Array.from({ length: skillSkeletonCount }).map((_, index) => (
                      <SkeletonSkill key={`skill-loading-${index}`} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">기술 스택 정보가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              경험
            </h2>
            
            <div className="space-y-8">
              {experiences.length > 0 ? (
                experiences.map((experience, index) => {
                  const isRevealed = !isLoading && index < experienceRevealCount;
                  return (
                    <div key={experience.id} className="border-l-4 border-blue-500 pl-6">
                      {isRevealed ? (
                        <>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {experience.title}
                          </h3>
                          {experience.company && (
                            <div className="flex items-center gap-2 mt-1 mb-2">
                              <span className="text-slate-600 dark:text-slate-400">{experience.company}</span>
                              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {experience.type === 'work' ? '업무' : '교육'}
                              </span>
                            </div>
                          )}
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : '현재'}
                          </div>
                          {experience.description && (
                            <p className="text-slate-700 dark:text-slate-300">
                              {experience.description}
                            </p>
                          )}
                        </>
                      ) : (
                        <SkeletonExperience />
                      )}
                    </div>
                  );
                })
              ) : isLoading ? (
                Array.from({ length: experienceSkeletonCount }).map((_, index) => (
                  <SkeletonExperience key={`experience-loading-${index}`} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">등록된 경험이 없습니다.</p>
                </div>
              )}
            </div>
          </section>

          {/* Interests Section */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              관심사
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 기술적 관심사 */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">기술적 관심사</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {interests.filter(interest => interest.category === 'technical').length}개 항목
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {interests.filter(interest => interest.category === 'technical').length > 0 ? (
                    interests
                      .filter(interest => interest.category === 'technical')
                      .map((interest) => (
                        <div key={interest.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{interest.title}</span>
                          </div>
                          {interest.description && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {interest.description}
                            </span>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">기술적 관심사가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 개인적 관심사 */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">개인적 관심사</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {interests.filter(interest => interest.category === 'personal').length}개 항목
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {interests.filter(interest => interest.category === 'personal').length > 0 ? (
                    interests
                      .filter(interest => interest.category === 'personal')
                      .map((interest) => (
                        <div key={interest.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{interest.title}</span>
                          </div>
                          {interest.description && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {interest.description}
                            </span>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">개인적 관심사가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center mt-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              함께 일해보실래요?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              새로운 프로젝트나 협업 기회에 열려있습니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                연락하기
              </Link>
              <Link href="/projects" className="px-8 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium">
                프로젝트 보기
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}