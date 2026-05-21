import { api, authApi } from '@/lib/api';
import { Skill, SkillCategory } from '@/types';
export const skillApi = {
  getSkills: () =>
    api.get<{ skills: Skill[]; categories: SkillCategory[]; skillsByCategory: SkillCategory[] }>('/public/skills'),
  getFeaturedSkills: () =>
    api.get<Skill[]>('/public/skills/featured'),
};
export const adminSkillApi = {
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
  createCategory: (name: string) =>
    authApi.post<{ id: string; name: string }>('/admin/skills/categories', { name }),
  deleteCategory: (id: string) =>
    authApi.delete<void>(`/admin/skills/categories/${id}`),
};
