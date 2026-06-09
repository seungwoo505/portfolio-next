import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "연락처",
  description: "프로젝트 문의, 협업 제안, 채용 관련 연락을 보낼 수 있는 승우의 포트폴리오 연락처 페이지입니다.",
  keywords: "승우, 연락처, 프로젝트 문의, 협업, 채용, 프론트엔드 개발자",
  image: "/og-image.svg",
  url: "/contact",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
