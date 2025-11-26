import { api, authApi } from '@/lib/api';
import { Project } from '@/types';
export const projectApi = {
  getProjects: (params?: { limit?: number; page?: number; featured?: boolean }) =>
    api.get<Project[]>('/projects', params),
  getProject: (slug: string) =>
    api.get<Project>(`/projects/slug/${slug}`),
  getFeaturedProjects: () =>
    api.get<Project[]>('/projects', { featured: 'true' }),
  incrementViewCount: (projectSlug: string) =>
    api.post<{ success: boolean }>(`/projects/slug/${projectSlug}/view`),
};
export const adminProjectApi = {
  getProjects: (params?: { page?: number; limit?: number }) =>
    authApi.get<Project[]>('/projects', params),
  getProject: (id: string) =>
    authApi.get<Project>(`/projects/${id}`),
  createProject: (project: Partial<Project>) =>
    authApi.post<Project>('/projects', project),
  updateProject: (id: string, project: Partial<Project>) =>
    authApi.put<Project>(`/projects/${id}`, project),
  deleteProject: (id: string) =>
    authApi.delete<{ message: string }>(`/projects/${id}`),
};
