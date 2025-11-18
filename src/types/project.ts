// 프로젝트 관련 타입 정의

export interface ProjectForm {
  title: string;
  slug: string;
  description: string;
  content: string;
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

export interface AvailableTag {
  id: string;
  name: string;
  color: string;
  type: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  content?: string; // 프로젝트 상세 내용 (마크다운)
  excerpt?: string; // 프로젝트 요약
  meta_description?: string; // 메타 설명
  meta_keywords?: string; // 메타 키워드
  technologies?: string;
  github_url?: string;
  demo_url?: string;
  image_url?: string;
  slug: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  featured: boolean;
  start_date?: string;
  end_date?: string;
  view_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  tags?: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    description?: string; 
    color?: string; 
    type?: string; 
    usage_count?: number; 
    created_at?: string; 
    updated_at?: string; 
  }> | string[]; // 프로젝트 태그 (객체 또는 문자열 배열)
  skills?: Array<{ 
    id: string; 
    name: string; 
    slug?: string; 
    description?: string; 
    color?: string; 
    type?: string; 
    usage_count?: number; 
    created_at?: string; 
    updated_at?: string; 
  }>; // 프로젝트 스킬 (객체)
  images?: string[]; // 프로젝트 이미지
}
