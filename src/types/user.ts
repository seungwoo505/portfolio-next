export interface PersonalInfo {
  id: string;
  full_name: string;
  name?: string; 
  title?: string;
  bio?: string;
  about?: string; 
  location?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  profile_image?: string; 
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  created_at?: string;
  updated_at: string;
}
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
  status: 'active' | 'inactive';
  is_active: number; 
  last_login_at?: string;
  created_at: string;
}
export interface AdminLoginResponse {
  user: AdminUser;
  token: string;
  refreshToken?: string;
  permissions: string[];
}
export interface AuthState {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: { id: string; username: string; email: string; role: string } | null;
}
