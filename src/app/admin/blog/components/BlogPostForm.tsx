"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { Plus, Save, Search, Tag, X } from "lucide-react";
import type { Dispatch, FormEvent, KeyboardEvent, SetStateAction } from "react";
import type { AdminBlogPostForm, AdminTagOption } from "@/types";
import type { BlockEditorValue } from "@/utils/block-content";
import { getErrorMessage } from "@/utils/api-response";

const BlogBlockEditor = dynamic(() => import("./BlogBlockEditor"), { ssr: false });

interface BlogPostFormProps {
  formData: AdminBlogPostForm;
  setFormData: Dispatch<SetStateAction<AdminBlogPostForm>>;
  isDarkMode: boolean;
  availableTags: AdminTagOption[];
  selectedTags: AdminTagOption[];
  showTagDropdown: boolean;
  tagSearchQuery: string;
  isSubmitting: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string, blockValue?: BlockEditorValue) => void;
  onImageUpload: (file: File) => Promise<string>;
  onToggleTag: (tag: AdminTagOption) => void;
  onTagDropdownChange: Dispatch<SetStateAction<boolean>>;
  onTagSearchQueryChange: Dispatch<SetStateAction<string>>;
  onGenerateSummary: (content: string) => Promise<string>;
  onGenerateKeywords: (content: string) => Promise<string>;
  onSubmit: (publish: boolean) => Promise<void>;
}

