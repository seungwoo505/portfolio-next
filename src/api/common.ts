import { api, authApi } from '@/lib/api';
import { ContactMessage, ActivityLog } from '@/types';
export const contactApi = {
  sendMessage: (message: ContactMessage) =>
    api.post<{ id: string }>('/contact', message),
};
export const adminContactApi = {
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
  search: (query: string, type?: 'all' | 'blog' | 'projects' | 'skills') =>
    api.get<{ results: unknown[]; total: number }>('/search', { q: query, ...(type && { type }) }),
  healthCheck: () =>
    api.get<{ status: string; timestamp: string }>('/health'),
  getDashboardStats: () =>
    api.get<{ blog: { total: number; published: number }; projects: { total: number; published: number }; contacts: { total: number; unread: number } }>('/dashboard'),
};
export const adminLogApi = {
  getLogs: (params?: { page?: number; limit?: number; user_id?: string; action?: string }) =>
    authApi.get<ActivityLog[]>('/admin/logs', params),
  getLog: (id: string) =>
    authApi.get<ActivityLog>(`/admin/logs/${id}`),
};
