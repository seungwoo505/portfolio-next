import type { ApiResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://seungwoo.i234.me:3333/api";
const DEFAULT_REVALIDATE_SECONDS = 300;

type QueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

function buildUrl(
  path: string,
  searchParams?: Record<string, QueryValue>
): string {
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`${base}/${normalizedPath}`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        url.searchParams.set(
          key,
          value.map((item) => String(item)).join(",")
        );
      } else if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function serverFetch<T>(
  path: string,
  options?: {
    searchParams?: Record<string, QueryValue>;
    revalidateSeconds?: number;
    init?: RequestInit;
  }
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, options?.searchParams);
  const response = await fetch(url, {
    cache: "force-cache",
    next: {
      revalidate: options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
    },
    headers: {
      Accept: "application/json",
    },
    ...options?.init,
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} when requesting ${url}: ${await response.text()}`
    );
  }

  return (await response.json()) as ApiResponse<T>;
}

