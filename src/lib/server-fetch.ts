import type { ApiResponse } from "@/types";
import {
  getServerApiBaseUrl,
  getServerPublicApiFallbackBaseUrl,
} from "@/lib/api-config";

const DEFAULT_REVALIDATE_SECONDS = 300;
const DEFAULT_PRIMARY_TIMEOUT_MS = 1500;
const DEFAULT_FALLBACK_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 250;
const MAX_TIMEOUT_MS = 30000;

type QueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

type ServerFetchBaseUrl = {
  baseUrl: string;
  isFallback: boolean;
};

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
  base: string,
  path: string,
  searchParams?: Record<string, QueryValue>
): string {
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

function getServerFetchBaseUrls(
  path: string,
  init?: RequestInit
): ServerFetchBaseUrl[] {
  const primaryBaseUrl = getServerApiBaseUrl();
  const method = init?.method?.toUpperCase() ?? "GET";
  const canUsePublicFallback =
    path.startsWith("/public/") && (method === "GET" || method === "HEAD");

  if (!canUsePublicFallback) {
    return [{ baseUrl: primaryBaseUrl, isFallback: false }];
  }

  return Array.from(
    new Set([primaryBaseUrl, getServerPublicApiFallbackBaseUrl()])
  ).map((baseUrl, index) => ({
    baseUrl,
    isFallback: index > 0,
  }));
}

function parseTimeoutMs(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

function getTimeoutMs(isFallback: boolean): number {
  if (isFallback) {
    return parseTimeoutMs(
      process.env.SERVER_FETCH_FALLBACK_TIMEOUT_MS,
      DEFAULT_FALLBACK_TIMEOUT_MS
    );
  }

  return parseTimeoutMs(
    process.env.SERVER_FETCH_PRIMARY_TIMEOUT_MS ??
      process.env.SERVER_FETCH_TIMEOUT_MS,
    DEFAULT_PRIMARY_TIMEOUT_MS
  );
}

function createTimeoutSignal(
  timeoutMs: number,
  upstreamSignal?: AbortSignal | null
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`API 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`));
  }, timeoutMs);

  const abortFromUpstream = () => {
    controller.abort(upstreamSignal?.reason);
  };

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      abortFromUpstream();
    } else {
      upstreamSignal.addEventListener("abort", abortFromUpstream, {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
    },
  };
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
  const baseUrls = getServerFetchBaseUrls(path, options?.init);
  let lastError: unknown = null;

  for (const { baseUrl, isFallback } of baseUrls) {
    const url = buildUrl(baseUrl, path, options?.searchParams);
    const timeout = createTimeoutSignal(
      getTimeoutMs(isFallback),
      options?.init?.signal
    );

    try {
      const response = await fetch(url, {
        cache: "force-cache",
        next: {
          revalidate: options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
        },
        headers: {
          Accept: "application/json",
        },
        ...options?.init,
        signal: timeout.signal,
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
    } catch (error) {
      lastError = error;

      if (baseUrl !== baseUrls[baseUrls.length - 1]?.baseUrl) {
        console.warn(
          `[serverFetch] ${url} 요청 실패, 공개 API fallback을 시도합니다.`,
          error
        );
      }
    } finally {
      timeout.cleanup();
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("API 요청에 실패했습니다.");
}
