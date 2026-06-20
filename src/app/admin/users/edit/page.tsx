"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin, useRole } from '@/contexts/AdminContext';
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Shield,
  ShieldCheck,
  Crown,
  Calendar,
  Mail
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { AdminEditUserForm, AdminUser } from '@/types';
import { getAdminPasswordPolicyError } from '@/utils/admin-password';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import { AdminErrorState } from '../../components/AdminState';
/**
 * @component EditUserContent
 * @description 관리자 사용자 정보를 로드하고 수정할 수 있는 폼을 제공한다.
 * @returns {JSX.Element} 사용자 편집 폼 콘텐츠.
 */
function EditUserContent() {
  const { isAuthenticated, isLoading } = useAdmin();
  const isSuperAdmin = useRole('super_admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<AdminEditUserForm>({
    username: '',
    email: '',
    role: 'editor',
    status: 'active',
    is_active: 1,
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  /**
   * @function loadUser
   * @description 쿼리 파라미터의 사용자 ID를 사용해 사용자 정보를 로드한다.
   * @returns {Promise<void>} 사용자 로딩 작업.
   */
  const loadUser = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get(`/admin/users/${userId}`);
      ensureApiSuccess(response, '사용자 정보를 불러오는데 실패했습니다.');
      const userData = response.data as AdminUser;
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        role: userData.role || 'editor',
        status: userData.is_active ? 'active' : 'inactive',
        is_active: userData.is_active,
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, '사용자 정보를 불러오는데 실패했습니다.');
      setLoadError(errorMessage);
      setUser(null);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated, loadUser]);
  if (!isLoading && isAuthenticated && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">권한이 부족합니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">사용자 편집은 슈퍼 관리자만 가능합니다.</p>
            <Link href="/admin/users" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>사용자 목록으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
              <div className="h-32 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">사용자 ID가 필요합니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">URL에 사용자 ID가 포함되어야 합니다.</p>
            <Link href="/admin/users" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>사용자 목록으로 돌아가기</span>
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
            <Link href="/admin/users" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>사용자 목록으로 돌아가기</span>
            </Link>
          </div>
          <AdminErrorState
            title="사용자 정보를 불러오지 못했습니다"
            description={loadError}
            onRetry={loadUser}
          />
        </div>
      </div>
    );
  }
  /**
   * @description 입력값 변경 시 폼 상태를 업데이트합니다.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e 입력 이벤트.
   * @returns {void}
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        is_active: checked ? 1 : 0,
        status: checked ? 'active' : 'inactive'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  /**
   * @description 폼 제출을 처리하고 사용자 정보를 업데이트합니다.
   * @param {React.FormEvent} e 제출 이벤트.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('사용자 ID가 필요합니다.');
      return;
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.newPassword) {
      const passwordPolicyError = getAdminPasswordPolicyError(formData.newPassword);
      if (passwordPolicyError) {
        toast.error(passwordPolicyError);
        return;
      }
    }
    setSaving(true);
    try {
    const updateData: { username: string; email: string; role: string; is_active: boolean; password?: string } = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        is_active: Boolean(formData.is_active)
      };
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }
      const response = await authApi.put(`/admin/users/${userId}`, updateData);
      ensureApiSuccess(response, '사용자 정보 업데이트에 실패했습니다.');
      toast.success(
        formData.newPassword
          ? '사용자 정보와 비밀번호가 성공적으로 업데이트되었습니다.'
          : '사용자 정보가 성공적으로 업데이트되었습니다.'
      );
      router.push('/admin/users');
    } catch (error) {
      toast.error(getErrorMessage(error, '사용자 정보 업데이트에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };
  /**
   * @description 역할에 맞는 아이콘을 반환합니다.
   * @param {string} role 역할 식별자.
   * @returns {JSX.Element} 역할 표시 아이콘.
   */
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-slate-500" />;
    }
  };
  /**
   * @description 역할에 해당하는 텍스트 라벨을 반환합니다.
   * @param {string} role 역할 식별자.
   * @returns {string} 역할 라벨.
   */
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '슈퍼 관리자';
      case 'admin':
        return '관리자';
      default:
        return '편집자';
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>사용자 목록</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">사용자 편집</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            사용자 정보를 수정하고 권한을 관리합니다.
          </p>
        </div>
        {user && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user.username}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span className="text-sm text-slate-600 dark:text-slate-400">{getRoleLabel(user.role)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.is_active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {user.is_active ? '활성' : '비활성'}
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  사용자명 *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                  placeholder="사용자명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  역할 *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="editor">편집자</option>
                  <option value="admin">관리자</option>
                  <option value="super_admin">슈퍼 관리자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  상태
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={Boolean(formData.is_active)}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">활성</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">비밀번호 변경</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              비밀번호를 변경하려면 아래 필드를 입력하세요. 변경하지 않으려면 비워두세요.
              새 비밀번호는 12자 이상이며 영문과 숫자를 포함해야 합니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    placeholder="12자 이상, 영문과 숫자 포함"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/users"
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? '저장 중...' : '저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
/**
 * @component EditUser
 * @description 관리자 사용자를 편집하기 위한 Suspense 기반 페이지 래퍼.
 * @returns {JSX.Element} 사용자 편집 페이지 컨테이너.
 */
export default function EditUser() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <EditUserContent />
    </Suspense>
  );
}
