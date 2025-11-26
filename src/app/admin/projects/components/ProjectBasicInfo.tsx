"use client";
import { ProjectForm } from '@/types/project';
interface ProjectBasicInfoProps {
  formData: ProjectForm;
  setFormData: (data: ProjectForm) => void;
  errors: Record<string, string>;
}
/**
 * @description Project Basic Info for project basic info.tsx.
  * @param {*} { formData 입력값
  * @param {*} setFormData 입력값
  * @param {*} errors } 입력값
 * @returns {any} 처리 결과
 */
function ProjectBasicInfo({ formData, setFormData, errors }: ProjectBasicInfoProps) {
  const handleInputChange = (field: keyof ProjectForm, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          프로젝트 제목 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="프로젝트 제목을 입력하세요"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          슬러그 *
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => handleInputChange('slug', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="project-slug"
        />
        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          프로젝트 설명 *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            시작일
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            종료일
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => handleInputChange('is_featured', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">추천 프로젝트</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_published}
            onChange={(e) => handleInputChange('is_published', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">공개</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_ongoing}
            onChange={(e) => handleInputChange('is_ongoing', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">진행중</span>
        </label>
      </div>
    </div>
  );
}
export default ProjectBasicInfo;
