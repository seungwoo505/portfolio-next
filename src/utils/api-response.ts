import type { ApiResponse } from "@/types";

export function getApiMessage(
  response: Pick<ApiResponse<unknown>, "message" | "error"> | undefined,
  fallback: string
): string {
  return response?.message || response?.error || fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function ensureApiSuccess<T>(
  response: ApiResponse<T>,
  fallback: string
): ApiResponse<T> {
  if (!response.success) {
    throw new Error(getApiMessage(response, fallback));
  }

  return response;
}
