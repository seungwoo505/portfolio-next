// 블로그 관련 API 함수들

import { api, authApi } from '@/lib/api';
import { BlogPost, BlogTag } from '@/types';

export const blogApi = {
  // 블로그 포스트 목록
  getPosts: (params?: { limit?: number; page?: number; featured?: boolean }) =>
    api.get<BlogPost[]>('/blog/posts', params),

  // 블로그 포스트 상세
  getPostBySlug: (slug: string) =>
    api.get<BlogPost>(`/blog/posts/${slug}`),

  // 블로그 검색
  searchPosts: (query: string, limit?: number) =>
    api.get<BlogPost[]>('/blog/search', { q: query, ...(limit && { limit }) }),

  // 태그 목록
  getTags: (popular?: boolean) =>
    api.get<BlogTag[]>('/tags', popular ? { popular: 'true' } : undefined),

  // 태그별 포스트
  getPostsByTag: (tagSlug: string, params?: { limit?: number; page?: number }) =>
    api.get<BlogPost[]>(`/blog/posts/tag/${tagSlug}`, params),

  // 조회수 증가 (슬러그 기반)
  incrementViewCount: (postSlug: string) =>
    api.post<{ success: boolean }>(`/blog/posts/${postSlug}/view`),
};

export const adminBlogApi = {
  // 블로그 포스트 관리
  getPosts: (params?: { page?: number; limit?: number; status?: string }) =>
    authApi.get<BlogPost[]>('/admin/blog/posts', params),

  getPost: (id: string) =>
    authApi.get<BlogPost>(`/blog/posts/id/${id}`),

  createPost: (post: Partial<BlogPost>) =>
    authApi.post<BlogPost>('/blog/posts', post),

  updatePost: (id: string, post: Partial<BlogPost>) =>
    authApi.put<BlogPost>(`/blog/posts/${id}`, post),

  deletePost: (id: string) =>
    authApi.delete<{ message: string }>(`/admin/blog/posts/${id}`),

  publishPost: (id: string) =>
    authApi.put<{ message: string }>(`/admin/blog/posts/${id}/publish`, { is_published: true }),

  unpublishPost: (id: string) =>
    authApi.put<{ message: string }>(`/admin/blog/posts/${id}/publish`, { is_published: false }),
};
