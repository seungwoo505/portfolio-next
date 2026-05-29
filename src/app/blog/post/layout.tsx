import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateMetadata as createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "블로그 글",
  description: "웹 개발 과정에서 얻은 문제 해결 경험과 구현 노트를 정리한 승우의 블로그 글입니다.",
  keywords: "승우, 블로그 글, 웹개발, 프론트엔드, Next.js, TypeScript, React",
  image: "/og-image.jpg",
  url: "/blog/post",
  type: "article",
  section: "Technology",
});

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return children;
}
