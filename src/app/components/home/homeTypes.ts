export interface HomePost {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  created_at: string;
  view_count?: number;
}

export interface HomeProject {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  slug: string;
  featured: boolean;
  image_url?: string;
  tags?: string[];
  skills?: string[];
  view_count?: number;
}

export interface HomeSkill {
  id: string;
  name: string;
  category_name?: string;
}

export interface HomePersonalInfo {
  full_name?: string;
  name?: string;
  bio?: string;
  about?: string;
}

export interface HomePageData {
  blogPosts: HomePost[];
  projects: HomeProject[];
  skills: HomeSkill[];
  personalInfo?: HomePersonalInfo;
}

export interface ClientHomeProps {
  blogPosts?: HomePost[];
  projects?: HomeProject[];
  skills?: HomeSkill[];
  loading?: boolean;
  error?: string;
  personalInfo?: HomePersonalInfo;
  hasError?: boolean;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface GalaxyConfig {
  mouseRepulsion: boolean;
  mouseInteraction: boolean;
  density: number;
  glowIntensity: number;
  saturation: number;
  hueShift: number;
  transparent: boolean;
  disableAnimation: boolean;
  speed: number;
}
