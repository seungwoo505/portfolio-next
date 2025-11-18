"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { AdminUser } from '@/types';
import { X, AlertCircle, EyeOff, Eye, Save } from 'lucide-react';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: AdminUser) => void;
}

interface UserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'admin' | 'editor';
  status: 'active' | 'inactive';
}

export default function NewUserModal({ isOpen, onClose, onUserCreated }: NewUserModalProps) {
  const [formData, setFormData] = useState<UserForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'editor',
    status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserForm> = {};

    if (!formData.username.trim()) {
      newErrors.username = '사용자명을 입력하세요';
    } else if (formData.username.length < 3) {
      newErrors.username = '사용자명은 3자 이상이어야 합니다';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력하세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력하세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력하세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(), 
        password: formData.password,
        role: formData.role,
        status: formData.status,
        name: formData.username.trim(),
        full_name: formData.username.trim(),
        is_active: formData.status === 'active'
      };

      const response = await authApi.post('/admin/users', userData);
      
      if (response.success && response.data) {
        const userData = response.data as AdminUser;
        onUserCreated(userData);
        onClose();
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'editor',
          status: 'active'
        });
        setErrors({});
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('username') || message.includes('사용자명')) {
        setErrors({ username: '이미 사용 중인 사용자명입니다' });
      } else if (message.includes('email') || message.includes('이메일')) {
        setErrors({ email: '이미 사용 중인 이메일입니다' });
      } else {
        toast.error('사용자 생성 실패: ' + message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { 
          label: '슈퍼 관리자', 
          description: '모든 권한 (사용자 관리, 시스템 설정 등)' 
        };
      case 'admin':
        return { 
          label: '관리자', 
          description: '컨텐츠 관리, 설정 등 (사용자 관리 제외)' 
        };
      case 'editor':
        return { 
          label: '에디터', 
          description: '블로그/프로젝트 작성 및 편집만 가능' 
        };
      default:
        return { label: '알 수 없음', description: '' };
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            새 사용자 추가
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 사용자명 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              사용자명 *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700 ${
                errors.username ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="사용자명을 입력하세요"
            />
            {errors.username && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.username}</span>
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              이메일 *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700 ${
                errors.email ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="이메일을 입력하세요"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              비밀번호 *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700 ${
                  errors.password ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              비밀번호 확인 *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700 ${
                  errors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="비밀번호를 다시 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* 역할 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              역할 *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'editor' | 'admin' | 'super_admin' }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700"
            >
              <option value="editor">에디터</option>
              <option value="admin">관리자</option>
              <option value="super_admin">슈퍼 관리자</option>
            </select>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {getRoleInfo(formData.role).description}
            </p>
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white dark:bg-slate-700"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? '생성 중...' : '사용자 생성'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
