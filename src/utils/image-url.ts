export function normalizeImageUrl(src?: string | null): string {
  const trimmedSrc = src?.trim();
  if (!trimmedSrc) {
    return "";
  }

  try {
    const url = new URL(trimmedSrc);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const [owner, repo, mode, branch, ...filePathParts] = pathParts;

    if (
      url.hostname === "github.com" &&
      owner &&
      repo &&
      (mode === "blob" || mode === "raw") &&
      branch &&
      filePathParts.length > 0
    ) {
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePathParts.join("/")}`;
    }

    if (url.hostname === "raw.githubusercontent.com") {
      url.search = "";
      url.hash = "";
      return url.toString();
    }
  } catch {
    return trimmedSrc;
  }

  return trimmedSrc;
}
