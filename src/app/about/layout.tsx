import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "소개",
  description: "Next.js와 TypeScript를 중심으로 웹 경험, 인터랙션, 운영 도구를 설계하는 프론트엔드 개발자 승우를 소개합니다.",
  keywords: "승우, 소개, 프론트엔드 개발자, Next.js, TypeScript, React, 웹개발",
  image: "/og-image.jpg",
  url: "/about",
  type: "profile",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
