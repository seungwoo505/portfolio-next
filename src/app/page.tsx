import ClientHome from "./components/ClientHome";
import { Metadata } from "next";
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
        url: "https://seungwoo.i234.me/og-image.jpg",
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
    images: ["https://seungwoo.i234.me/og-image.jpg"],
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
    google: "your-google-verification-code",
  },
};
/**
 * @component Home
 * @description 인터랙티브한 `ClientHome` 컴포넌트를 사용해 퍼블릭 랜딩 페이지를 렌더링합니다.
 * @returns {JSX.Element} 홈 페이지 컨테이너를 반환합니다.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <ClientHome />
    </div>
  );
}