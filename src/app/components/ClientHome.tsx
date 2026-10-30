"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ScrollProgress from "@/components/ScrollProgress";
import { Container } from "@/components/site/Container";
import { blogApi, personalApi, projectApi } from "@/lib/api";
import type { BlogPost } from "@/types";
import HomeHeroSection from "./home/HomeHeroSection";
import { HomeFeaturedProjects, HomeLatestArticles } from "./home/HomeLatestContent";
import HomeSkillsSection from "./home/HomeSkillsSection";
import { HomeErrorState, HomeLoadingState } from "./home/HomeStateViews";
import { FALLBACK_PROFILE } from "./home/homeFallbacks";
import type { ClientHomeProps, HomeProject, HomeSkill } from "./home/homeTypes";

const VIEW_COUNT_REFRESH_INTERVAL_MS = 60_000;

export default function ClientHome({ blogPosts: initialBlogPosts = [], projects: initialProjects = [], skills: initialSkills = [], loading: initialLoading = false, error, personalInfo: initialPersonalInfo }: ClientHomeProps) {
  const [activeSkillTab, setActiveSkillTab] = useState('all');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [projects, setProjects] = useState<HomeProject[]>(initialProjects);
  const [skills, setSkills] = useState<HomeSkill[]>(initialSkills);
  const [loading, setLoading] = useState(initialLoading);
  const lastRefreshAt = useRef(0);
  const refreshing = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [blogs, work, tools] = await Promise.all([blogApi.getPosts({ limit: 2, featured: true }), projectApi.getProjects({ limit: 2, featured: true }), personalApi.getFeaturedSkills()]);
        if (!active) return;
        if (blogs.success && blogs.data) setBlogPosts(blogs.data);
        if (work.success && work.data) setProjects(work.data as HomeProject[]);
        if (tools.success && tools.data) setSkills(tools.data);
      } catch { /* Keep the server data and empty-state UI available. */ }
      finally { if (active) { setLoading(false); setIsDataLoading(false); } }
    }
    if (!initialBlogPosts.length && !initialProjects.length && !initialSkills.length) loadData();
    else { setBlogPosts(initialBlogPosts); setProjects(initialProjects); setSkills(initialSkills); setIsDataLoading(false); }
    return () => { active = false; };
  }, [initialBlogPosts, initialProjects, initialSkills]);

  useEffect(() => {
    let active = true;
    if (!personalInfo || !Object.keys(personalInfo).length) personalApi.getPersonalInfo().then(response => { if (active && response.success && response.data) setPersonalInfo(response.data); }).catch(() => {});
    return () => { active = false; };
  }, [personalInfo]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function updateViewCounts() {
      if (refreshing.current || Date.now() - lastRefreshAt.current < VIEW_COUNT_REFRESH_INTERVAL_MS) return;
      refreshing.current = true;
      lastRefreshAt.current = Date.now();
      try {
        const [blogs, work] = await Promise.all([blogApi.getPosts({ limit: 2, featured: true }), projectApi.getProjects({ limit: 2, featured: true })]);
        if (!active) return;
        if (blogs.success && Array.isArray(blogs.data)) setBlogPosts(previous => previous.map(item => { const fresh = blogs.data!.find(post => post.id === item.id); return fresh ? { ...item, view_count: fresh.view_count } : item; }));
        if (work.success && Array.isArray(work.data)) setProjects(previous => previous.map(item => { const fresh = work.data!.find(project => project.id === item.id); return fresh ? { ...item, view_count: fresh.view_count } : item; }));
      } catch { /* A view count refresh does not replace visible content. */ }
      finally { refreshing.current = false; }
    }
    function scheduleRefresh() { if (document.hidden) return; clearTimeout(timer); timer = setTimeout(updateViewCounts, 500); }
    document.addEventListener('visibilitychange', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);
    return () => { active = false; clearTimeout(timer); document.removeEventListener('visibilitychange', scheduleRefresh); window.removeEventListener('focus', scheduleRefresh); };
  }, []);

  const categorizedSkills = useMemo(() => skills.reduce<Record<string, HomeSkill[]>>((groups, skill) => { const category = skill.category_name || '기타'; (groups[category] ||= []).push(skill); return groups; }, {}), [skills]);
  const currentSkills = activeSkillTab === 'all' ? skills : categorizedSkills[activeSkillTab] || [];
  const featuredProjects = projects.filter(project => project.featured);
  if (error) return <HomeErrorState />;
  if (isDataLoading) return <HomeLoadingState />;

  return <div>
    <ScrollProgress />
    <HomeHeroSection displayName={personalInfo?.full_name || personalInfo?.name || FALLBACK_PROFILE.name} displayDescription={personalInfo?.bio || personalInfo?.about || FALLBACK_PROFILE.description} titleWords={FALLBACK_PROFILE.titleWords} />
    <HomeFeaturedProjects loading={loading} projects={featuredProjects} />
    <HomeSkillsSection loading={loading} activeSkillTab={activeSkillTab} setActiveSkillTab={setActiveSkillTab} categorizedSkills={categorizedSkills} currentSkills={currentSkills} />
    <HomeLatestArticles loading={loading} posts={blogPosts} />
    <Container className="pb-16 sm:pb-24"><div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-7 sm:flex-row sm:items-center sm:p-10 dark:border-zinc-800 dark:bg-zinc-800/40"><div><p className="section-label">연락하기</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">함께 이야기 나눠요.</h2><p className="muted-text mt-3 text-sm leading-7">프로젝트에 대한 질문이나 협업 이야기를 기다립니다.</p></div><Link href="/contact" prefetch={false} className="action-primary shrink-0">연락처 보기<ArrowUpRight size={16} aria-hidden="true" /></Link></div></Container>
  </div>;
}
