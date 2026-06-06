import { permanentRedirect } from "next/navigation";

type LegacyBlogPostPageProps = {
  searchParams: Promise<{
    slug?: string | string[];
  }>;
};

function getSingleParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyBlogPostPage({
  searchParams,
}: LegacyBlogPostPageProps) {
  const { slug: rawSlug } = await searchParams;
  const slug = getSingleParam(rawSlug);

  if (!slug) {
    permanentRedirect("/blog");
  }

  permanentRedirect(`/blog/${encodeURIComponent(slug)}`);
}
