import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";
import { generateMetadata as createMetadata } from "@/lib/seo";
import { serverFetch } from "@/lib/server-fetch";
import type { BlogPost } from "@/types";

const SITE_URL = "https://seungwoo.i234.me";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function getBlogPostUrl(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

function getTagNames(tags: BlogPost["tags"]): string[] {
  return Array.isArray(tags)
    ? tags.map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean)
    : [];
}

function getDescription(post: BlogPost): string {
  return (
    post.meta_description ||
    post.excerpt ||
    post.content_text?.substring(0, 160) ||
    post.content?.substring(0, 160) ||
    "웹 개발자 승우의 블로그 포스트입니다."
  );
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await serverFetch<BlogPost>(
      `/public/posts/${encodeURIComponent(slug)}`
    );
    return response.success && response.data ? response.data : null;
  } catch {
    return null;
  }
}

function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function createBlogPostStructuredData(post: BlogPost, slug: string) {
  const path = getBlogPostUrl(slug);
  const url = `${SITE_URL}${path}`;
  const tagNames = getTagNames(post.tags);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: getDescription(post),
    author: {
      "@type": "Person",
      name: "승우",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "승우의 포트폴리오",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo.svg`,
      },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: post.featured_image
      ? {
          "@type": "ImageObject",
          url: post.featured_image,
          width: 1200,
          height: 630,
        }
      : undefined,
    keywords: post.meta_keywords
      ? post.meta_keywords.split(",").map((keyword) => keyword.trim())
      : tagNames,
    articleSection: "Technology",
    wordCount: (post.content_text || post.content)
      ? (post.content_text || post.content).split(/\s+/).length
      : undefined,
    timeRequired: post.read_time_minutes
      ? `PT${post.read_time_minutes}M`
      : undefined,
    isPartOf: {
      "@type": "Blog",
      name: "승우의 개발 블로그",
      url: `${SITE_URL}/blog`,
    },
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const post = await getPost(slug);

  if (!post) {
    return createMetadata({
      title: "블로그 글",
      description: "요청한 블로그 글을 찾을 수 없습니다.",
      image: "/og-image.svg",
      url: getBlogPostUrl(slug),
      type: "article",
      section: "Technology",
    });
  }

  const tags = getTagNames(post.tags);

  return createMetadata({
    title: post.title,
    description: getDescription(post),
    keywords:
      post.meta_keywords ||
      (tags.length ? tags.join(", ") : "웹개발, 블로그, React, Next.js"),
    image: post.featured_image || "/og-image.svg",
    url: getBlogPostUrl(slug),
    type: "article",
    publishedTime: post.published_at || post.created_at,
    modifiedTime: post.updated_at,
    section: "Technology",
    tags,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const post = await getPost(slug);

  return (
    <>
      {post ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(createBlogPostStructuredData(post, slug)),
          }}
        />
      ) : null}
      <BlogPostClient slug={slug} initialPost={post} />
    </>
  );
}
