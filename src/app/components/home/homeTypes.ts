import type { BlogPost } from "@/types";

export interface HomeProject {
  id: string;
  title: string;
  description: string;
  detailed_description?: string;
  excerpt?: string;
  meta_description?: string;
  slug: string;
  featured: boolean;
  image_url?: string;
  catalog_summary?: string;
  catalog_label?: string;
  catalog_status?: string;
  created_at: string;
  tags?: string[];
  skills?: string[];
  view_count?: number;
}

export interface HomeSkill {
  id: string;
  name: string;
  proficiency_level: number;
  category_name?: string;
}

export interface HomePersonalInfo {
  full_name?: string;
  name?: string;
  bio?: string;
  about?: string;
}

export interface ClientHomeProps {
  blogPosts?: BlogPost[];
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
