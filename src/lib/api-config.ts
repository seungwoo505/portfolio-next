const DEFAULT_CLIENT_API_BASE_URL = "https://api.seungwoo.i234.me";
const DEFAULT_SERVER_API_BASE_URL = "http://127.0.0.1:3333";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;

export function normalizeApiBaseUrl(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export function getClientApiBaseUrl(): string {
  return (
    normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    DEFAULT_CLIENT_API_BASE_URL
  );
}

export function getServerApiBaseUrl(): string {
  const internalApiUrl = normalizeApiBaseUrl(process.env.INTERNAL_API_URL);
  if (internalApiUrl) {
    return internalApiUrl;
  }

  const publicApiUrl = getClientApiBaseUrl();
  return ABSOLUTE_HTTP_URL_PATTERN.test(publicApiUrl)
    ? publicApiUrl
    : DEFAULT_SERVER_API_BASE_URL;
}
