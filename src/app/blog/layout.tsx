import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "블로그",
  description: "프론트엔드 개발, Next.js, TypeScript, 웹 성능, 운영 경험을 정리한 승우의 기술 블로그입니다.",
  keywords: "승우, 기술 블로그, 프론트엔드, Next.js, TypeScript, React, 웹 성능",
  image: "/og-image.jpg",
  url: "/blog",
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
