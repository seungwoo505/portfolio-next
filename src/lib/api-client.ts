import type { ApiResponse } from "@/types";
import { getClientApiBaseUrl } from "@/lib/api-config";

export const API_BASE_URL = getClientApiBaseUrl();

type QueryParamValue = string | number | boolean;

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
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Last-Modified": new Date().toUTCString(),
        ...options.headers,
      },
      cache: "no-store",
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok && response.status >= 500) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      if (response.status === 429) {
        throw new Error(
          data.error ||
            data.message ||
            "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          throw new Error("네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.");
        }

        throw error;
      }

      throw new Error("알 수 없는 오류가 발생했습니다.");
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
