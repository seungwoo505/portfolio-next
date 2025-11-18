// 공통 타입 정의

export interface ContactMessage {
  name: string;
  email: string;
  subject?: string;
  message: string;
  [key: string]: unknown;
}

export interface Interest {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: 'technical' | 'personal';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export interface SiteSettings {
  site_title?: string;
  site_description?: string;
  meta_keywords?: string;
  meta_author?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  dark_mode?: boolean;
}
