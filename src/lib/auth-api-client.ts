import type { ApiResponse } from "@/types";
import {
  API_BASE_URL,
  buildHeaders,
  createApiRequestError,
  readApiResponse,
  shouldThrowApiResponse,
  throwNormalizedRequestError,
  type QueryParamValue,
} from "@/lib/api-client";

type ApiResponseErrorBody = ApiResponse<unknown> & {
  retryAfter?: number;
};

type AuthTokenSnapshot = {
  token: string | null;
  refreshToken: string | null;
  sessionVersion: number;
};

type PendingAuthResponse = {
  snapshot: AuthTokenSnapshot;
  completed: Promise<void>;
  finish: () => void;
};

export class AuthenticatedApiClient {
  private baseURL: string;
  private token: string | null = null;
  private sessionVersion = 0;
  private pendingResponses = new Set<PendingAuthResponse>();

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.sessionVersion += 1;
    this.storeToken(token);
  }

  private storeToken(token: string) {
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
    this.sessionVersion += 1;
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

  getSessionVersion(): number {
    return this.sessionVersion;
  }

  private getTokenSnapshot(): AuthTokenSnapshot {
    return {
      token: this.getToken(),
      refreshToken: this.getRefreshToken(),
      sessionVersion: this.sessionVersion,
    };
  }

  private haveTokensChanged(snapshot: AuthTokenSnapshot): boolean {
    const current = this.getTokenSnapshot();
    return (
      current.token !== snapshot.token ||
      current.refreshToken !== snapshot.refreshToken
    );
  }

  private async waitForConcurrentTokenRefresh(
    snapshot: AuthTokenSnapshot
  ): Promise<boolean> {
    while (this.sessionVersion === snapshot.sessionVersion) {
      if (this.haveTokensChanged(snapshot)) return true;
      const pending = [...this.pendingResponses].filter(({ snapshot: other }) =>
        other.sessionVersion === snapshot.sessionVersion &&
        other.token === snapshot.token && other.refreshToken === snapshot.refreshToken
      );
      if (pending.length === 0) return false;
      // 응답 처리를 마친 요청은 대기 집합에서 먼저 빠지므로 서로 401을 기다리지 않는다.
      await Promise.race(pending.map(({ completed }) => completed));
    }
    return false;
  }

  private trackResponse(snapshot: AuthTokenSnapshot): () => void {
    let complete!: () => void;
    const completed = new Promise<void>((resolve) => { complete = resolve; });
    const pending = { snapshot, completed, finish: complete };
    this.pendingResponses.add(pending);
    return () => {
      this.pendingResponses.delete(pending);
      pending.finish();
    };
  }

  private canApplyTokens(snapshot: AuthTokenSnapshot): boolean {
    return this.sessionVersion === snapshot.sessionVersion && !this.haveTokensChanged(snapshot);
  }

  private applyResponseTokens(response: Response, snapshot: AuthTokenSnapshot) {
    if (!this.canApplyTokens(snapshot)) return;
    const newToken = response.headers.get("X-New-Token");
    const newRefreshToken = response.headers.get("X-New-Refresh-Token");

    if (newToken) {
      this.storeToken(newToken);
    }

    if (newRefreshToken) {
      this.setRefreshToken(newRefreshToken);
    }
  }

  private async send<T>(url: string, options: RequestInit, snapshot: AuthTokenSnapshot) {
    const finish = this.trackResponse(snapshot);
    try {
      const response = await fetch(url, this.buildRequestConfig(options, snapshot));
      this.applyResponseTokens(response, snapshot);
      const data = await readApiResponse<T>(response);
      return { response, data };
    } finally {
      finish();
    }
  }

  private buildRequestConfig(
    options: RequestInit,
    tokens: AuthTokenSnapshot
  ): RequestInit {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    return {
      ...options,
      headers: buildHeaders(
        {
          ...(!isFormData && { "Content-Type": "application/json" }),
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Last-Modified": new Date().toUTCString(),
          ...(tokens.token && { Authorization: `Bearer ${tokens.token}` }),
          ...(tokens.refreshToken && { "X-Refresh-Token": tokens.refreshToken }),
        },
        options.headers
      ),
      cache: options.cache ?? "no-store",
    };
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

    const tokenSnapshot = this.getTokenSnapshot();

    try {
      let { response, data } = await this.send<T>(url, options, tokenSnapshot);
      let responseSnapshot = tokenSnapshot;

      if (
        response.status === 401 &&
        (await this.waitForConcurrentTokenRefresh(tokenSnapshot)) &&
        this.sessionVersion === tokenSnapshot.sessionVersion
      ) {
        const retrySnapshot = this.getTokenSnapshot();
        ({ response, data } = await this.send<T>(url, options, retrySnapshot));
        responseSnapshot = retrySnapshot;
      }

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
        await this.handleTokenExpiration(responseSnapshot);
      }

      return data;
    } catch (error) {
      return throwNormalizedRequestError(error);
    }
  }

  private async handleTokenExpiration(snapshot?: AuthTokenSnapshot) {
    if (snapshot && !this.canApplyTokens(snapshot)) return;
    this.clearToken();
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin") &&
      window.location.pathname !== "/admin-login"
    ) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 인증 실패 시 기존 관리자 상태를 폐기하도록 전체 문서를 다시 로드한다.
      window.location.href = "/admin-login";
    }
  }

  async refreshToken(): Promise<boolean> {
    const snapshot = this.getTokenSnapshot();
    if (!snapshot.refreshToken) return false;
    const finish = this.trackResponse(snapshot);
    let status: number | undefined;
    let refreshed = false;
    try {
      const response = await fetch(`${this.baseURL}/admin/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: snapshot.refreshToken }),
      });
      status = response.status;
      const data = await readApiResponse<{
        token: string;
        refreshToken?: string;
      }>(response);

      if (response.ok && data.success && data.data?.token && this.canApplyTokens(snapshot)) {
        this.storeToken(data.data.token);
        if (data.data.refreshToken) {
          this.setRefreshToken(data.data.refreshToken);
        }
        refreshed = true;
      }
    } catch {
      // 네트워크·응답 유실은 토큰 무효의 증거가 아니므로 재시도할 자격 증명을 보존한다.
    } finally {
      finish();
    }
    if (refreshed) return true;
    if (status === 401) {
      if (await this.waitForConcurrentTokenRefresh(snapshot)) return true;
      await this.handleTokenExpiration(snapshot);
    }
    return false;
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

    try {
      return await this.request<{ url: string }>("/admin/upload/image", {
        method: "POST",
        body: formData,
      });
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
