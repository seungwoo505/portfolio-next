import type {
  HomePersonalInfo,
  HomePost,
  HomeProject,
  HomeSkill,
} from "@/app/components/home/homeTypes";

// 홈에서는 본문을 사용하지 않으므로 기존 표시용 요약을 데이터 경계에서 계산합니다.
export function toHomePost(post: HomePost & { content?: string }): HomePost {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 140),
    slug: post.slug,
    created_at: post.created_at,
    view_count: post.view_count,
  };
}

function normalizeTechnologyNames(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map(value => typeof value === 'string' ? value : (value as { name?: string }).name || String(value));
}

export function toHomeProject(project: unknown): HomeProject {
  const value = project as Record<string, unknown>;
  return {
    id: String(value.id || ''),
    title: String(value.title || ''),
    description: String(value.description || ''),
    excerpt: value.excerpt ? String(value.excerpt) : undefined,
    slug: String(value.slug || ''),
    featured: Boolean(value.featured || value.is_featured),
    image_url: value.image_url || value.featured_image ? String(value.image_url || value.featured_image) : undefined,
    tags: normalizeTechnologyNames(value.tags),
    skills: normalizeTechnologyNames(value.skills),
    view_count: typeof value.view_count === 'number' ? value.view_count : undefined,
  };
}

export function toHomeSkill(skill: HomeSkill): HomeSkill {
  return { id: skill.id, name: skill.name, category_name: skill.category_name };
}

export function toHomePersonalInfo(personalInfo?: HomePersonalInfo): HomePersonalInfo | undefined {
  if (!personalInfo) return undefined;
  if (!Object.keys(personalInfo).length) return {};
  return {
    full_name: personalInfo.full_name,
    name: personalInfo.name,
    bio: personalInfo.bio,
    about: personalInfo.about,
  };
}
