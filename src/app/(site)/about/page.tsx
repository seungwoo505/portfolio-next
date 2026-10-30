'use client';
import Link from "next/link";
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { api, personalApi } from '@/lib/api';
import ScrollProgress from '@/components/ScrollProgress';
import { AboutPersonalInfo, AboutSkill, AboutExperience, AboutInterest, AboutCategory } from '@/types';



const FALLBACK_ABOUT_PROFILE: AboutPersonalInfo = {
  full_name: '승우.dev',
  title: '웹 프론트엔드 개발자',
  bio: 'Next.js와 TypeScript로 빠르고 안정적인 웹 경험을 설계합니다.',
  about:
    '인터랙션, 콘텐츠 구조, 운영 도구가 하나의 흐름으로 이어지는 웹 서비스를 지향합니다. 사용자가 정보를 빠르게 이해할 수 있는 구조를 중요하게 봅니다.',
};
const FALLBACK_ABOUT_SKILLS: AboutSkill[] = [
  { id: 1, name: 'Next.js', proficiency_level: 90, category_name: '프론트엔드' },
  { id: 2, name: 'TypeScript', proficiency_level: 88, category_name: '프론트엔드' },
  { id: 3, name: 'React', proficiency_level: 90, category_name: '프론트엔드' },
  { id: 4, name: 'Node.js', proficiency_level: 82, category_name: '백엔드' },
  { id: 5, name: 'API Integration', proficiency_level: 84, category_name: '백엔드' },
  { id: 6, name: 'UI Engineering', proficiency_level: 86, category_name: '기타' },
];
/**
 * @component AboutPage
 * @description 개인 소개, 기술 스택, 경력, 관심사를 보여주는 소개 페이지를 렌더링한다.
 * @returns {JSX.Element} 소개 페이지 컴포넌트.
 */
