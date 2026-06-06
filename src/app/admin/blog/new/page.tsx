"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import type { AdminBlogPostForm, AdminTagOption } from "@/types";
import BlogPostForm from "../components/BlogPostForm";
import {
  fetchBlogTagOptions,
  generateBlogAIKeywords,
  generateBlogAISummary,
  generateBlogSlug,
  generateMetaDescription,
  uploadBlogImage,
} from "../components/blogPostFormUtils";

const initialFormData: AdminBlogPostForm = {
  title: "",
  content: "",
  excerpt: "",
  slug: "",
  meta_description: "",
  meta_keywords: "",
  featured_image: "",
  is_published: false,
  is_featured: false,
  tags: [],
};

export default function NewBlogPost() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState<AdminBlogPostForm>(initialFormData);
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    fetchBlogTagOptions().then(setAvailableTags);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTagDropdown && !target.closest(".tag-dropdown-container")) {
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
      slug: generateBlogSlug(title),
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
      meta_description:
        prev.meta_description || generateMetaDescription(prev.excerpt, content),
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

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("제목과 내용은 필수입니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        title: formData.title || "",
        slug: formData.slug || "",
        content: formData.content || "",
        excerpt: formData.excerpt || "",
        featured_image: formData.featured_image || null,
        meta_title: formData.title || "",
        meta_description: formData.meta_description || "",
        meta_keywords: formData.meta_keywords || "",
        is_published: publish,
        is_featured: formData.is_featured,
        tags: selectedTags.map((tag) => tag.name),
        category_id: null,
        reading_time: null,
        author_id: null,
        published_at: publish ? new Date().toISOString() : null,
      };

      const response = await authApi.post("/admin/blog/posts", postData);
      if (response.success) {
        toast.success(
          publish ? "포스트가 발행되었습니다!" : "포스트가 저장되었습니다!"
        );
        router.push("/admin/blog");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`저장 중 오류가 발생했습니다: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BlogPostForm
      formData={formData}
      setFormData={setFormData}
      isDarkMode={isDarkMode}
      availableTags={availableTags}
      selectedTags={selectedTags}
      showTagDropdown={showTagDropdown}
      tagSearchQuery={tagSearchQuery}
      isSubmitting={isSubmitting}
      onTitleChange={handleTitleChange}
      onContentChange={handleContentChange}
      onImageUpload={uploadBlogImage}
      onToggleTag={toggleTag}
      onTagDropdownChange={setShowTagDropdown}
      onTagSearchQueryChange={setTagSearchQuery}
      onGenerateSummary={generateBlogAISummary}
      onGenerateKeywords={generateBlogAIKeywords}
      onSubmit={handleSubmit}
    />
  );
}
