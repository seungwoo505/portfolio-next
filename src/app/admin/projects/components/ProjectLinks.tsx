"use client";

import { ProjectForm } from '@/types/project';
import { Link as LinkIcon, Github } from 'lucide-react';

interface ProjectLinksProps {
  formData: ProjectForm;
  setFormData: (data: ProjectForm) => void;
  errors: Record<string, string>;
}

function ProjectLinks({ formData, setFormData, errors }: ProjectLinksProps) {
  const handleInputChange = (field: keyof ProjectForm, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <LinkIcon className="w-4 h-4 inline mr-2" />
          프로젝트 URL
        </label>
        <input
          type="url"
          value={formData.project_url}
          onChange={(e) => handleInputChange('project_url', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="https://example.com"
        />
        {errors.project_url && <p className="text-red-500 text-sm mt-1">{errors.project_url}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Github className="w-4 h-4 inline mr-2" />
          GitHub URL
        </label>
        <input
          type="url"
          value={formData.github_url}
          onChange={(e) => handleInputChange('github_url', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="https://github.com/username/repository"
        />
        {errors.github_url && <p className="text-red-500 text-sm mt-1">{errors.github_url}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          대표 이미지 URL
        </label>
        <input
          type="url"
          value={formData.featured_image}
          onChange={(e) => handleInputChange('featured_image', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="https://example.com/image.jpg"
        />
        {errors.featured_image && <p className="text-red-500 text-sm mt-1">{errors.featured_image}</p>}
      </div>
    </div>
  );
}

export default ProjectLinks;