export default function AboutPage() {
  const [personalInfo, setPersonalInfo] = useState<AboutPersonalInfo>({});
  const [skills, setSkills] = useState<AboutSkill[]>([]);
  const [categories, setCategories] = useState<AboutCategory[]>([]);
  const [experiences, setExperiences] = useState<AboutExperience[]>([]);
  const [interests, setInterests] = useState<AboutInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);


  useEffect(() => {
    /**
     * @function fetchData
     * @description 개인 정보, 기술, 경력, 관심사를 동시에 로드하여 상태를 갱신한다.
     * @returns {Promise<void>} 데이터 로딩 작업.
     */
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [settingsResponse, personalResponse, skillsResponse, experiencesResponse, interestsResponse] = await Promise.all([
          api.get('/settings'),
          personalApi.getPersonalInfo(),
          api.get('/skills'),
          personalApi.getExperiencesTimeline(),
          api.get('/interests')
        ]);
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
        const mergedPersonalInfo = { ...personalTableInfo };
        Object.keys(settingsPersonalInfo).forEach(key => {
          const settingsValue = settingsPersonalInfo[key as keyof typeof settingsPersonalInfo] as string;
          if (settingsValue && typeof settingsValue === 'string' && settingsValue.trim() !== '') {
            (mergedPersonalInfo as Record<string, unknown>)[key] = settingsValue;
          }
        });
        setPersonalInfo(mergedPersonalInfo);
        setSkills((skillsResponse.data as { skills?: AboutSkill[] })?.skills ?? []);
        setCategories((skillsResponse.data as { categories?: AboutCategory[] })?.categories ?? []);
        const mappedExperiences = ((experiencesResponse.data as AboutExperience[]) ?? []).map((exp: AboutExperience) => ({
          ...exp,
          company: exp.company_or_institution
        }));
        setExperiences(mappedExperiences);
        setInterests((interestsResponse.data as AboutInterest[]) ?? []);
        setError(null);
      } catch {
        setPersonalInfo(FALLBACK_ABOUT_PROFILE);
        setSkills(FALLBACK_ABOUT_SKILLS);
        setCategories([]);
        setExperiences([]);
        setInterests([]);
        setError(null);
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
    }, {} as Record<string, AboutSkill[]>);
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
  const formatDate = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  const socialLinks = [
    { label: 'GitHub', href: personalInfo.github_url },
    { label: 'LinkedIn', href: personalInfo.linkedin_url },
    { label: 'Twitter', href: personalInfo.twitter_url },
  ];
  return (
    <>
      <ScrollProgress />
      <div className="site-container site-section" aria-busy={isLoading}>
        <header className="max-w-3xl">
          <p className="section-label">소개</p>
          {isLoading ? <div role="status" className="mt-6 space-y-4"><p className="muted-text">소개를 불러오는 중입니다.</p><div className="h-12 w-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" /></div> : <>
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-3xl font-semibold text-teal-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-teal-400">
                {personalInfo.avatar_url ? <Image src={personalInfo.avatar_url} alt={personalInfo.full_name || '프로필'} width={80} height={80} className="h-full w-full object-cover" /> : <span>{personalInfo.full_name?.charAt(0) || 'S'}</span>}
              </div>
              <div className="min-w-0">
                {personalInfo.title && <p className="mb-2 text-sm font-medium text-teal-700 dark:text-teal-400">{personalInfo.title}</p>}
                <h1 className="page-heading break-words">{personalInfo.full_name || '소개'}</h1>
              </div>
            </div>
            <p className="page-intro mt-7 whitespace-pre-wrap">{personalInfo.bio || '아직 등록된 소개가 없습니다.'}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm muted-text">
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.email && <a className="hover:text-teal-600 dark:hover:text-teal-400" href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">{socialLinks.filter(link => link.href).map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="action-secondary">{link.label}<span aria-hidden="true"> ↗</span></a>)}</div>
          </>}
        </header>
        {hasApiError && <p role="status" className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">서버에 연결할 수 없어 기본 소개와 기술 정보를 표시합니다. 최신 경력은 잠시 후 다시 확인해 주세요.</p>}
        {error && <p role="alert" className="mt-8 text-red-600 dark:text-red-400">{error}<button className="action-secondary ml-4" onClick={() => window.location.reload()}>다시 시도</button></p>}
        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="about-story">
              <h2 id="about-story" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">일하는 방식</h2>
              <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-zinc-600 dark:text-zinc-400">{isLoading ? '소개를 불러오는 중입니다.' : personalInfo.about || personalInfo.bio || '아직 등록된 자기소개가 없습니다.'}</p>
            </section>
            <section aria-labelledby="about-experience">
              <h2 id="about-experience" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">경력과 경험</h2>
              {isLoading ? <p className="mt-5 muted-text">경험을 불러오는 중입니다.</p> : experiences.length ? <ol className="mt-7 space-y-9 border-l border-zinc-200 pl-6 dark:border-zinc-800">
                {experiences.map(experience => <li key={experience.id} className="relative">
                  <span className="absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-600 dark:border-zinc-950 dark:bg-teal-400" aria-hidden="true" />
                  <p className="text-xs font-medium tabular-nums muted-text">{formatDate(experience.start_date)} — {experience.end_date ? formatDate(experience.end_date) : '현재'}</p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{experience.title}</h3>
                  {experience.company && <p className="mt-2 flex flex-wrap items-center gap-3 text-sm muted-text">{experience.company}<span className="tag">{experience.type === 'work' ? '업무' : '교육'}</span></p>}
                  {experience.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-600 dark:text-zinc-400">{experience.description}</p>}
                </li>)}
              </ol> : <p className="mt-5 muted-text">등록된 경험이 없습니다.</p>}
            </section>
          </div>
          <aside className="min-w-0 space-y-8">
            <section className="surface-card p-6" aria-labelledby="about-skills">
              <h2 id="about-skills" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">기술 스택</h2>
              {isLoading ? <p className="mt-4 text-sm muted-text">기술 정보를 불러오는 중입니다.</p> : skills.length ? <div className="mt-6 space-y-6">{finalCategoryOrder.map(category => <div key={category}>
                <h3 className="text-xs font-medium muted-text">{category}</h3>
                <ul className="mt-3 space-y-3">{(skillsByCategory[category] || []).map(skill => <li key={skill.id} className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium text-zinc-700 dark:text-zinc-300">{skill.name}</span><span className="text-xs tabular-nums muted-text" title="등록된 숙련도">{skill.proficiency_level}%</span></li>)}</ul>
              </div>)}</div> : <p className="mt-4 text-sm muted-text">기술 스택 정보가 없습니다.</p>}
            </section>
            <section className="surface-card p-6" aria-labelledby="about-interests">
              <h2 id="about-interests" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">관심사</h2>
              {(['technical', 'personal'] as const).map(category => {
                const items = interests.filter(interest => interest.category === category);
                return <div key={category} className="mt-6"><h3 className="text-xs font-medium muted-text">{category === 'technical' ? '기술적 관심사' : '개인적 관심사'}</h3>
                  {items.length ? <ul className="mt-3 space-y-4">{items.map(interest => <li key={interest.id}><p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{interest.title}</p>{interest.description && <p className="mt-1 text-sm leading-6 muted-text">{interest.description}</p>}</li>)}</ul> : <p className="mt-3 text-sm muted-text">{isLoading ? '불러오는 중입니다.' : '등록된 관심사가 없습니다.'}</p>}
                </div>;
              })}
            </section>
          </aside>
        </div>
        <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800"><h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">함께 이야기해요.</h2><p className="mt-3 muted-text">프로젝트와 협업에 관한 이야기를 기다립니다.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" prefetch={false} className="action-primary">연락하기</Link><Link href="/projects" prefetch={false} className="action-secondary">프로젝트 보기</Link></div></section>
      </div>
    </>
  );
}
