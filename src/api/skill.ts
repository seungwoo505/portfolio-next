// 스킬 관련 API 함수들

import { api, authApi } from '@/lib/api';
import { Skill, SkillCategory } from '@/types';

export const skillApi = {
  // 스킬 목록
  getSkills: () =>
    api.get<{ skills: Skill[]; categories: SkillCategory[]; skillsByCategory: SkillCategory[] }>('/skills'),

  // 추천 스킬
  getFeaturedSkills: () =>
    api.get<Skill[]>('/skills/featured'),
};

export const adminSkillApi = {
  // 스킬 관리
  createSkill: (skill: Partial<Skill>) =>
    authApi.post<Skill>('/admin/skills', skill),

  updateSkill: (id: string, skill: Partial<Skill>) =>
    authApi.put<Skill>(`/admin/skills/${id}`, skill),

  deleteSkill: (id: string) =>
    authApi.delete(`/admin/skills/${id}`),

  toggleFeatured: (id: string, isFeatured: boolean) =>
    authApi.patch<Skill>(`/admin/skills/${id}/featured`, { is_featured: isFeatured }),

  updateOrder: (id: string, order: number) =>
    authApi.patch<Skill>(`/admin/skills/${id}/order`, { display_order: order }),

  // 카테고리 관리
  createCategory: (name: string) =>
    authApi.post<{ id: string; name: string }>('/admin/skills/categories', { name }),

  deleteCategory: (id: string) =>
    authApi.delete<void>(`/admin/skills/categories/${id}`),
};
