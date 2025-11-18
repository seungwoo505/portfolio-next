// 공통 API 함수들

import { api, authApi } from '@/lib/api';
import { ContactMessage, ActivityLog } from '@/types';

export const contactApi = {
  // 연락처 메시지 전송
  sendMessage: (message: ContactMessage) =>
    api.post<{ id: string }>('/contact', message),
};

export const adminContactApi = {
  // 연락처 메시지 관리
  getMessages: (params?: { page?: number; limit?: number; status?: string }) =>
    authApi.get<ContactMessage[]>('/admin/contacts', params),

  getMessage: (id: string) =>
    authApi.get<ContactMessage>(`/admin/contacts/${id}`),

  markAsRead: (id: string) =>
    authApi.put<{ message: string }>(`/admin/contacts/${id}/read`),

  markAsUnread: (id: string) =>
    authApi.put<{ message: string }>(`/admin/contacts/${id}/unread`),

  deleteMessage: (id: string) =>
    authApi.delete<{ message: string }>(`/admin/contacts/${id}`),
};

export const generalApi = {
  // 통합 검색
  search: (query: string, type?: 'all' | 'blog' | 'projects' | 'skills') =>
    api.get<{ results: unknown[]; total: number }>('/search', { q: query, ...(type && { type }) }),

  // 헬스 체크
  healthCheck: () =>
    api.get<{ status: string; timestamp: string }>('/health'),

  // 대시보드 통계
  getDashboardStats: () =>
    api.get<{ blog: { total: number; published: number }; projects: { total: number; published: number }; contacts: { total: number; unread: number } }>('/dashboard'),
};

export const adminLogApi = {
  // 활동 로그
  getLogs: (params?: { page?: number; limit?: number; user_id?: string; action?: string }) =>
    authApi.get<ActivityLog[]>('/admin/logs', params),

  getLog: (id: string) =>
    authApi.get<ActivityLog>(`/admin/logs/${id}`),
};
