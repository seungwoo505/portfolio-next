"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { AdminNewUserModalProps, AdminUserForm, AdminUser } from '@/types';
import { getAdminPasswordPolicyError } from '@/utils/admin-password';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import { X, AlertCircle, EyeOff, Eye, Save } from 'lucide-react';
/**
 * @component NewUserModal
 * @description 새로운 관리자 사용자를 생성하는 폼 모달을 제공한다.
 * @param {NewUserModalProps} props 모달 열림 상태와 콜백.
 * @returns {JSX.Element | null} 사용자 생성 모달.
 */
export default function NewUserModal({ isOpen, onClose, onUserCreated }: AdminNewUserModalProps) {
  const [formData, setFormData] = useState<AdminUserForm>({
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
    const newErrors: Partial<AdminUserForm> = {};
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
    const passwordPolicyError = getAdminPasswordPolicyError(formData.password);
    if (passwordPolicyError) {
      newErrors.password = passwordPolicyError;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /**
   * @function handleSubmit
   * @description 입력값을 검증한 뒤 새로운 사용자를 생성한다.
   * @param {React.FormEvent} e 폼 제출 이벤트.
   * @returns {Promise<void>} 사용자 생성 작업.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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
      ensureApiSuccess(response, '사용자 생성에 실패했습니다.');
      if (!response.data) {
        throw new Error('생성된 사용자 정보를 받지 못했습니다.');
      }
      const createdUser = response.data as AdminUser;
      onUserCreated(createdUser);
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
    } catch (error: unknown) {
      const message = getErrorMessage(error, '사용자 생성에 실패했습니다.');
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
  /**
   * @function getRoleInfo
   * @description 각 역할별 설명과 권한 정보를 반환한다.
   * @param {string} role 역할 식별자.
   * @returns {{ label: string; description: string; color: string; icon: JSX.Element }} 역할 메타데이터.
   */
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            새 사용자 추가
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="새 사용자 추가 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="user-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              사용자명 *
            </label>
            <input
              id="user-username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors ${
                errors.username ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="3자 이상 입력"
            />
            {errors.username && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.username}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              이메일 *
            </label>
            <input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors ${
                errors.email ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="예: admin@example.com"
            />
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              비밀번호 *
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors ${
                  errors.password ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="12자 이상, 영문과 숫자 포함"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.password}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              비밀번호 확인 *
            </label>
            <div className="relative">
              <input
                id="user-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-400 transition-colors ${
                  errors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="비밀번호를 다시 입력"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.confirmPassword}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              역할 *
            </label>
            <select
              id="user-role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'editor' | 'admin' | 'super_admin' }))}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 transition-colors"
            >
              <option value="editor">에디터</option>
              <option value="admin">관리자</option>
              <option value="super_admin">슈퍼 관리자</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getRoleInfo(formData.role).description}
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              상태
            </label>
            <select
              id="user-status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 transition-colors"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
