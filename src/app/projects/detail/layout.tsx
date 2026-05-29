import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "프로젝트 상세",
  description: "프로젝트의 목표, 주요 기능, 사용 기술, 구현 과정을 정리한 승우의 프로젝트 상세 페이지입니다.",
  keywords: "승우, 프로젝트 상세, 웹개발, Next.js, TypeScript, React, 구현 사례",
  image: "/og-image.jpg",
  url: "/projects/detail",
});

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
