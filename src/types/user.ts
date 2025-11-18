// 사용자 관련 타입 정의

export interface PersonalInfo {
  id: string;
  full_name: string;
  name?: string; // 백업용 이름 필드
  title?: string;
  bio?: string;
  about?: string; // 상세 소개 내용
  location?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  profile_image?: string; // 프로필 이미지 (avatar_url과 동일)
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
  is_active: number; // 1: 활성, 0: 비활성
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
