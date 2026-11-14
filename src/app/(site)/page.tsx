import ClientHome from "../components/ClientHome";
import { Metadata } from "next";
import { serverFetch } from "@/lib/server-fetch";
import { toHomePersonalInfo, toHomePost, toHomeProject, toHomeSkill } from "@/lib/home-payload";
import type { ApiResponse, BlogPost } from "@/types";
import type { HomePageData } from "../components/home/homeTypes";

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

    const blogPosts = getSettledData(blogResponse, []).map(toHomePost);
    const projects = getSettledData(projectResponse, []).map(toHomeProject);
    const skills = getSettledData(skillsResponse, []).map(toHomeSkill);
    const personalInfo = toHomePersonalInfo(getSettledData(personalResponse, undefined));

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
