import type { MetadataRoute } from "next";
import { fetchAllPages } from "@/lib/paginated-api";
import { serverFetch } from "@/lib/server-fetch";
import type { BlogPost, Project } from "@/types";

const SITE_URL = "https://seungwoo.i234.me";
const PUBLIC_LIST_PAGE_SIZE = 50;

type SitemapEntry = MetadataRoute.Sitemap[number];

function createUrl(path = ""): string {
  return `${SITE_URL}${path}`;
}

function toLastModified(value?: string): Date {
  return value ? new Date(value) : new Date();
}

async function getBlogPostEntries(): Promise<SitemapEntry[]> {
  try {
    const response = await fetchAllPages<BlogPost>(
      ({ page, limit }) =>
        serverFetch<BlogPost[]>("/public/posts", {
          searchParams: {
            page,
            limit,
            status: "published",
          },
        }),
      { pageSize: PUBLIC_LIST_PAGE_SIZE }
    );

    return (response.data || [])
      .filter((post) => post.slug)
      .map((post) => ({
        url: createUrl(`/blog/${encodeURIComponent(post.slug)}`),
        lastModified: toLastModified(post.updated_at || post.published_at),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

async function getProjectEntries(): Promise<SitemapEntry[]> {
  try {
    const response = await fetchAllPages<Project>(
      ({ page, limit }) =>
        serverFetch<Project[]>("/public/projects", {
          searchParams: {
            page,
            limit,
            status: "published",
          },
        }),
      { pageSize: PUBLIC_LIST_PAGE_SIZE }
    );

    return (response.data || [])
      .filter((project) => project.slug)
      .map((project) => ({
        url: createUrl(`/projects/${encodeURIComponent(project.slug)}`),
        lastModified: toLastModified(project.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [blogPosts, projects] = await Promise.all([
    getBlogPostEntries(),
    getProjectEntries(),
  ]);

  return [
    {
      url: createUrl(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: createUrl("/blog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: createUrl("/projects"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: createUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: createUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...blogPosts,
    ...projects,
  ];
}
