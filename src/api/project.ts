// 프로젝트 관련 API 함수들

import { api, authApi } from '@/lib/api';
import { Project } from '@/types';

export const projectApi = {
  // 프로젝트 목록
  getProjects: (params?: { limit?: number; page?: number; featured?: boolean }) =>
    api.get<Project[]>('/projects', params),

  // 프로젝트 상세 (슬러그 기반)
  getProject: (slug: string) =>
    api.get<Project>(`/projects/slug/${slug}`),

  // 추천 프로젝트
  getFeaturedProjects: () =>
    api.get<Project[]>('/projects', { featured: 'true' }),

  // 조회수 증가 (슬러그 기반)
  incrementViewCount: (projectSlug: string) =>
    api.post<{ success: boolean }>(`/projects/slug/${projectSlug}/view`),
};

export const adminProjectApi = {
  // 프로젝트 관리
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
