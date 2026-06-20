import type { ApiResponse } from "@/types";
import { getServerApiBaseUrl } from "@/lib/api-config";

const DEFAULT_REVALIDATE_SECONDS = 300;

type QueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeApiResponse<T>(data: unknown): ApiResponse<T> {
  if (
    isRecord(data) &&
    data.success === false &&
    !hasText(data.message) &&
    hasText(data.error)
  ) {
    return {
      ...data,
      message: data.error,
    } as ApiResponse<T>;
  }

  return data as ApiResponse<T>;
}

function getApiResponseMessage(data: unknown, fallbackMessage: string): string {
  if (isRecord(data)) {
    if (hasText(data.message)) {
      return data.message;
    }

    if (hasText(data.error)) {
      return data.error;
    }
  }

  return fallbackMessage;
}

function buildUrl(
  path: string,
  searchParams?: Record<string, QueryValue>
): string {
  const base = getServerApiBaseUrl();
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

async function readApiResponse<T>(
  response: Response,
  url: string
): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return normalizeApiResponse<T>({
      success: response.ok,
    });
  }

  try {
    return normalizeApiResponse<T>(JSON.parse(text));
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when requesting ${url}: ${text}`);
    }

    throw new Error(`Invalid JSON response when requesting ${url}`);
  }
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
  const data = await readApiResponse<T>(response, url);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} when requesting ${url}: ${getApiResponseMessage(
        data,
        "API 요청에 실패했습니다."
      )}`
    );
  }

  return data;
}
