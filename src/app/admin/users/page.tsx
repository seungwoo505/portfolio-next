"use client";
import Link from "next/link";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin, useRole } from '@/contexts/AdminContext';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { 
  Plus,
  Edit3,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldX,
  Search,
  User,
  Crown
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { AdminUser } from '@/types';
import NewUserModal from './components/NewUserModal';

export default function UsersManagement() {
  const { isAuthenticated, isLoading, user: currentUser } = useAdmin();
  const isSuperAdmin = useRole('super_admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'editor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  // const [, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null
  });
  const router = useRouter();

  // 인증 확인 및 권한 체크
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    } else if (!isLoading && isAuthenticated && !isSuperAdmin) {
      // 슈퍼 관리자가 아니면 대시보드로 리다이렉트
      router.push('/admin');
    }
  }, [isAuthenticated, isLoading, isSuperAdmin, router]);

  // 사용자 목록 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated || !isSuperAdmin) return;
      
      try {
        setLoading(true);
        const response = await authApi.get('/admin/users');
        if (response.success && response.data) {
          const usersData = response.data as AdminUser[];
          setUsers(usersData);
        }
      } catch {
        const errorMessage = '사용자를 가져오는데 실패했습니다.';
        toast.error(errorMessage);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated, isSuperAdmin]);

  // 사용자 상태 변경
  const toggleUserStatus = async (userId: string, currentIsActive: boolean) => {
    if (userId === currentUser?.id) {
      toast.error('자신의 계정 상태는 변경할 수 없습니다.');
      return;
    }

    try {
      const newIsActive = !currentIsActive;

      // 실제 서버 요청 시도
      const currentUser = users.find(u => String(u.id) === String(userId));
      if (!currentUser) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 편집 페이지와 완전히 동일한 구조로 시도
      const updateData = {
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        is_active: newIsActive ? 1 : 0
      };


      const response = await authApi.put(`/admin/users/${userId}`, updateData);
      
      if (response.success) {
        
        // 로컬 상태 업데이트
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, is_active: newIsActive ? 1 : 0 }
            : user
        ));
        
        toast.success('사용자 상태가 변경되었습니다.');
      } else {
        toast.error('사용자 상태 변경에 실패했습니다: ' + response.message);
      }
    } catch {
      const errorMessage = '사용자 상태 변경에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 사용자 삭제 모달 열기
  const openDeleteModal = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('자신의 계정은 삭제할 수 없습니다.');
      return;
    }
    setDeleteModal({ isOpen: true, userId });
  };

  // 사용자 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, userId: null });
  };

  // 사용자 삭제 실행
  const deleteUser = async () => {
    if (!deleteModal.userId) return;
    
    try {
      await authApi.delete(`/admin/users/${deleteModal.userId}`);
      setUsers(prev => prev.filter(user => user.id !== deleteModal.userId));
      toast.success('사용자가 삭제되었습니다.');
    } catch {
      const errorMessage = '사용자 삭제에 실패했습니다.';
      toast.error(errorMessage);
    }
  };

  // 새 사용자 생성 후 목록에 추가
  const handleUserCreated = (newUser: AdminUser) => {
    setUsers(prev => [...prev, newUser]);
    setShowNewUserModal(false);
  };

  // 역할 표시 함수
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { 
          label: '슈퍼 관리자', 
          color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
          icon: Crown 
        };
      case 'admin':
        return { 
          label: '관리자', 
          color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
          icon: ShieldCheck 
        };
      case 'editor':
        return { 
          label: '에디터', 
          color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          icon: Shield 
        };
      default:
        return { 
          label: '알 수 없음', 
          color: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
          icon: ShieldX 
        };
    }
  };

  // 필터링된 사용자
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // status 필드 기반으로 상태 필터링
    const userIsActive = user.is_active === 1;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && userIsActive) ||
      (statusFilter === 'inactive' && !userIsActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-400">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* 액션 바 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              사용자 목록
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              전체 {users.length}명의 사용자 • 활성 {users.filter(u => u.is_active === 1).length}명
            </p>
          </div>
          <button 
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 사용자</span>
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="사용자명, 이메일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              />
            </div>

            {/* 역할 필터 */}
            <div className="flex flex-wrap space-x-2">
              {[
                { key: 'all', label: '모든 역할' },
                { key: 'super_admin', label: '슈퍼 관리자' },
                { key: 'admin', label: '관리자' },
                { key: 'editor', label: '에디터' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRoleFilter(key as 'all' | 'super_admin' | 'admin' | 'editor')}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    roleFilter === key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 상태 필터 */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '모든 상태' },
                { key: 'active', label: '활성' },
                { key: 'inactive', label: '비활성' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as 'all' | 'active' | 'inactive')}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    statusFilter === key
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              {/* 모바일 카드 레이아웃 */}
              <div className="block lg:hidden space-y-4">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <div key={user.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {user.username}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.status === 'active' ? '활성' : '비활성'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">마지막 로그인:</span>
                          <p className="text-slate-900 dark:text-white">
                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '없음'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">가입일:</span>
                          <p className="text-slate-900 dark:text-white">
                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">활성화:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.is_active ? '활성' : '비활성'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => router.push(`/admin/users/edit?id=${user.id}`)}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => openDeleteModal(user.id)}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 데스크톱 테이블 레이아웃 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        마지막 로그인
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        활성화
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const RoleIcon = roleInfo.icon;
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-600 ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                                <span>{user.username}</span>
                                {isCurrentUser && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                    나
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active === 1
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {user.is_active === 1 ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleString('ko-KR')
                            : '로그인 기록 없음'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        {/* 활성화 토글 */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {!isCurrentUser ? (
                              <button
                                onClick={() => toggleUserStatus(user.id, user.is_active === 1)}
                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                style={{
                                  backgroundColor: user.is_active === 1 ? '#10b981' : '#ef4444'
                                }}
                                title={user.is_active === 1 ? '클릭하여 비활성화' : '클릭하여 활성화'}
                              >
                                <span
                                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                    user.is_active === 1 ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                본인 계정
                              </span>
                            )}
                          </div>
                        </td>
                        {/* 관리 액션 */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Link
                              href={`/admin/users/edit?id=${user.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="사용자 편집"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            {!isCurrentUser && (
                              <button
                                onClick={() => openDeleteModal(user.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                title="사용자 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? '검색 결과가 없습니다' : '사용자가 없습니다'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? '다른 검색어나 필터를 시도해보세요.' 
                  : '새 사용자를 추가해보세요.'}
              </p>
              {(!searchQuery && roleFilter === 'all' && statusFilter === 'all') && (
                <button 
                  onClick={() => setShowNewUserModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>새 사용자 추가</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 새 사용자 생성 모달 */}
        <NewUserModal 
          isOpen={showNewUserModal}
          onClose={() => setShowNewUserModal(false)}
          onUserCreated={handleUserCreated}
        />

        {/* 삭제 확인 모달 */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={deleteUser}
          title="사용자 삭제"
          message="정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          isDestructive={true}
        />
      </div>
    </div>
  );
}