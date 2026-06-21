"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScrollProgress from "@/components/ScrollProgress";
import { blogApi, personalApi, projectApi } from "@/lib/api";
import type { BlogPost } from "@/types";
import HomeHeroSection from "./home/HomeHeroSection";
import HomeLatestContent from "./home/HomeLatestContent";
import HomeSkillsSection from "./home/HomeSkillsSection";
import {
  HomeErrorState,
  HomeLoadingState,
} from "./home/HomeStateViews";
import { FALLBACK_PROFILE, FALLBACK_SKILLS } from "./home/homeFallbacks";
import type {
  ClientHomeProps,
  GalaxyConfig,
  HomeProject,
  HomeSkill,
} from "./home/homeTypes";

const BLOG_PLACEHOLDER_COUNT = 1;
const PROJECT_PLACEHOLDER_COUNT = 1;
const SKILL_PLACEHOLDER_COUNT = 1;
const CARD_REVEAL_INTERVAL = 120;
const SKILL_REVEAL_INTERVAL = 80;
const SKILL_REVEAL_STEP = 3;
const VIEW_COUNT_REFRESH_INTERVAL_MS = 60_000;

export default function ClientHome({
  blogPosts: initialBlogPosts = [],
  projects: initialProjects = [],
  skills: initialSkills = [],
  loading: initialLoading = false,
  error,
  personalInfo: initialPersonalInfo,
  hasError: _hasError,
}: ClientHomeProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeSkillTab, setActiveSkillTab] = useState("all");
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [projects, setProjects] = useState<HomeProject[]>(initialProjects);
  const [skills, setSkills] = useState<HomeSkill[]>(initialSkills);
  const [loading, setLoading] = useState(initialLoading);
  const [_dataError, setDataError] = useState(false);
  const [blogRevealCount, setBlogRevealCount] = useState(0);
  const [projectRevealCount, setProjectRevealCount] = useState(0);
  const [skillsRevealCount, setSkillsRevealCount] = useState(0);
  const lastViewCountRefreshAtRef = useRef(0);
  const isRefreshingViewCountsRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      try {
        const [blogResponse, projectResponse, skillsResponse] = await Promise.all([
          blogApi.getPosts({ limit: 2, featured: true }),
          projectApi.getProjects({ limit: 2, featured: true }),
          personalApi.getFeaturedSkills(),
        ]);

        if (blogResponse.success && blogResponse.data) {
          setBlogPosts(blogResponse.data);
        }
        if (projectResponse.success && projectResponse.data) {
          setProjects(projectResponse.data as HomeProject[]);
        }
        if (skillsResponse.success && skillsResponse.data) {
          setSkills(skillsResponse.data);
        }

        setLoading(false);
        setDataError(false);
      } catch (loadError) {
        console.error("데이터 로딩 실패:", loadError);
        setDataError(true);
        setLoading(false);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (
      initialBlogPosts.length === 0 &&
      initialProjects.length === 0 &&
      initialSkills.length === 0
    ) {
      loadData();
    } else {
      setBlogPosts(initialBlogPosts);
      setProjects(initialProjects);
      setSkills(initialSkills);
      setIsDataLoading(false);
    }
  }, [initialBlogPosts, initialProjects, initialSkills]);

  useEffect(() => {
    const updateViewCounts = async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        now - lastViewCountRefreshAtRef.current < VIEW_COUNT_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      if (isRefreshingViewCountsRef.current) {
        return;
      }

      isRefreshingViewCountsRef.current = true;
      lastViewCountRefreshAtRef.current = now;

      try {
        const [blogResponse, projectResponse] = await Promise.all([
          blogApi.getPosts({ limit: 2, featured: true }),
          projectApi.getProjects({ limit: 2, featured: true }),
        ]);

        if (
          blogResponse.success &&
          blogResponse.data &&
          Array.isArray(blogResponse.data)
        ) {
          setBlogPosts((prevPosts) =>
            prevPosts.map((prevPost) => {
              const updatedPost = blogResponse.data!.find(
                (post) => post.id === prevPost.id
              );
              return updatedPost &&
                updatedPost.view_count !== prevPost.view_count
                ? { ...prevPost, view_count: updatedPost.view_count }
                : prevPost;
            })
          );
        }

        if (
          projectResponse.success &&
          projectResponse.data &&
          Array.isArray(projectResponse.data)
        ) {
          setProjects((prevProjects) =>
            prevProjects.map((prevProject) => {
              const updatedProject = projectResponse.data!.find(
                (project) => project.id === prevProject.id
              );
              return updatedProject &&
                updatedProject.view_count !== prevProject.view_count
                ? { ...prevProject, view_count: updatedProject.view_count }
                : prevProject;
            })
          );
        }
      } catch (viewCountError) {
        console.error("조회수 갱신 실패:", viewCountError);
      } finally {
        isRefreshingViewCountsRef.current = false;
      }
    };

    let visibilityTimer: NodeJS.Timeout | null = null;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (visibilityTimer) clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(() => {
          updateViewCounts();
        }, 500);
      }
    };

    let focusTimer: NodeJS.Timeout | null = null;
    const handleFocus = () => {
      if (focusTimer) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        updateViewCounts();
      }, 500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      if (focusTimer) clearTimeout(focusTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
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

  const galaxyProps = useMemo<GalaxyConfig>(
    () => ({
      mouseRepulsion: true,
      mouseInteraction: true,
      density: 1.5,
      glowIntensity: 0.5,
      saturation: 0.8,
      hueShift: 240,
      transparent: true,
      disableAnimation: false,
      speed: 1.0,
    }),
    []
  );

  useEffect(() => {
    setIsDataLoading(false);
  }, [blogPosts, projects, skills]);

  const categorizedSkills = useMemo(() => {
    if (!skills || skills.length === 0) return {};
    const categories: Record<string, HomeSkill[]> = {};

    skills.forEach((skill) => {
      const category = skill.category_name || "기타";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(skill);
    });

    return categories;
  }, [skills]);

  const currentSkills = useMemo(() => {
    if (activeSkillTab === "all") {
      return skills;
    }

    return categorizedSkills[activeSkillTab] || [];
  }, [activeSkillTab, skills, categorizedSkills]);

  const featuredProjectItems = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects.filter((project) => project.featured);
  }, [projects]);

  const displayName =
    personalInfo?.full_name || personalInfo?.name || FALLBACK_PROFILE.name;
  const displayDescription =
    personalInfo?.bio || personalInfo?.about || FALLBACK_PROFILE.description;
  const blogSkeletonCount =
    blogPosts.length > 0 ? blogPosts.length : BLOG_PLACEHOLDER_COUNT;
  const projectSkeletonCount =
    featuredProjectItems.length > 0
      ? featuredProjectItems.length
      : PROJECT_PLACEHOLDER_COUNT;
  const skillSkeletonCount =
    currentSkills.length > 0 ? currentSkills.length : SKILL_PLACEHOLDER_COUNT;

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
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (error) {
    return <HomeErrorState />;
  }

  if (isDataLoading) {
    return <HomeLoadingState />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <ScrollProgress />
      <HomeHeroSection
        displayName={displayName}
        displayDescription={displayDescription}
        titleWords={FALLBACK_PROFILE.titleWords}
        mousePosition={mousePosition}
        galaxyProps={galaxyProps}
      />
      <HomeLatestContent
        loading={loading}
        blogPosts={blogPosts}
        featuredProjectItems={featuredProjectItems}
        blogRevealCount={blogRevealCount}
        projectRevealCount={projectRevealCount}
        blogSkeletonCount={blogSkeletonCount}
        projectSkeletonCount={projectSkeletonCount}
      />
      <HomeSkillsSection
        loading={loading}
        activeSkillTab={activeSkillTab}
        setActiveSkillTab={setActiveSkillTab}
        categorizedSkills={categorizedSkills}
        currentSkills={currentSkills}
        fallbackSkills={FALLBACK_SKILLS}
        skillSkeletonCount={skillSkeletonCount}
        skillsRevealCount={skillsRevealCount}
      />
    </div>
  );
}
