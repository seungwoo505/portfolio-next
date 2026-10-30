const DEFAULT_CLIENT_API_BASE_URL = "https://api.seungwoo.i234.me";
const DEFAULT_SERVER_API_BASE_URL = "http://127.0.0.1:3333";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;

function requireIsolatedApiUrl(value: string | undefined, variable: string): string {
  const normalized = normalizeApiBaseUrl(value);
  try {
    const url = new URL(normalized);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
      !url.username && !url.password && !url.search && !url.hash
    ) {
      return normalized;
    }
  } catch {
    // Missing or relative destinations must never select a public default.
  }
  throw new Error(`Isolated preview requires an explicit loopback URL: ${variable}`);
}

export function normalizeApiBaseUrl(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export function getClientApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === "1") {
    return requireIsolatedApiUrl(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL");
  }
  return (
    normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    DEFAULT_CLIENT_API_BASE_URL
  );
}

export function getServerPublicApiFallbackBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === "1") {
    return requireIsolatedApiUrl(process.env.SERVER_PUBLIC_API_FALLBACK_URL, "SERVER_PUBLIC_API_FALLBACK_URL");
  }
  const runtimeFallbackUrl = normalizeApiBaseUrl(
    process.env.SERVER_PUBLIC_API_FALLBACK_URL
  );

  return ABSOLUTE_HTTP_URL_PATTERN.test(runtimeFallbackUrl)
    ? runtimeFallbackUrl
    : DEFAULT_CLIENT_API_BASE_URL;
}

export function getServerApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_ISOLATED_PREVIEW === "1") {
    return requireIsolatedApiUrl(process.env.INTERNAL_API_URL, "INTERNAL_API_URL");
  }
  const internalApiUrl = normalizeApiBaseUrl(process.env.INTERNAL_API_URL);
  if (internalApiUrl) {
    return internalApiUrl;
  }

  const publicApiUrl = getClientApiBaseUrl();
  return ABSOLUTE_HTTP_URL_PATTERN.test(publicApiUrl)
    ? publicApiUrl
    : DEFAULT_SERVER_API_BASE_URL;
}
