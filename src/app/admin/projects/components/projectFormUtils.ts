import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { AdminTagOption } from "@/types";
import { ensureApiSuccess, getErrorMessage } from "@/utils/api-response";

export function generateProjectSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function preprocessProjectContentForAI(
  content: string,
  title: string
): string {
  return content
    .replace(/__projectName__/g, title || "프로젝트")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export function normalizeProjectTagOption(tag: {
  id: string | number;
  name: string;
  color?: string;
  type?: string;
}): AdminTagOption {
  const normalizedType =
    (tag.type as "project" | "general" | "blog" | undefined) ?? "project";
  const safeType: AdminTagOption["type"] =
    normalizedType === "blog" ? "project" : normalizedType;

  return {
    id: String(tag.id),
    name: tag.name,
    color: tag.color || "#6B7280",
    type: safeType ?? "project",
  };
}

export async function fetchProjectTagOptions(): Promise<AdminTagOption[]> {
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
      .filter((tag) => tag.type === "project" || tag.type === "general")
      .map(normalizeProjectTagOption);
  } catch (error) {
    throw new Error(getErrorMessage(error, "태그 목록을 불러오는데 실패했습니다."));
  }
}

export async function uploadProjectImage(file: File): Promise<string> {
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

export async function generateProjectAISummary(
  title: string,
  content: string
): Promise<string> {
  if (!content.trim()) {
    toast.error("요약할 내용이 없습니다. 먼저 프로젝트 내용을 작성해주세요.");
    return "";
  }

  try {
    const preprocessedContent = preprocessProjectContentForAI(content, title);
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

export async function generateProjectAIKeywords(
  title: string,
  content: string
): Promise<string> {
  if (!content.trim()) {
    toast.error("키워드를 추출할 내용이 없습니다. 먼저 프로젝트 내용을 작성해주세요.");
    return "";
  }

  try {
    const preprocessedContent = preprocessProjectContentForAI(content, title);
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
