import { Metadata } from 'next';

const SITE_URL = 'https://seungwoo.i234.me';
const SITE_NAME = '승우의 포트폴리오';
const DEFAULT_OG_IMAGE = '/og-image.jpg';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords,
    image = DEFAULT_OG_IMAGE,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author = '승우',
    section,
    tags = []
  } = config;
  const fullTitle = title.includes('승우') ? title : `${title} | 승우의 포트폴리오`;
  const fullDescription = description || '웹 개발자 승우의 포트폴리오입니다. React, Next.js, Node.js를 활용한 프로젝트들을 확인해보세요.';
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const finalKeywords = keywords || 
    (tags.length > 0 ? tags.join(', ') : '') || 
    '웹개발, 포트폴리오';
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: fullTitle,
    description: fullDescription,
    keywords: finalKeywords,
    authors: [{ name: author }],
    creator: author,
    publisher: author,
    openGraph: {
      type,
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'ko_KR',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImageUrl],
      creator: '@seungwoo',
      site: '@seungwoo',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: fullUrl,
    },
    verification: {
      google: 'Vl181oV3jRYtolyEhTMDgGAlcusVl2qWA71k43xV_YQ',
    },
  };
}
export function generateStructuredData(config: {
  type: 'WebSite' | 'Article' | 'Person' | 'Project' | 'BlogPosting';
  data: Record<string, unknown>;
}) {
  const { type, data } = config;
  const baseUrl = SITE_URL;
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    url: `${baseUrl}${data.url || ''}`,
    name: data.name || data.title,
    description: data.description,
    image: data.image ? `${baseUrl}${data.image}` : `${baseUrl}/og-image.jpg`,
    datePublished: data.publishedTime || data.created_at,
    dateModified: data.modifiedTime || data.updated_at,
    author: {
      '@type': 'Person',
      name: '승우',
      url: baseUrl,
      jobTitle: '웹 개발자',
      description: 'React, Next.js, Node.js를 활용한 웹 개발자',
    },
    publisher: {
      '@type': 'Person',
      name: '승우',
      url: baseUrl,
    },
  };
  switch (type) {
    case 'WebSite':
      return {
        ...baseStructuredData,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
    case 'Article':
    case 'BlogPosting':
      return {
        ...baseStructuredData,
        headline: data.title,
        articleBody: data.content,
        wordCount: (data.content as string)?.length || 0,
        ...(data.tags ? { keywords: Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags) } : {}),
        ...(data.section ? { articleSection: String(data.section) } : {}),
      };
    case 'Project':
      return {
        ...baseStructuredData,
        projectType: 'Software Application',
        applicationCategory: 'WebApplication',
        operatingSystem: 'Web Browser',
        ...(data.project_url ? { url: String(data.project_url) } : {}),
        ...(data.github_url ? { codeRepository: String(data.github_url) } : {}),
        ...(data.start_date ? { startDate: String(data.start_date) } : {}),
        ...(data.end_date ? { endDate: String(data.end_date) } : {}),
        ...(data.is_ongoing ? { status: 'Active' } : {}),
      };
    case 'Person':
      return {
        ...baseStructuredData,
        jobTitle: '웹 개발자',
        worksFor: {
          '@type': 'Organization',
          name: 'Freelancer',
        },
        knowsAbout: [
          'React',
          'Next.js',
          'Node.js',
          'JavaScript',
          'TypeScript',
          'Web Development',
        ],
        sameAs: [
          'https://github.com/seungwoo',
          'https://linkedin.com/in/seungwoo',
        ],
      };
    default:
      return baseStructuredData;
  }
}
export function generateSitemapData(): Array<{
  url: string;
  lastModified: string;
  changeFrequency: 'weekly' | 'monthly' | 'daily' | 'always' | 'hourly' | 'yearly' | 'never';
  priority: number;
}> {
  const baseUrl = SITE_URL;
  const currentDate = new Date().toISOString();
  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
