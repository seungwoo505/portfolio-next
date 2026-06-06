"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { AdminProjectForm, AdminTagOption } from "@/types";
import ProjectAdminForm from "../components/ProjectAdminForm";
import {
  fetchProjectTagOptions,
  generateProjectAIKeywords,
  generateProjectAISummary,
  generateProjectSlug,
} from "../components/projectFormUtils";

const initialFormData: AdminProjectForm = {
  title: "",
  slug: "",
  description: "",
  content: "",
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

export default function NewProject() {
  const router = useRouter();
  const [formData, setFormData] = useState<AdminProjectForm>(initialFormData);
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!formData.start_date) {
      toast.error("시작일을 입력해주세요.");
      return;
    }

    if (!formData.is_ongoing && !formData.end_date) {
      toast.error("종료일을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: formData.content,
        excerpt: formData.excerpt || null,
        meta_description: formData.meta_description || null,
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

      const response = await authApi.post("/admin/projects", projectData);
      if (response.success) {
        toast.success("프로젝트가 성공적으로 생성되었습니다!");
        router.push("/admin/projects");
      }
    } catch {
      toast.error("프로젝트 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
