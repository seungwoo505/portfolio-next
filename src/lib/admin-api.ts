import type {
  ActivityLog,
  AdminLoginResponse,
  AdminUser,
  BlogPost,
  BlogTag,
  ContactMessage,
  Project,
  Skill,
} from "@/types";
import { api } from "@/lib/api-client";
import { authApi } from "@/lib/auth-api-client";

export const skillApi = {
  createSkill: (skill: Partial<Skill>) =>
    authApi.post<Skill>("/admin/skills", skill),
  updateSkill: (id: string, skill: Partial<Skill>) =>
    authApi.put<Skill>(`/admin/skills/${id}`, skill),
  deleteSkill: (id: string) => authApi.delete(`/admin/skills/${id}`),
  toggleFeatured: (id: string, isFeatured: boolean) =>
    authApi.patch<Skill>(`/admin/skills/${id}/featured`, {
      is_featured: isFeatured,
    }),
  updateOrder: (id: string, order: number) =>
    authApi.patch<Skill>(`/admin/skills/${id}/order`, {
      display_order: order,
    }),
};

export const adminApi = {
  login: (username: string, password: string) =>
    api.post<AdminLoginResponse>("/admin/login", { username, password }),
  logout: () => authApi.post<{ message: string }>("/admin/logout"),
  refresh: (refreshToken: string) =>
    api.post<{ token: string }>("/admin/refresh", { refreshToken }),
  getMe: () => authApi.get<{ user: AdminUser; permissions: string[] }>("/admin/me"),
  changePassword: (oldPassword: string, newPassword: string) =>
    authApi.put<{ message: string }>("/admin/password", {
      oldPassword,
      newPassword,
    }),
  getDashboard: () =>
    authApi.get<{ stats: Record<string, unknown> }>("/admin/dashboard"),
  getStats: () =>
    authApi.get<{
      blog: { total: number; published: number };
      projects: { total: number; published: number };
      contacts: { total: number; unread: number };
    }>("/admin/dashboard"),
  blog: {
    getPosts: (params?: { page?: number; limit?: number; status?: string }) =>
      authApi.get<BlogPost[]>("/admin/blog/posts", params),
    getPost: (id: string) =>
      authApi.get<BlogPost>(`/admin/blog/posts/slug/${id}`),
    createPost: (post: Partial<BlogPost>) =>
      authApi.post<BlogPost>("/admin/blog/posts", post),
    updatePost: (id: string, post: Partial<BlogPost>) =>
      authApi.put<BlogPost>(`/admin/blog/posts/slug/${id}`, post),
    deletePost: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/blog/posts/slug/${id}`),
    publishPost: (id: string) =>
      authApi.put<{ message: string }>(
        `/admin/blog/posts/slug/${id}/publish`,
        { is_published: true }
      ),
    unpublishPost: (id: string) =>
      authApi.put<{ message: string }>(
        `/admin/blog/posts/slug/${id}/publish`,
        { is_published: false }
      ),
  },
  tags: {
    getTags: () => authApi.get<BlogTag[]>("/admin/tags"),
    createTag: (tag: Partial<BlogTag>) =>
      authApi.post<BlogTag>("/admin/tags", tag),
    updateTag: (id: string, tag: Partial<BlogTag>) =>
      authApi.put<BlogTag>(`/admin/tags/${id}`, tag),
    deleteTag: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/tags/${id}`),
  },
  contacts: {
    getMessages: (params?: { page?: number; limit?: number; unread?: boolean }) =>
      authApi.get<ContactMessage[]>("/admin/contacts", params),
    markAsRead: (id: string) =>
      authApi.put<{ message: string }>(`/admin/contacts/${id}/read`),
    deleteMessage: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/contacts/${id}`),
  },
  projects: {
    getProjects: (params?: { page?: number; limit?: number }) =>
      authApi.get<Project[]>("/admin/projects", params),
    getProject: (id: string) =>
      authApi.get<Project>(`/admin/projects/slug/${id}`),
    createProject: (project: Partial<Project>) =>
      authApi.post<Project>("/admin/projects", project),
    updateProject: (id: string, project: Partial<Project>) =>
      authApi.put<Project>(`/admin/projects/slug/${id}`, project),
    deleteProject: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/projects/slug/${id}`),
  },
  logs: {
    getLogs: (params?: {
      page?: number;
      limit?: number;
      user_id?: string;
      action?: string;
    }) => authApi.get<ActivityLog[]>("/admin/logs", params),
  },
  users: {
    getUsers: () => authApi.get<AdminUser[]>("/admin/users"),
    createUser: (user: Partial<AdminUser>) =>
      authApi.post<AdminUser>("/admin/users", user),
    updateUser: (id: string, user: Partial<AdminUser>) =>
      authApi.put<AdminUser>(`/admin/users/${id}`, user),
    deleteUser: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/users/${id}`),
  },
};
