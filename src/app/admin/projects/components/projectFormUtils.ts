import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { AdminTagOption } from "@/types";

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
    if (!response.success || !response.data) {
      return [];
    }

    const tagsData = response.data as Array<{
      type?: string;
      id: string | number;
      name: string;
      color?: string;
    }>;

    return tagsData
      .filter((tag) => tag.type === "project" || tag.type === "general")
      .map(normalizeProjectTagOption);
  } catch {
    return [];
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

    if (response.success && response.data) {
      return response.data.summary;
    }

    throw new Error(response.message || "요약 생성에 실패했습니다.");
  } catch {
    toast.error("AI 요약 생성에 실패했습니다. 수동으로 입력해주세요.");
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

    if (response.success && response.data) {
      return response.data.keywordsString || "";
    }

    throw new Error(response.message || "키워드 생성에 실패했습니다.");
  } catch {
    toast.error("AI 키워드 생성에 실패했습니다. 수동으로 입력해주세요.");
    return "";
  }
}
