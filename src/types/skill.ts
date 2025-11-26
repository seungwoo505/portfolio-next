export interface Skill {
  id: string;
  category_id?: string;
  name: string;
  proficiency_level: number;
  years_of_experience?: number;
  icon?: string;
  color?: string;
  display_order: number;
  is_featured: boolean;
  category_name?: string;
}
export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}
