import type { ApiResponse } from "@/types";
import {
  API_BASE_URL,
  buildHeaders,
  createApiRequestError,
  getApiResponseMessage,
  readApiResponse,
  shouldThrowApiResponse,
  throwNormalizedRequestError,
  type QueryParamValue,
} from "@/lib/api-client";

type ApiResponseErrorBody = ApiResponse<unknown> & {
  retryAfter?: number;
};

export class AuthenticatedApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_token", token);
    }
  }

  setRefreshToken(refreshToken: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_refresh_token", refreshToken);
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_refresh_token");
    }

    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_refresh_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token");
    }

    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;

    if (options.method === "GET" || !options.method) {
      const separator = endpoint.includes("?") ? "&" : "?";
      url += `${separator}_t=${Date.now()}`;
    }

    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    const config: RequestInit = {
      ...options,
      headers: buildHeaders(
        {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Last-Modified": new Date().toUTCString(),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(refreshToken && { "X-Refresh-Token": refreshToken }),
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

      if (response.status === 401) {
        await this.handleTokenExpiration();
      }

      const newToken = response.headers.get("X-New-Token");
      if (newToken) {
        this.setToken(newToken);
      }

      return data;
    } catch (error) {
      return throwNormalizedRequestError(error);
    }
  }

  private async handleTokenExpiration() {
    this.clearToken();
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    ) {
      window.location.href = "/admin-login";
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/admin/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearToken();
        return false;
      }

      const data = await readApiResponse<{ token: string }>(response);

      if (data.success && data.data?.token) {
        this.setToken(data.data.token);
        return true;
      }

      this.clearToken();
      return false;
    } catch {
      this.clearToken();
      return false;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.get("/admin/me");
      return response.success;
    } catch (error: unknown) {
      if (
        (error as { response?: { status: number }; message?: string })?.response
          ?.status === 401 ||
        (error as { message?: string })?.message?.includes("401")
      ) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return true;
        }

        await this.handleTokenExpiration();
        return false;
      }

      return false;
    }
  }

  startTokenValidation(intervalMs: number = 2 * 60 * 1000) {
    if (typeof window === "undefined") return;
    const token = this.getToken();
    if (!token) return;

    const interval = setInterval(async () => {
      const isValid = await this.validateToken();
      if (!isValid) {
        clearInterval(interval);
      }
    }, intervalMs);

    window.addEventListener("beforeunload", () => {
      clearInterval(interval);
    });

    return interval;
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

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("image", file);
    const token = this.getToken();
    const url = `${this.baseURL}/admin/upload/image`;
    const config: RequestInit = {
      method: "POST",
      headers: buildHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await readApiResponse<{ url: string }>(response);

      if (!response.ok) {
        return {
          success: false,
          message: getApiResponseMessage(data, `HTTP error! status: ${response.status}`),
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      };
    }
  }

  async generateSummary(
    content: string,
    includeKeywords?: boolean
  ): Promise<
    ApiResponse<{
      summary: string;
      keywords?: string[];
      keywordsString?: string;
      originalLength: number;
      summaryLength: number;
    }>
  > {
    return this.post<{
      summary: string;
      keywords?: string[];
      keywordsString?: string;
      originalLength: number;
      summaryLength: number;
    }>("/admin/ai/summarize", { content, includeKeywords });
  }

  async generateKeywords(
    content: string,
    maxKeywords?: number
  ): Promise<
    ApiResponse<{
      keywords: string[];
      keywordsString: string;
      originalLength: number;
      keywordCount: number;
    }>
  > {
    return this.post<{
      keywords: string[];
      keywordsString: string;
      originalLength: number;
      keywordCount: number;
    }>("/admin/ai/keywords", { content, maxKeywords });
  }

  async createCategory(
    name: string
  ): Promise<ApiResponse<{ id: string; name: string }>> {
    return this.post<{ id: string; name: string }>(
      "/admin/skills/categories",
      { name }
    );
  }

  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/admin/skills/categories/${id}`);
  }
}

export const authApi = new AuthenticatedApiClient();
