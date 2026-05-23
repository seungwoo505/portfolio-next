import { api, authApi } from '@/lib/api';
import { Project } from '@/types';
export const projectApi = {
  getProjects: (params?: { limit?: number; page?: number; featured?: boolean }) =>
    api.get<Project[]>('/public/projects', params),
  getProject: (slug: string) =>
    api.get<Project>(`/public/projects/${slug}`),
  getFeaturedProjects: () =>
    api.get<Project[]>('/public/projects', { featured: 'true' }),
  incrementViewCount: (projectSlug: string) =>
    api.post<{ success: boolean }>(`/public/projects/${projectSlug}/view`),
};
export const adminProjectApi = {
  getProjects: (params?: { page?: number; limit?: number }) =>
    authApi.get<Project[]>('/admin/projects', params),
  getProject: (id: string) =>
    authApi.get<Project>(`/admin/projects/slug/${id}`),
  createProject: (project: Partial<Project>) =>
    authApi.post<Project>('/admin/projects', project),
  updateProject: (id: string, project: Partial<Project>) =>
    authApi.put<Project>(`/admin/projects/slug/${id}`, project),
  deleteProject: (id: string) =>
    authApi.delete<{ message: string }>(`/admin/projects/slug/${id}`),
};