export default function BlogPostForm({
  formData,
  setFormData,
  isDarkMode,
  availableTags,
  selectedTags,
  showTagDropdown,
  tagSearchQuery,
  isSubmitting,
  onTitleChange,
  onContentChange,
  onImageUpload,
  onToggleTag,
  onTagDropdownChange,
  onTagSearchQueryChange,
  onGenerateSummary,
  onGenerateKeywords,
  onSubmit,
}: BlogPostFormProps) {
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );
  const aiContent = formData.content_text || formData.content;
  const isAiDisabled = aiContent.trim().length === 0;
  const saveLabel = isSubmitting
    ? "저장 중..."
    : formData.is_published
      ? "공개로 저장"
      : "비공개로 저장";
  const toggleBaseClass =
    "relative inline-flex h-9 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900";
  const toggleThumbClass =
    "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform";

  const handleGenerateAll = async () => {
    try {
      const [summary, keywords] = await Promise.all([
        onGenerateSummary(aiContent),
        onGenerateKeywords(aiContent),
      ]);

      setFormData((prev) => ({
        ...prev,
        excerpt: summary || prev.excerpt,
        meta_description: summary || prev.meta_description,
        meta_keywords: keywords || prev.meta_keywords,
      }));
    } catch (error) {
      toast.error(getErrorMessage(error, "AI 요약 & 키워드 생성에 실패했습니다."));
    }
  };

  const submitCurrentStatus = () => {
    if (isSubmitting) {
      return;
    }

    void onSubmit(formData.is_published);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitCurrentStatus();
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      submitCurrentStatus();
      return;
    }

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLButtonElement
    ) {
      event.preventDefault();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className="min-h-screen bg-slate-50 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="sticky top-16 z-40 mb-6 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                블로그 작성
              </p>
              <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                {formData.title.trim() || "새 블로그 포스트"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-medium ${
                formData.is_published
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}>
                {formData.is_published ? "공개" : "비공개"}
              </span>
              <Link
                href="/admin/blog"
                aria-disabled={isSubmitting}
                tabIndex={isSubmitting ? -1 : undefined}
                onClick={(event) => {
                  if (isSubmitting) {
                    event.preventDefault();
                  }
                }}
                className={`inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 ${
                  isSubmitting ? "pointer-events-none cursor-not-allowed opacity-50" : ""
                }`}
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-keyshortcuts="Meta+Enter Control+Enter"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saveLabel}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                기본 정보
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-lg font-medium"
                  placeholder="포스트 제목을 입력하세요..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  슬러그 (URL)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: event.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                    placeholder="post-slug"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  내용 *
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {aiContent.trim().length.toLocaleString("ko-KR")}자
                </span>
              </div>
              <BlogBlockEditor
                value={formData.content_json}
                legacyMarkdown={formData.content}
                isDarkMode={isDarkMode}
                onImageUpload={onImageUpload}
                onChange={(value) => onContentChange(value.markdown, value)}
              />
            </div>
          </div>
          <div className="space-y-5 xl:sticky xl:top-36 xl:self-start">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                공개 설정
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_published ? "공개" : "비공개"}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_published
                        ? "포스트가 즉시 공개됩니다."
                        : "비공개로 저장됩니다."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_published: !prev.is_published,
                      }))
                    }
                    aria-label={formData.is_published ? "비공개로 전환" : "공개로 전환"}
                    className={`${toggleBaseClass} focus:ring-blue-500 ${
                      formData.is_published ? "toggle-bg-on" : "toggle-bg-off"
                    }`}
                  >
                    <span
                      className={`${toggleThumbClass} ${
                        formData.is_published ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_featured ? "추천" : "일반"}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_featured
                        ? "메인 페이지에 표시됩니다."
                        : "일반 포스트로 저장됩니다."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        is_featured: !prev.is_featured,
                      }))
                    }
                    aria-label={formData.is_featured ? "일반 포스트로 전환" : "추천 포스트로 전환"}
                    className={`${toggleBaseClass} focus:ring-yellow-500 ${
                      formData.is_featured
                        ? "bg-yellow-500"
                        : "bg-slate-200 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`${toggleThumbClass} ${
                        formData.is_featured ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  태그 선택
                </h3>
                <Link
                  href="/admin/tags?type=blog"
                  className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-200"
                >
                  <Tag className="w-3 h-3" />
                  <span>태그 관리</span>
                </Link>
              </div>
              <div className="space-y-4">
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: tag.color || "#3b82f6" }}
                      >
                        <span>{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => onToggleTag(tag)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                          aria-label={`${tag.name} 태그 제거`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative tag-dropdown-container">
                  <button
                    type="button"
                    onClick={() => onTagDropdownChange(!showTagDropdown)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-left flex items-center justify-between"
                  >
                    <span>블로그 태그 선택...</span>
                    <Plus
                      className={`w-4 h-4 transition-transform ${
                        showTagDropdown ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  {showTagDropdown && (
                    <div
                      className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="블로그 태그 검색..."
                            value={tagSearchQuery}
                            onChange={(event) =>
                              onTagSearchQueryChange(event.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredTags.length > 0 ? (
                          filteredTags.map((tag) => {
                            const isSelected = selectedTags.some(
                              (selected) => selected.id === tag.id
                            );
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  onToggleTag(tag);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${
                                  isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color || "#3b82f6" }}
                                  ></div>
                                  <span className="text-slate-900 dark:text-white">
                                    {tag.name}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            {tagSearchQuery ? (
                              <div>
                                <p>&apos;{tagSearchQuery}&apos;에 대한 검색 결과가 없습니다.</p>
                                <p className="text-sm mt-2">
                                  다른 검색어를 시도해보세요.
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p>사용 가능한 블로그 태그가 없습니다.</p>
                                <p className="text-sm mt-2">
                                  태그 관리에서 먼저 블로그 태그를 생성해주세요.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  포스트 설정
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAll}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-green-300 px-3 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-200"
                  disabled={isAiDisabled}
                >
                  <span>🚀</span>
                  <span>AI 요약 & 키워드 생성</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      포스트 요약
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const summary = await onGenerateSummary(aiContent);
                        if (summary) {
                          setFormData((prev) => ({
                            ...prev,
                            excerpt: summary,
                            meta_description: summary,
                          }));
                        }
                      }}
                      className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-200"
                      disabled={isAiDisabled}
                    >
                      <span>🤖</span>
                      <span>AI 요약</span>
                    </button>
                  </div>
                  <textarea
                    value={formData.excerpt}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        excerpt: value,
                        meta_description: value,
                      }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                    placeholder="포스트 요약을 입력하세요. (검색 엔진에도 사용됩니다)"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      블로그 목록과 검색 엔진에 표시됩니다.
                    </span>
                    <span
                      className={`text-xs ${
                        formData.excerpt.length > 160
                          ? "text-red-500"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {formData.excerpt.length}/160
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      메타 키워드
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const keywords = await onGenerateKeywords(aiContent);
                        if (keywords) {
                          setFormData((prev) => ({
                            ...prev,
                            meta_keywords: keywords,
                          }));
                        }
                      }}
                      className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-200"
                      disabled={isAiDisabled}
                    >
                      <span>🔍</span>
                      <span>AI 키워드</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.meta_keywords}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        meta_keywords: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                    placeholder="키워드1, 키워드2, ..."
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    검색 엔진 최적화를 위한 키워드입니다. (선택사항)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
