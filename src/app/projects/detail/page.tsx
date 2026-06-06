import { permanentRedirect } from "next/navigation";

type LegacyProjectDetailPageProps = {
  searchParams: Promise<{
    slug?: string | string[];
  }>;
};

function getSingleParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyProjectDetailPage({
  searchParams,
}: LegacyProjectDetailPageProps) {
  const { slug: rawSlug } = await searchParams;
  const slug = getSingleParam(rawSlug);

  if (!slug) {
    permanentRedirect("/projects");
  }

  permanentRedirect(`/projects/${encodeURIComponent(slug)}`);
}
