import type {
  BlogPost,
  BlogTag,
  ContactMessage,
  Interest,
  PersonalInfo,
  Project,
  Skill,
  SkillCategory,
} from "@/types";
import { api } from "@/lib/api-client";

export const blogApi = {
  getPosts: (params?: {
    limit?: number;
    page?: number;
    featured?: boolean;
    search?: string;
    tags?: string[];
    status?: "published" | "draft" | "all";
    sort?: "published_at" | "created_at" | "title" | "view_count" | "reading_time";
    order?: "asc" | "desc";
  }) => {
    const searchParams: Record<string, string | number | boolean> = {};
    if (params?.limit) searchParams.limit = params.limit;
    if (params?.page) searchParams.page = params.page;
    if (params?.featured !== undefined) searchParams.featured = params.featured;
    if (params?.search) searchParams.search = params.search;
    if (params?.tags?.length) searchParams.tags = params.tags.join(",");
    if (params?.status) searchParams.status = params.status;
    if (params?.sort) searchParams.sort = params.sort;
    if (params?.order) searchParams.order = params.order;

    return api.get<BlogPost[]>("/public/posts", searchParams);
  },
  getPostBySlug: (slug: string) => api.get<BlogPost>(`/public/posts/${slug}`),
  searchPosts: (query: string, limit?: number) =>
    api.get<BlogPost[]>("/public/posts", {
      search: query,
      ...(limit && { limit }),
    }),
  getTags: (popular?: boolean) =>
    api.get<BlogTag[]>("/public/tags", popular ? { popular: "true" } : undefined),
  getPostsByTag: (tagSlug: string, params?: { limit?: number; page?: number }) =>
    api.get<BlogPost[]>(`/public/posts/tag/${tagSlug}`, params),
  incrementViewCount: (slug: string) =>
    api.post<{ success: boolean }>(`/public/posts/${slug}/view?t=${Date.now()}`),
};

export const projectApi = {
  getProjects: (params?: {
    limit?: number;
    page?: number;
    featured?: boolean;
    search?: string;
    tags?: string[];
    skills?: string[];
    status?: "published" | "draft" | "all";
    sort?: "created_at" | "title" | "view_count" | "display_order";
    order?: "asc" | "desc";
  }) => {
    const searchParams: Record<string, string | number | boolean> = {};
    if (params?.limit) searchParams.limit = params.limit;
    if (params?.page) searchParams.page = params.page;
    if (params?.featured !== undefined) searchParams.featured = params.featured;
    if (params?.search) searchParams.search = params.search;
    if (params?.tags?.length) searchParams.tags = params.tags.join(",");
    if (params?.skills?.length) searchParams.skills = params.skills.join(",");
    if (params?.status) searchParams.status = params.status;
    if (params?.sort) searchParams.sort = params.sort;
    if (params?.order) searchParams.order = params.order;

    return api.get<Project[]>("/public/projects", searchParams);
  },
  getProject: (slug: string) => api.get<Project>(`/public/projects/${slug}`),
  getFeaturedProjects: () =>
    api.get<Project[]>("/public/projects", { featured: "true" }),
  incrementViewCount: (projectSlug: string) =>
    api.post<{ success: boolean }>(
      `/public/projects/${projectSlug}/view?t=${Date.now()}`
    ),
};

export const contactApi = {
  sendMessage: (message: ContactMessage) =>
    api.post<{ id: string }>("/contact", message),
};

export const personalApi = {
  getPersonalInfo: () => api.get<PersonalInfo>("/public/profile"),
  getSkills: () =>
    api.get<{
      skills: Skill[];
      categories: SkillCategory[];
      skillsByCategory: SkillCategory[];
    }>("/public/skills"),
  getFeaturedSkills: () => api.get<Skill[]>("/public/skills/featured"),
  getInterests: () => api.get<Interest[]>("/public/interests"),
  getInterestsByCategory: (category: "technical" | "personal") =>
    api.get<Interest[]>("/public/interests", { category }),
  getExperiencesTimeline: () =>
    api.get<unknown[]>("/public/experiences/timeline"),
};

export const generalApi = {
  search: (query: string, type?: "all" | "blog" | "projects" | "skills") =>
    api.get<{ results: unknown[]; total: number }>("/search", {
      q: query,
      ...(type && { type }),
    }),
  healthCheck: () => api.get<{ status: string; timestamp: string }>("/health"),
  getDashboardStats: () =>
    api.get<{
      blog: { total: number; published: number };
      projects: { total: number; published: number };
      contacts: { total: number; unread: number };
    }>("/dashboard"),
};
