import ClientHome from "../components/ClientHome";
import { Metadata } from "next";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "승우의 포트폴리오 | 프론트엔드 개발자",
  description: "프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.",
  keywords: ["포트폴리오", "프론트엔드 개발자", "React", "Next.js", "TypeScript", "웹개발", "JavaScript", "승우"],
  authors: [{ name: "승우", url: "https://seungwoo.i234.me" }],
  creator: "승우",
  publisher: "승우의 포트폴리오",
  openGraph: {
    title: "승우의 포트폴리오 | 프론트엔드 개발자",
    description: "프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.",
    type: "website",
    locale: "ko_KR",
    url: "https://seungwoo.i234.me",
    siteName: "승우의 포트폴리오",
    images: [
      {
        url: "https://seungwoo.i234.me/og-image.svg",
        width: 1200,
        height: 630,
        alt: "승우의 포트폴리오",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "승우의 포트폴리오 | 프론트엔드 개발자",
    description: "프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.",
    creator: "@seungwoo",
    images: ["https://seungwoo.i234.me/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://seungwoo.i234.me",
  },
  verification: {
    google: "Vl181oV3jRYtolyEhTMDgGAlcusVl2qWA71k43xV_YQ",
  },
};

/**
 * @interface HomePageData
 * @description 홈 페이지에 필요한 모든 데이터를 포함합니다.
 * @property {BlogPost[]} blogPosts 대표 블로그 포스트 목록
 * @property {Array} projects 대표 프로젝트 목록
 * @property {Array} skills 대표 기술 스택 목록
 * @property {Object} personalInfo 개인 정보
 */
interface HomePageData {
  blogPosts: BlogPost[];
  projects: Array<{
    id: string;
    title: string;
    description: string;
    detailed_description?: string;
    excerpt?: string;
    meta_description?: string;
    slug: string;
    featured: boolean;
    image_url?: string;
    created_at: string;
    tags?: string[];
    skills?: string[];
    view_count?: number;
  }>;
  skills: Array<{
    id: string;
    name: string;
    proficiency_level: number;
    category_name?: string;
  }>;
  personalInfo?: {
    full_name?: string;
    name?: string;
    bio?: string;
    about?: string;
  };
}

/**
 * @function normalizeProjectTags
 * @description 프로젝트 태그를 문자열 배열로 정규화합니다.
 * @param tags 태그 배열 (문자열 또는 객체)
 * @returns {string[]} 정규화된 태그 문자열 배열
 */
function normalizeProjectTags(tags: unknown): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map(tag => typeof tag === 'string' ? tag : (tag as { name?: string }).name || String(tag));
}

/**
 * @function normalizeProjectSkills
 * @description 프로젝트 스킬을 문자열 배열로 정규화합니다.
 * @param skills 스킬 배열 (문자열 또는 객체)
 * @returns {string[]} 정규화된 스킬 문자열 배열
 */
function normalizeProjectSkills(skills: unknown): string[] {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(skill => typeof skill === 'string' ? skill : (skill as { name?: string }).name || String(skill));
}

function getSettledData<T>(
  result: PromiseSettledResult<ApiResponse<T>>,
  fallback: T
): T {
  if (result.status !== 'fulfilled' || !result.value.success) {
    return fallback;
  }
  return result.value.data ?? fallback;
}

/**
 * @function getHomeData
 * @description 서버에서 홈 페이지에 필요한 모든 데이터를 가져옵니다.
 * @returns {Promise<HomePageData>} 홈 페이지 데이터
 */
async function getHomeData(): Promise<HomePageData> {
  try {
    const [blogResponse, projectResponse, skillsResponse, personalResponse] = await Promise.allSettled([
      serverFetch<BlogPost[]>('/public/posts', {
        searchParams: { limit: 2, featured: true }
      }),
      serverFetch<Array<unknown>>('/public/projects', {
        searchParams: { limit: 2, featured: true }
      }),
      serverFetch<HomePageData['skills']>('/public/skills/featured'),
      serverFetch<HomePageData['personalInfo']>('/public/profile')
    ]);

    const blogPosts = getSettledData(blogResponse, []);
    const rawProjects = getSettledData(projectResponse, []);

    // 프로젝트 데이터 정규화
    const projects: HomePageData['projects'] = rawProjects.map((project: unknown) => {
      const p = project as Record<string, unknown>;
      return {
        id: String(p.id || ''),
        title: String(p.title || ''),
        description: String(p.description || ''),
        detailed_description: p.detailed_description ? String(p.detailed_description) : undefined,
        excerpt: p.excerpt ? String(p.excerpt) : undefined,
        meta_description: p.meta_description ? String(p.meta_description) : undefined,
        slug: String(p.slug || ''),
        featured: Boolean(p.featured || p.is_featured),
        image_url: p.image_url || p.featured_image ? String(p.image_url || p.featured_image) : undefined,
        created_at: String(p.created_at || new Date().toISOString()),
        tags: normalizeProjectTags(p.tags),
        skills: normalizeProjectSkills(p.skills),
        view_count: typeof p.view_count === 'number' ? p.view_count : undefined
      };
    });

    const skills = getSettledData(skillsResponse, []);
    const personalInfo = getSettledData(personalResponse, undefined);

    return {
      blogPosts,
      projects,
      skills,
      personalInfo
    };
  } catch (error) {
    console.error('홈 페이지 데이터 로딩 실패:', error);
    return {
      blogPosts: [],
      projects: [],
      skills: [],
      personalInfo: undefined
    };
  }
}

/**
 * @component Home
 * @description 서버에서 데이터를 미리 가져와 `ClientHome` 컴포넌트에 전달하는 서버 컴포넌트입니다.
 * @returns {Promise<JSX.Element>} 홈 페이지 컨테이너를 반환합니다.
 */
export default async function Home() {
  const homeData = await getHomeData();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <ClientHome
        blogPosts={homeData.blogPosts}
        projects={homeData.projects}
        skills={homeData.skills}
        personalInfo={homeData.personalInfo}
        loading={false}
      />
    </div>
  );
}
