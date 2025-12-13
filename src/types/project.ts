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
  content?: string; 
  excerpt?: string; 
  meta_description?: string; 
  meta_keywords?: string; 
  technologies?: string;
  github_url?: string;
  demo_url?: string;
  project_url?: string;
  image_url?: string;
  featured_image?: string;
  slug: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  featured: boolean;
  is_published?: boolean;
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
  }> | string[]; 
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
  }>; 
  images?: string[]; 
}
