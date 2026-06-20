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
  retryAfter?: number;
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
  contact_email?: string;
  search_enabled?: boolean;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  contact_description?: string;
  contact_enabled?: boolean;
  contact_form_name_placeholder?: string;
  contact_form_email_placeholder?: string;
  contact_form_subject_placeholder?: string;
  contact_form_message_placeholder?: string;
  contact_form_submit_text?: string;
  contact_form_success_message?: string;
  contact_form_error_message?: string;
}
