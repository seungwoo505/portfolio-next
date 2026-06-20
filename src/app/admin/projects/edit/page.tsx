"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import type { AdminProjectForm, AdminTagOption, Project } from "@/types";
import { ensureApiSuccess, getErrorMessage } from "@/utils/api-response";
import ProjectAdminForm from "../components/ProjectAdminForm";
import {
  fetchProjectTagOptions,
  generateProjectAIKeywords,
  generateProjectAISummary,
  generateProjectSlug,
  normalizeProjectTagOption,
  uploadProjectImage,
} from "../components/projectFormUtils";

const initialFormData: AdminProjectForm = {
  title: "",
  slug: "",
  description: "",
  content: "",
  content_json: null,
  content_html: "",
  content_text: "",
  excerpt: "",
  meta_description: "",
  featured_image: "",
  project_url: "",
  github_url: "",
  tags: [],
  start_date: "",
  end_date: "",
  is_featured: false,
  is_published: false,
  is_ongoing: false,
  meta_keywords: "",
};

function EditProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("slug");
  const [formData, setFormData] = useState<AdminProjectForm>(initialFormData);
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectSlug) {
        toast.error("프로젝트 슬러그가 필요합니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await authApi.get(`/admin/projects/slug/${projectSlug}`);
        if (response.success && response.data) {
          const project = response.data as Project;

          setFormData({
            title: project.title || "",
            slug: project.slug || "",
            description: project.description || "",
            content: project.content || "",
            content_json: project.content_json ?? null,
            content_html: project.content_html || "",
            content_text: project.content_text || "",
            excerpt: project.excerpt || "",
            meta_description: project.meta_description || "",
            featured_image: project.featured_image || project.image_url || "",
            project_url: project.project_url || project.demo_url || "",
            github_url: project.github_url || "",
            tags: [],
            start_date: project.start_date ? project.start_date.split("T")[0] : "",
            end_date: project.end_date ? project.end_date.split("T")[0] : "",
            is_featured: Boolean(project.featured),
            is_published: project.status === "completed" || false,
            is_ongoing: project.status === "in_progress" || false,
            meta_keywords: project.meta_keywords || "",
          });

          const projectTags = Array.isArray(project.tags) ? project.tags : [];
          const formattedTags = projectTags.map((tag, index) => {
            if (typeof tag === "string") {
              return {
                id: `${project.id}-tag-${index}`,
                name: tag,
                color: "#6B7280",
                type: "project" as const,
              };
            }

            return normalizeProjectTagOption(tag);
          });
          setSelectedTags(formattedTags);
        }
      } catch {
        toast.error("프로젝트를 불러오는데 실패했습니다.");
        router.push("/admin/projects");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectSlug, router]);

  useEffect(() => {
    fetchProjectTagOptions().then(setAvailableTags);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTagDropdown && !target.closest(".project-tag-dropdown")) {
        setShowTagDropdown(false);
        setTagSearchQuery("");
      }
    };

    if (showTagDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTagDropdown]);

  useEffect(() => {
    if (showTagDropdown) {
      setTagSearchQuery("");
    }
  }, [showTagDropdown]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateProjectSlug(title),
    }));
  };

  const toggleTag = (tag: AdminTagOption) => {
    setSelectedTags((prev) => {
      const isSelected = prev.some((selected) => selected.id === tag.id);
      return isSelected
        ? prev.filter((selected) => selected.id !== tag.id)
        : [...prev, tag];
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    const projectDescription =
      formData.description.trim() ||
      formData.excerpt.trim() ||
      (formData.content_text || formData.content).trim().slice(0, 220);

    if (!projectDescription) {
      toast.error("한 줄 소개를 입력해주세요.");
      return;
    }

    if (!formData.start_date) {
      toast.error("시작일을 입력해주세요.");
      return;
    }

    if (!formData.is_ongoing && !formData.end_date) {
      toast.error("종료일을 입력해주세요.");
      return;
    }

    if (!projectSlug) {
      toast.error("프로젝트 슬러그가 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectData = {
        title: formData.title,
        slug: formData.slug,
        description: projectDescription,
        content: formData.content,
        content_json: formData.content_json ?? null,
        content_html: formData.content_html || null,
        content_text: formData.content_text || null,
        excerpt: formData.excerpt || projectDescription,
        meta_description:
          formData.meta_description || formData.excerpt || projectDescription,
        featured_image: formData.featured_image || null,
        project_url: formData.project_url || null,
        github_url: formData.github_url || null,
        tags: selectedTags.map((tag) => tag.name),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        is_ongoing: formData.is_ongoing,
        meta_keywords: formData.meta_keywords || null,
      };

      const response = await authApi.put(
        `/admin/projects/slug/${projectSlug}`,
        projectData
      );
      ensureApiSuccess(response, "프로젝트 수정에 실패했습니다.");
      toast.success("프로젝트가 성공적으로 수정되었습니다!");
      router.push("/admin/projects");
    } catch (error) {
      toast.error(getErrorMessage(error, "프로젝트 수정에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
              <div className="h-96 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!projectSlug) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              프로젝트 슬러그가 필요합니다
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              URL에 프로젝트 슬러그가 포함되어야 합니다.
            </p>
            <Link
              href="/admin/projects"
              prefetch={false}
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>프로젝트 목록으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectAdminForm
      formData={formData}
      setFormData={setFormData}
      isDarkMode={isDarkMode}
      availableTags={availableTags}
      selectedTags={selectedTags}
      showTagDropdown={showTagDropdown}
      tagSearchQuery={tagSearchQuery}
      isSubmitting={isSubmitting}
      onTitleChange={handleTitleChange}
      onContentChange={(content, blockValue) =>
        setFormData((prev) => ({
          ...prev,
          content,
          content_json: blockValue?.blocks ?? null,
          content_html: blockValue?.html ?? "",
          content_text: blockValue?.text ?? "",
        }))
      }
      onImageUpload={uploadProjectImage}
      onToggleTag={toggleTag}
      onTagDropdownChange={setShowTagDropdown}
      onTagSearchQueryChange={setTagSearchQuery}
      onGenerateSummary={(content) =>
        generateProjectAISummary(formData.title, content)
      }
      onGenerateKeywords={(content) =>
        generateProjectAIKeywords(formData.title, content)
      }
      onSubmit={handleSubmit}
    />
  );
}

export default function EditProject() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                프로젝트 정보를 불러오는 중...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <EditProjectContent />
    </Suspense>
  );
}
