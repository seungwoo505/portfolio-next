import type { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";
import { generateMetadata as createMetadata } from "@/lib/seo";
import { serverFetch } from "@/lib/server-fetch";
import type { Project } from "@/types";

const SITE_URL = "https://seungwoo.i234.me";

type ProjectDetailPageProps = {
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

function getProjectUrl(slug: string): string {
  return `/projects/${encodeURIComponent(slug)}`;
}

function getTagNames(tags: Project["tags"]): string[] {
  return Array.isArray(tags)
    ? tags.map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean)
    : [];
}

function getDescription(project: Project): string {
  return (
    project.excerpt ||
    project.meta_description ||
    project.description ||
    project.content_text?.slice(0, 160) ||
    "웹 개발자 승우의 프로젝트입니다."
  );
}

function getProjectImage(project: Project): string {
  return project.featured_image || project.image_url || "/og-image.svg";
}

async function getProject(slug: string): Promise<Project | null> {
  try {
    const response = await serverFetch<Project>(
      `/public/projects/${encodeURIComponent(slug)}`
    );
    return response.success && response.data ? response.data : null;
  } catch {
    return null;
  }
}

function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function createProjectStructuredData(project: Project, slug: string) {
  const path = getProjectUrl(slug);
  const url = `${SITE_URL}${path}`;
  const image = project.featured_image || project.image_url;
  const tagNames = getTagNames(project.tags);

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: getDescription(project),
    author: {
      "@type": "Person",
      name: "승우",
      url: SITE_URL,
    },
    url,
    image: image
      ? {
          "@type": "ImageObject",
          url: image,
          width: 1200,
          height: 630,
        }
      : undefined,
    dateCreated: project.start_date,
    dateModified: project.updated_at,
    keywords: project.meta_keywords
      ? project.meta_keywords.split(",").map((keyword) => keyword.trim())
      : tagNames,
    about: tagNames,
    isPartOf: {
      "@type": "WebSite",
      name: "승우의 포트폴리오",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: project.title,
      description: getDescription(project),
      applicationCategory: "WebApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
      url: project.demo_url || project.project_url,
      downloadUrl: project.github_url,
      screenshot: image,
    },
  };
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const project = await getProject(slug);

  if (!project) {
    return createMetadata({
      title: "프로젝트 상세",
      description: "요청한 프로젝트를 찾을 수 없습니다.",
      image: "/og-image.svg",
      url: getProjectUrl(slug),
    });
  }

  const tags = getTagNames(project.tags);

  return createMetadata({
    title: project.title,
    description: getDescription(project),
    keywords:
      project.meta_keywords ||
      (tags.length ? tags.join(", ") : "웹개발, 프로젝트, React, Next.js"),
    image: getProjectImage(project),
    url: getProjectUrl(slug),
    tags,
  });
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const project = await getProject(slug);

  return (
    <>
      {project ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(createProjectStructuredData(project, slug)),
          }}
        />
      ) : null}
      <ProjectDetailClient slug={slug} initialProject={project} />
    </>
  );
}
