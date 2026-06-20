import type { ApiResponse } from "@/types";
import { getClientApiBaseUrl } from "@/lib/api-config";

export const API_BASE_URL = getClientApiBaseUrl();

export type QueryParamValue = string | number | boolean;

type ApiResponseErrorBody = ApiResponse<unknown> & {
  retryAfter?: number;
};

type ApiRequestErrorOptions = {
  status: number;
  data?: ApiResponseErrorBody;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export class ApiRequestError extends Error {
  status: number;
  response: { status: number; data?: ApiResponseErrorBody };
  retryAfter?: number;

  constructor(message: string, options: ApiRequestErrorOptions) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.response = {
      status: options.status,
      data: options.data,
    };
    this.retryAfter = options.data?.retryAfter;
  }
}

export const normalizeApiResponse = <T>(data: unknown): ApiResponse<T> => {
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
};

export const getApiResponseMessage = (
  data: unknown,
  fallbackMessage: string
): string => {
  if (isRecord(data)) {
    if (hasText(data.message)) {
      return data.message;
    }

    if (hasText(data.error)) {
      return data.error;
    }
  }

  return fallbackMessage;
};

export const readApiResponse = async <T>(
  response: Response
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type") ?? "";
  const rawData = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return normalizeApiResponse<T>(rawData);
};

export const shouldThrowApiResponse = (response: Response): boolean =>
  response.status >= 500 || response.status === 429;

export const createApiRequestError = (
  response: Response,
  data: ApiResponseErrorBody,
  fallbackMessage: string = `HTTP ${response.status}`
): ApiRequestError =>
  new ApiRequestError(getApiResponseMessage(data, fallbackMessage), {
    status: response.status,
    data,
  });

export const throwNormalizedRequestError = (error: unknown): never => {
  if (error instanceof ApiRequestError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.");
    }

    throw error;
  }

  throw new Error("알 수 없는 오류가 발생했습니다.");
};

export const buildHeaders = (
  defaults: HeadersInit,
  overrides?: HeadersInit
): Headers => {
  const headers = new Headers(defaults);

  if (overrides) {
    new Headers(overrides).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
};

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private normalizeEndpoint(endpoint: string): string {
    if (
      endpoint.startsWith("/public") ||
      endpoint.startsWith("/admin") ||
      endpoint.startsWith("/monitoring") ||
      endpoint === "/health"
    ) {
      return endpoint;
    }

    const publicPrefixes = [
      "/social-links",
      "/skills",
      "/projects",
      "/tags",
      "/experiences",
      "/interests",
      "/settings",
      "/contact",
    ];

    return publicPrefixes.some(
      (prefix) =>
        endpoint === prefix ||
        endpoint.startsWith(`${prefix}/`) ||
        endpoint.startsWith(`${prefix}?`)
    )
      ? `/public${endpoint}`
      : endpoint;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    let url = `${this.baseURL}${normalizedEndpoint}`;

    if (options.method === "GET" || !options.method) {
      const separator = normalizedEndpoint.includes("?") ? "&" : "?";
      url += `${separator}_t=${Date.now()}`;
    }

    const config: RequestInit = {
      ...options,
      headers: buildHeaders(
        {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Last-Modified": new Date().toUTCString(),
        },
        options.headers
      ),
      cache: options.cache ?? "no-store",
    };

    try {
      const response = await fetch(url, config);
      const data = await readApiResponse<T>(response);

      if (shouldThrowApiResponse(response)) {
        throw createApiRequestError(
          response,
          data as ApiResponseErrorBody,
          response.status === 429
            ? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
            : `HTTP ${response.status}`
        );
      }

      return data;
    } catch (error) {
      return throwNormalizedRequestError(error);
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, QueryParamValue>
  ): Promise<ApiResponse<T>> {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString()
      : "";
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;

    return this.request<T>(url);
  }

  async post<T>(
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();

export default api;
