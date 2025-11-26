import { api, authApi } from '@/lib/api';
import { BlogPost, BlogTag } from '@/types';
export const blogApi = {
  getPosts: (params?: { limit?: number; page?: number; featured?: boolean }) =>
    api.get<BlogPost[]>('/blog/posts', params),
  getPostBySlug: (slug: string) =>
    api.get<BlogPost>(`/blog/posts/${slug}`),
  searchPosts: (query: string, limit?: number) =>
    api.get<BlogPost[]>('/blog/search', { q: query, ...(limit && { limit }) }),
  getTags: (popular?: boolean) =>
    api.get<BlogTag[]>('/tags', popular ? { popular: 'true' } : undefined),
  getPostsByTag: (tagSlug: string, params?: { limit?: number; page?: number }) =>
    api.get<BlogPost[]>(`/blog/posts/tag/${tagSlug}`, params),
  incrementViewCount: (postSlug: string) =>
    api.post<{ success: boolean }>(`/blog/posts/${postSlug}/view`),
};
export const adminBlogApi = {
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
