// 블로그 관련 타입 정의

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  is_published: boolean;
  featured?: boolean;
  featured_image?: string;
  meta_description?: string;
  meta_keywords?: string;
  view_count: number;
  read_time_minutes?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags?: BlogTag[];
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type?: 'blog' | 'project' | 'general';
  post_count?: number;
}
