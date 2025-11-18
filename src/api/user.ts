// 사용자 관련 API 함수들

import { api, authApi } from '@/lib/api';
import { PersonalInfo, AdminUser, AdminLoginResponse } from '@/types';

export const personalApi = {
  // 개인 정보
  getPersonalInfo: () =>
    api.get<PersonalInfo>('/personal-info'),

  // 관심사 목록
  getInterests: () =>
    api.get<PersonalInfo[]>('/interests'),

  // 카테고리별 관심사
  getInterestsByCategory: (category: 'technical' | 'personal') =>
    api.get<PersonalInfo[]>('/interests', { category }),
};

export const adminPersonalApi = {
  // 관리자용 개인 정보 관리
  getPersonalInfo: () =>
    authApi.get<PersonalInfo>('/admin/personal-info'),

  updatePersonalInfo: (personalInfo: Partial<PersonalInfo>) =>
    authApi.put<PersonalInfo>('/admin/personal-info', personalInfo),
};

export const adminUserApi = {
  // 인증
  login: (username: string, password: string) =>
    api.post<AdminLoginResponse>('/admin/login', { username, password }),

  // 로그아웃 (활동 로그 기록용)
  logout: () =>
    api.post<{ message: string }>('/admin/logout'),

  // 토큰 재발급
  refresh: (refreshToken: string) =>
    api.post<{ token: string }>('/admin/refresh', { refreshToken }),

  getMe: () =>
    api.get<{ user: AdminUser; permissions: string[] }>('/admin/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/admin/password', { oldPassword, newPassword }),

  // 사용자 관리
  getUsers: () =>
    authApi.get<AdminUser[]>('/admin/users'),

  createUser: (user: Partial<AdminUser>) =>
    authApi.post<AdminUser>('/admin/users', user),

  updateUser: (id: string, user: Partial<AdminUser>) =>
    authApi.put<AdminUser>(`/admin/users/${id}`, user),

  deleteUser: (id: string) =>
    authApi.delete<{ message: string }>(`/admin/users/${id}`),
};
