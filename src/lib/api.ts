import { 
  ApiResponse, 
  BlogPost, 
  BlogTag, 
  Project, 
  ContactMessage, 
  PersonalInfo, 
  Interest, 
  ActivityLog, 
  Skill, 
  SkillCategory, 
  AdminUser, 
  AdminLoginResponse 
} from '@/types';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seungwoo.i234.me:3333/api';
class ApiClient {
  private baseURL: string;
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;
    if (options.method === 'GET' || !options.method) {
      const separator = endpoint.includes('?') ? '&' : '?';
      url += `${separator}_t=${Date.now()}`;
    }
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    };
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok && response.status >= 500) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }
      if (response.status === 429) {
        throw new Error(data.error || data.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
        }
        throw error;
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  }
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    return this.request<T>(url);
  }
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}
export const api = new ApiClient();
interface SeoSettings {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_alt?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_username?: string;
  google_verification?: string;
  robots_index?: string;
  robots_follow?: string;
  canonical_url?: string;
  site_title?: string;
  site_description?: string;
  personal_name?: string;
}
export const seoApi = {
  async getSeoSettings(): Promise<ApiResponse<SeoSettings>> {
    return api.get<SeoSettings>('/settings');
  }
};
export const blogApi = {
  getPosts: (params?: { 
    limit?: number; 
    page?: number; 
    featured?: boolean;
    search?: string;
    tags?: string[];
    status?: 'published' | 'draft' | 'all';
    sort?: 'published_at' | 'created_at' | 'title' | 'view_count' | 'reading_time';
    order?: 'asc' | 'desc';
  }) => {
    const searchParams: Record<string, string | number | boolean> = {};
    if (params?.limit) searchParams.limit = params.limit;
    if (params?.page) searchParams.page = params.page;
    if (params?.featured !== undefined) searchParams.featured = params.featured;
    if (params?.search) searchParams.search = params.search;
    if (params?.tags?.length) searchParams.tags = params.tags.join(',');
    if (params?.status) searchParams.status = params.status;
    if (params?.sort) searchParams.sort = params.sort;
    if (params?.order) searchParams.order = params.order;
    return api.get<BlogPost[]>('/blog/posts', searchParams);
  },
  getPostBySlug: (slug: string) =>
    api.get<BlogPost>(`/blog/posts/${slug}`),
  searchPosts: (query: string, limit?: number) =>
    api.get<BlogPost[]>('/blog/search', { q: query, ...(limit && { limit }) }),
  getTags: (popular?: boolean) =>
    api.get<BlogTag[]>('/tags', popular ? { popular: 'true' } : undefined),
  getPostsByTag: (tagSlug: string, params?: { limit?: number; page?: number }) =>
    api.get<BlogPost[]>(`/blog/posts/tag/${tagSlug}`, params),
  incrementViewCount: (slug: string) =>
    api.post<{ success: boolean }>(`/blog/posts/${slug}/view?t=${Date.now()}`),
};
export const projectApi = {
  getProjects: (params?: { 
    limit?: number; 
    page?: number; 
    featured?: boolean;
    search?: string;
    tags?: string[];
    skills?: string[];
    status?: 'published' | 'draft' | 'all';
    sort?: 'created_at' | 'title' | 'view_count' | 'display_order';
    order?: 'asc' | 'desc';
  }) => {
    const searchParams: Record<string, string | number | boolean> = {};
    if (params?.limit) searchParams.limit = params.limit;
    if (params?.page) searchParams.page = params.page;
    if (params?.featured !== undefined) searchParams.featured = params.featured;
    if (params?.search) searchParams.search = params.search;
    if (params?.tags?.length) searchParams.tags = params.tags.join(',');
    if (params?.skills?.length) searchParams.skills = params.skills.join(',');
    if (params?.status) searchParams.status = params.status;
    if (params?.sort) searchParams.sort = params.sort;
    if (params?.order) searchParams.order = params.order;
    return api.get<Project[]>('/projects', searchParams);
  },
  getProject: (slug: string) =>
    api.get<Project>(`/projects/slug/${slug}`),
  getFeaturedProjects: () =>
    api.get<Project[]>('/projects', { featured: 'true' }),
  incrementViewCount: (projectSlug: string) =>
    api.post<{ success: boolean }>(`/projects/slug/${projectSlug}/view?t=${Date.now()}`),
};
export const contactApi = {
  sendMessage: (message: ContactMessage) =>
    api.post<{ id: string }>('/contact', message),
};
export const personalApi = {
  getPersonalInfo: () =>
    api.get<PersonalInfo>('/personal-info'),
  getSkills: () =>
    api.get<{ skills: Skill[]; categories: SkillCategory[]; skillsByCategory: SkillCategory[] }>('/skills'),
  getFeaturedSkills: () =>
    api.get<Skill[]>('/skills/featured'),
  getInterests: () =>
    api.get<Interest[]>('/interests'),
  getInterestsByCategory: (category: 'technical' | 'personal') =>
    api.get<Interest[]>('/interests', { category }),
  getExperiencesTimeline: () =>
    api.get<unknown[]>('/experiences/timeline'),
};
export const skillApi = {
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
};
export const generalApi = {
  search: (query: string, type?: 'all' | 'blog' | 'projects' | 'skills') =>
    api.get<{ results: unknown[]; total: number }>('/search', { q: query, ...(type && { type }) }),
  healthCheck: () =>
    api.get<{ status: string; timestamp: string }>('/health'),
  getDashboardStats: () =>
    api.get<{ blog: { total: number; published: number }; projects: { total: number; published: number }; contacts: { total: number; unread: number } }>('/dashboard'),
};
export const adminApi = {
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
  getDashboard: () =>
    authApi.get<{ stats: Record<string, unknown> }>('/admin/dashboard'),
  getStats: () =>
    authApi.get<{ blog: { total: number; published: number }; projects: { total: number; published: number }; contacts: { total: number; unread: number } }>('/admin/dashboard'),
  blog: {
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
  },
  tags: {
    getTags: () =>
      authApi.get<BlogTag[]>('/admin/tags'),
    getTag: (id: string) =>
      authApi.get<BlogTag>(`/admin/tags/${id}`),
    createTag: (tag: Partial<BlogTag>) =>
      authApi.post<BlogTag>('/admin/tags', tag),
    updateTag: (id: string, tag: Partial<BlogTag>) =>
      authApi.put<BlogTag>(`/admin/tags/${id}`, tag),
    deleteTag: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/tags/${id}`),
  },
  contacts: {
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
  },
  projects: {
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
  },
  logs: {
    getLogs: (params?: { page?: number; limit?: number; user_id?: string; action?: string }) =>
      authApi.get<ActivityLog[]>('/admin/logs', params),
    getLog: (id: string) =>
      authApi.get<ActivityLog>(`/admin/logs/${id}`),
  },
  users: {
    getUsers: () =>
      authApi.get<AdminUser[]>('/admin/users'),
    createUser: (user: Partial<AdminUser>) =>
      authApi.post<AdminUser>('/admin/users', user),
    updateUser: (id: string, user: Partial<AdminUser>) =>
      authApi.put<AdminUser>(`/admin/users/${id}`, user),
    deleteUser: (id: string) =>
      authApi.delete<{ message: string }>(`/admin/users/${id}`),
  },
};
export class AuthenticatedApiClient {
  private baseURL: string;
  private token: string | null = null;
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }
  setRefreshToken(refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_refresh_token', refreshToken);
    }
  }
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_refresh_token');
    }
    return null;
  }
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
    }
  }
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;
    if (options.method === 'GET' || !options.method) {
      const separator = endpoint.includes('?') ? '&' : '?';
      url += `${separator}_t=${Date.now()}`;
    }
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(refreshToken && { 'X-Refresh-Token': refreshToken }),
        ...options.headers,
      },
      cache: 'no-store',
      ...options,
    };
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok && response.status >= 500) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }
      if (response.status === 429) {
        throw new Error(data.error || data.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
      if (response.status === 401) {
        await this.handleTokenExpiration();
      }
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        this.setToken(newToken);
      }
      return data;
    } catch {
      throw new Error('API 요청 실패');
    }
  }
  private async handleTokenExpiration() {
    this.clearToken();
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin-login';
    }
  }
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }
      const response = await fetch(`${this.baseURL}/admin/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        this.clearToken();
        return false;
      }
      const data = await response.json();
      if (data.success) {
        this.setToken(data.data.token);
        return true;
      } else {
        this.clearToken();
        return false;
      }
    } catch {
      this.clearToken();
      return false;
    }
  }
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.get('/admin/me');
      return response.success;
    } catch (error: unknown) {
      if ((error as { response?: { status: number }; message?: string })?.response?.status === 401 || (error as { message?: string })?.message?.includes('401')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return true;
        }
        await this.handleTokenExpiration();
        return false;
      }
      return false;
    }
  }
  startTokenValidation(intervalMs: number = 2 * 60 * 1000) { 
    if (typeof window === 'undefined') return;
    const token = this.getToken();
    if (!token) return;
    const interval = setInterval(async () => {
      const isValid = await this.validateToken();
      if (!isValid) {
        clearInterval(interval);
      }
    }, intervalMs);
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
    return interval;
  }
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    const searchParams = params ? new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    return this.request<T>(url);
  }
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    const token = this.getToken();
    const url = `${this.baseURL}/admin/upload/image`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return {
        success: true,
        data: { url: data.data.url }, 
        message: data.message
      };
    } catch {
      return {
        success: false,
        data: undefined,
        message: 'Upload failed'
      };
    }
  }
  async generateSummary(content: string, includeKeywords?: boolean): Promise<ApiResponse<{
    summary: string;
    keywords?: string[];
    keywordsString?: string;
    originalLength: number;
    summaryLength: number;
  }>> {
    return this.post<{
      summary: string;
      keywords?: string[];
      keywordsString?: string;
      originalLength: number;
      summaryLength: number;
    }>('/admin/ai/summarize', { content, includeKeywords });
  }
  async generateKeywords(content: string, maxKeywords?: number): Promise<ApiResponse<{
    keywords: string[];
    keywordsString: string;
    originalLength: number;
    keywordCount: number;
  }>> {
    return this.post<{
      keywords: string[];
      keywordsString: string;
      originalLength: number;
      keywordCount: number;
    }>('/admin/ai/keywords', { content, maxKeywords });
  }
  async createCategory(name: string): Promise<ApiResponse<{ id: string; name: string }>> {
    return this.post<{ id: string; name: string }>('/admin/skills/categories', { name });
  }
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/admin/skills/categories/${id}`);
  }
}
export const authApi = new AuthenticatedApiClient();
export default api;
