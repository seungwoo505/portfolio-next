export interface AboutPersonalInfo {
  id?: number;
  full_name?: string;
  title?: string;
  bio?: string;
  about?: string;
  location?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
}

export interface AboutSkill {
  id: number;
  name: string;
  proficiency_level: number;
  category_name?: string;
  type?: string;
  category?: string;
}

export interface AboutExperience {
  id: number;
  title: string;
  company?: string;
  company_or_institution?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  type: string;
}

export interface AboutInterest {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface AboutCategory {
  id: string;
  name: string;
  display_order?: number;
}

export interface SitePublicSettings {
  site_title?: string;
  site_description?: string;
  site_logo?: string;
  favicon?: string;
  meta_keywords?: string;
  meta_author?: string;
  contact_email?: string;
  business_hours?: string;
  social_github?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_instagram?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  dark_mode?: boolean;
  show_animations?: boolean;
  posts_per_page?: number;
  projects_per_page?: number;
  enable_search?: boolean;
  enable_rss?: boolean;
}

