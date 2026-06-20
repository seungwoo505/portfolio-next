"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import type { AdminBlogPostForm, AdminTagOption } from "@/types";
import type { BlockEditorValue } from "@/utils/block-content";
import { ensureApiSuccess, getErrorMessage } from "@/utils/api-response";
import { AdminErrorState } from "../../components/AdminState";
import BlogPostForm from "../components/BlogPostForm";
import {
  fetchBlogTagOptions,
  generateBlogAIKeywords,
  generateBlogAISummary,
  generateBlogSlug,
  normalizeBlogTagOption,
  uploadBlogImage,
} from "../components/blogPostFormUtils";

const initialFormData: AdminBlogPostForm = {
  title: "",
  content: "",
  content_json: undefined,
  content_html: "",
  content_text: "",
  excerpt: "",
  slug: "",
  meta_description: "",
  meta_keywords: "",
  featured_image: "",
  is_published: false,
  is_featured: false,
  tags: [],
};

function EditBlogPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postSlug = searchParams.get("slug");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState<AdminBlogPostForm>(initialFormData);
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const loadPost = useCallback(async () => {
    if (!postSlug) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await authApi.get(`/admin/blog/posts/slug/${postSlug}`);
      ensureApiSuccess(response, "포스트를 불러오는데 실패했습니다.");
      const post = response.data as {
        id: string;
        title: string;
        content: string;
        content_json?: unknown;
        content_html?: string;
        content_text?: string;
        excerpt: string;
        slug: string;
        meta_description: string;
        meta_keywords: string;
        featured_image: string;
        is_published: boolean;
        featured: boolean;
        tags: {
          id: string | number;
          name: string;
          color?: string;
          type?: string;
        }[];
      };

      setFormData({
        title: post.title || "",
        content: post.content || "",
        content_json: post.content_json,
        content_html: post.content_html || "",
        content_text: post.content_text || "",
        excerpt: post.excerpt || "",
        slug: post.slug || "",
        meta_description: post.meta_description || "",
        meta_keywords: post.meta_keywords || "",
        featured_image: post.featured_image || "",
        is_published: post.is_published || false,
        is_featured: Boolean(post.featured),
        tags: [],
      });

      const postTags = Array.isArray(post.tags) ? post.tags : [];
      const formattedTags = postTags.map(normalizeBlogTagOption);
      const uniqueTags = formattedTags.filter(
        (tag, index, self) =>
          index === self.findIndex((item) => item.id === tag.id)
      );
      setSelectedTags(uniqueTags);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "포스트를 불러오는데 실패했습니다.");
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    fetchBlogTagOptions()
      .then(setAvailableTags)
      .catch((error) => {
        toast.error(getErrorMessage(error, "태그 목록을 불러오는데 실패했습니다."));
      });
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

  const handleContentChange = (content: string, blockValue?: BlockEditorValue) => {
    setFormData((prev) => ({
      ...prev,
      content,
      content_json: blockValue?.blocks ?? prev.content_json,
      content_html: blockValue?.html ?? prev.content_html,
      content_text: blockValue?.text ?? prev.content_text,
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

  const handleSubmit = async (publish: boolean) => {
    if (isSubmitting) return;
    const writableContent = formData.content_text || formData.content;
    if (!formData.title.trim() || !writableContent.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    if (!postSlug) {
      toast.error("포스트 슬러그가 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        title: formData.title || "",
        slug: formData.slug || "",
        content: formData.content || "",
        content_json: formData.content_json || null,
        content_html: formData.content_html || "",
        content_text: formData.content_text || "",
        excerpt: formData.excerpt || "",
        featured_image: formData.featured_image || null,
        meta_title: formData.title || "",
        meta_description: formData.meta_description || "",
        meta_keywords: formData.meta_keywords || "",
        is_published: publish,
        is_featured: formData.is_featured || false,
        tags: selectedTags.map((tag) => tag.name),
        category_id: null,
        reading_time: null,
        author_id: null,
        published_at: publish ? new Date().toISOString() : null,
      };

      const response = await authApi.put(
        `/admin/blog/posts/slug/${postSlug}`,
        postData
      );
      ensureApiSuccess(response, "포스트 수정에 실패했습니다.");
      toast.success(
        publish ? "포스트가 발행되었습니다!" : "포스트가 저장되었습니다!"
      );
      router.push("/admin/blog");
    } catch (error) {
      toast.error(getErrorMessage(error, "포스트 수정에 실패했습니다."));
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

  if (!postSlug) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              포스트 ID가 필요합니다
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              URL에 포스트 ID가 포함되어야 합니다.
            </p>
            <Link
              href="/admin/blog"
              prefetch={false}
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>블로그 목록으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/admin/blog"
              prefetch={false}
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>블로그 목록으로 돌아가기</span>
            </Link>
          </div>
          <AdminErrorState
            title="포스트를 불러오지 못했습니다"
            description={loadError}
            onRetry={loadPost}
          />
        </div>
      </div>
    );
  }

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

export default function EditBlogPost() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                블로그 포스트를 불러오는 중...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <EditBlogPostContent />
    </Suspense>
  );
}
