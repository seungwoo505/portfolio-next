import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "프로젝트",
  description: "React, Next.js, TypeScript 기반으로 구현한 웹 서비스와 운영 도구 프로젝트를 확인할 수 있는 포트폴리오 목록입니다.",
  keywords: "승우, 프로젝트, 포트폴리오, Next.js, TypeScript, React, 웹 서비스, 프론트엔드",
  image: "/og-image.jpg",
  url: "/projects",
});

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return children;
}
