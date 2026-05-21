import { api, authApi } from '@/lib/api';
import { PersonalInfo, AdminUser, AdminLoginResponse } from '@/types';
export const personalApi = {
  getPersonalInfo: () =>
    api.get<PersonalInfo>('/public/profile'),
  getInterests: () =>
    api.get<PersonalInfo[]>('/public/interests'),
  getInterestsByCategory: (category: 'technical' | 'personal') =>
    api.get<PersonalInfo[]>('/public/interests', { category }),
};
export const adminPersonalApi = {
  getPersonalInfo: () =>
    authApi.get<PersonalInfo>('/admin/personal-info'),
  updatePersonalInfo: (personalInfo: Partial<PersonalInfo>) =>
    authApi.put<PersonalInfo>('/admin/personal-info', personalInfo),
};
export const adminUserApi = {
  login: (username: string, password: string) =>
    api.post<AdminLoginResponse>('/admin/login', { username, password }),
  logout: () =>
    api.post<{ message: string }>('/admin/logout'),
  refresh: (refreshToken: string) =>
    api.post<{ token: string }>('/admin/refresh', { refreshToken }),
  getMe: () =>
    api.get<{ user: AdminUser; permissions: string[] }>('/admin/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/admin/password', { oldPassword, newPassword }),
  getUsers: () =>
    authApi.get<AdminUser[]>('/admin/users'),
  createUser: (user: Partial<AdminUser>) =>
    authApi.post<AdminUser>('/admin/users', user),
  updateUser: (id: string, user: Partial<AdminUser>) =>
    authApi.put<AdminUser>(`/admin/users/${id}`, user),
  deleteUser: (id: string) =>
    authApi.delete<{ message: string }>(`/admin/users/${id}`),
};
