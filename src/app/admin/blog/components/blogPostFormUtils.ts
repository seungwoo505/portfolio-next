import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { AdminTagOption } from "@/types";
import { ensureApiSuccess, getErrorMessage } from "@/utils/api-response";

export function generateBlogSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function preprocessContentForAI(content: string): string {
  return content.replace(/__([^_]+)__/g, (_match, projectName) => {
    return `${projectName} 프로젝트`;
  });
}

export function generateMetaDescription(excerpt: string, content: string): string {
  if (excerpt.trim()) {
    return excerpt.substring(0, 160);
  }

  const firstParagraph =
    content
      .split("\n")
      .find((line) => line.trim().length > 0)
      ?.trim() || "";

  return firstParagraph.substring(0, 160);
}

export function normalizeBlogTagOption(tag: {
  id: string | number;
  name: string;
  color?: string;
  type?: string;
}): AdminTagOption {
  const normalizedType =
    (tag.type as "blog" | "project" | "general" | undefined) ?? "blog";
  const safeType: AdminTagOption["type"] =
    normalizedType === "project" ? "blog" : normalizedType;

  return {
    id: String(tag.id),
    name: tag.name,
    color: tag.color || "#6B7280",
    type: safeType,
  };
}

export async function fetchBlogTagOptions(): Promise<AdminTagOption[]> {
  try {
    const response = await authApi.get("/admin/tags");
    ensureApiSuccess(response, "태그 목록을 불러오는데 실패했습니다.");

    const tagsData = (response.data || []) as Array<{
      type?: string;
      id: string | number;
      name: string;
      color?: string;
    }>;

    return tagsData
      .filter((tag) => tag.type === "blog" || tag.type === "general")
      .map(normalizeBlogTagOption);
  } catch (error) {
    throw new Error(getErrorMessage(error, "태그 목록을 불러오는데 실패했습니다."));
  }
}

export async function uploadBlogImage(file: File): Promise<string> {
  try {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("파일 크기는 5MB 이하여야 합니다.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("지원되지 않는 이미지 형식입니다.");
    }

    const response = await authApi.uploadImage(file);
    const successResponse = ensureApiSuccess(response, "이미지 업로드에 실패했습니다.");
    if (successResponse.data?.url) {
      return successResponse.data.url;
    }

    throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
  } catch (error) {
    throw new Error(getErrorMessage(error, "이미지 업로드에 실패했습니다."));
  }
}

export async function generateBlogAISummary(content: string): Promise<string> {
  if (!content.trim()) {
    toast.error("요약할 내용이 없습니다. 먼저 포스트 내용을 작성해주세요.");
    return "";
  }

  try {
    const preprocessedContent = preprocessContentForAI(content);
    const response = await authApi.generateSummary(preprocessedContent, false);
    const successResponse = ensureApiSuccess(response, "요약 생성에 실패했습니다.");

    if (successResponse.data) {
      return successResponse.data.summary;
    }

    throw new Error("요약 생성 결과를 받지 못했습니다.");
  } catch (error) {
    toast.error(getErrorMessage(error, "AI 요약 생성에 실패했습니다. 수동으로 입력해주세요."));
    return "";
  }
}

export async function generateBlogAIKeywords(content: string): Promise<string> {
  if (!content.trim()) {
    toast.error("키워드를 추출할 내용이 없습니다. 먼저 포스트 내용을 작성해주세요.");
    return "";
  }

  try {
    const preprocessedContent = preprocessContentForAI(content);
    const response = await authApi.generateSummary(preprocessedContent, true);
    const successResponse = ensureApiSuccess(response, "키워드 생성에 실패했습니다.");

    if (successResponse.data) {
      return successResponse.data.keywordsString || "";
    }

    throw new Error("키워드 생성 결과를 받지 못했습니다.");
  } catch (error) {
    toast.error(getErrorMessage(error, "AI 키워드 생성에 실패했습니다. 수동으로 입력해주세요."));
    return "";
  }
}
