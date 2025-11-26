import { AdminUser } from './user';
import { Skill } from './skill';

export interface AdminBlogPostForm {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  meta_description: string;
  meta_keywords: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
}

export interface AdminTagOption {
  id: string;
  name: string;
  color: string;
  type?: 'blog' | 'project' | 'general';
}

export interface AdminBlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type: 'blog' | 'project' | 'general';
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AdminExperience {
  id: string;
  title: string;
  company?: string;
  start_date?: string;
  end_date?: string | null;
  description?: string;
  achievements?: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminInterest {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: 'technical' | 'personal';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
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

export interface AdminProjectForm {
  title: string;
  slug: string;
  description: string;
  content: string;
  excerpt: string;
  meta_description: string;
  featured_image: string;
  project_url: string;
  github_url: string;
  tags: string[];
  start_date: string;
  end_date: string;
  is_featured: boolean;
  is_published: boolean;
  is_ongoing: boolean;
  meta_keywords?: string;
}

export interface AdminProjectSummary {
  id: string;
  title: string;
  description: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  meta_keywords?: string;
  featured_image: string;
  project_url: string;
  github_url: string;
  tags: string[];
  start_date: string;
  end_date: string;
  featured: boolean;
  is_published: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
}

export interface AdminSettingEntry {
  value: string | number | boolean | Record<string, unknown>;
  type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  description: string;
  updated_at: string;
}

export type AdminSettingsMap = Record<string, AdminSettingEntry>;

export interface AdminEditUserForm {
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
  status: 'active' | 'inactive';
  is_active: number | boolean;
  newPassword?: string;
  confirmPassword?: string;
}

export interface AdminDashboardStats {
  blog: {
    total: number;
    published: number;
    drafts: number;
  };
  projects: {
    total: number;
    featured: number;
  };
  contacts: {
    total: number;
    unread: number;
  };
  activities: {
    total: number;
    today: number;
  };
}

export interface AdminNewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: AdminUser) => void;
}

export interface AdminUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'admin' | 'editor';
  status: 'active' | 'inactive';
}

export interface AdminSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill?: Skill | null;
  onSave: (skill: Partial<Skill>) => Promise<{ success: boolean; message?: string }>;
  categories: Array<{ id: string; name: string }>;
  keepOpenOnSuccess?: boolean;
}

