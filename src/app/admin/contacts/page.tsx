"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  Calendar,
  User,
  Search
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { AdminContactMessage } from '@/types';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import {
  AdminErrorState,
  AdminEmptyState,
  AdminListSkeleton,
  AdminPageLoading,
} from '../components/AdminState';
/**
 * @description 문의 메시지를 조회하고 상태를 관리하는 페이지입니다.
 * @returns {JSX.Element} 연락처 관리 페이지 컴포넌트.
 */
export default function ContactsManagement() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; messageId: string | null }>({
    isOpen: false,
    messageId: null
  });
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  /**
   * @description 문의 메시지 목록을 불러옵니다.
   * @returns {Promise<void>}
   */
  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get('/admin/contacts');
      ensureApiSuccess(response, '문의 메시지를 가져오는데 실패했습니다.');
      setMessages((response.data || []) as AdminContactMessage[]);
    } catch (error) {
      const errorMessage = getErrorMessage(error, '문의 메시지를 가져오는데 실패했습니다.');
      setLoadError(errorMessage);
      setMessages([]);
      setSelectedMessage(null);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  /**
   * @description 메시지를 읽음 상태로 변경합니다.
   * @param {string} messageId 메시지 ID.
   * @returns {Promise<void>}
   */
  const markAsRead = async (messageId: string) => {
    try {
      const response = await authApi.put(`/admin/contacts/${messageId}/read`);
      ensureApiSuccess(response, '메시지 상태 변경에 실패했습니다.');
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ));
      toast.success('메시지가 읽음 상태로 변경되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '메시지 상태 변경에 실패했습니다.'));
    }
  };
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} messageId 삭제할 메시지 ID.
   * @returns {void}
   */
  const openDeleteModal = (messageId: string) => {
    setDeleteModal({ isOpen: true, messageId });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, messageId: null });
  };
  /**
   * @description 선택한 메시지를 삭제합니다.
   * @returns {Promise<void>}
   */
  const deleteMessage = async () => {
    if (!deleteModal.messageId) return;
    try {
      const response = await authApi.delete(`/admin/contacts/${deleteModal.messageId}`);
      ensureApiSuccess(response, '메시지 삭제에 실패했습니다.');
      setMessages(prev => prev.filter(msg => msg.id !== deleteModal.messageId));
      if (selectedMessage?.id === deleteModal.messageId) {
        setSelectedMessage(null);
      }
      toast.success('메시지가 삭제되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '메시지 삭제에 실패했습니다.'));
    }
  };
  /**
   * @description 메시지를 선택하고 필요 시 읽음 처리합니다.
   * @param {AdminContactMessage} message 선택한 메시지.
   * @returns {Promise<void>}
   */
  const selectMessage = async (message: AdminContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      await markAsRead(message.id);
    }
  };
  const filteredMessages = messages.filter(message => {
    const matchesFilter = filter === 'all' || message.status === filter;
    const matchesSearch = !searchQuery || 
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.subject?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  if (isLoading) {
    return <AdminPageLoading />;
  }
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    메시지 목록
                  </h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredMessages.length}개
                  </span>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="메시지 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'unread'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    읽지 않음
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'read'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    읽음
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4">
                    <AdminListSkeleton rows={5} />
                  </div>
                ) : loadError ? (
                  <div className="p-4">
                    <AdminErrorState
                      embedded
                      compact
                      description={loadError}
                      onRetry={fetchMessages}
                    />
                  </div>
                ) : filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => selectMessage(message)}
                      className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        selectedMessage?.id === message.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.status === 'unread' 
                            ? 'bg-blue-100 dark:bg-blue-900' 
                            : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          {message.status === 'unread' ? (
                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <MailOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${
                              message.status === 'unread' 
                                ? 'text-slate-900 dark:text-white' 
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {message.name}
                            </p>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(message.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {message.subject || '제목 없음'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4">
                    <AdminEmptyState
                      embedded
                      compact
                      icon={Mail}
                      title={searchQuery || filter !== 'all' ? '검색 결과가 없습니다' : '메시지가 없습니다'}
                      description={
                        searchQuery || filter !== 'all'
                          ? '다른 검색어나 상태 필터로 다시 확인해보세요.'
                          : '접수된 문의가 생기면 이 목록에 표시됩니다.'
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {selectedMessage.subject || '제목 없음'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{selectedMessage.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{selectedMessage.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(selectedMessage.created_at).toLocaleString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openDeleteModal(selectedMessage.id)}
                        className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                  {(selectedMessage.ip_address || selectedMessage.user_agent) && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">기술 정보</h4>
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {selectedMessage.ip_address && (
                          <div>
                            <span className="font-medium">IP 주소:</span> {selectedMessage.ip_address}
                          </div>
                        )}
                        {selectedMessage.user_agent && (
                          <div>
                            <span className="font-medium">브라우저:</span> {selectedMessage.user_agent}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <AdminEmptyState
                icon={Mail}
                title="메시지를 선택하세요"
                description="왼쪽 목록에서 메시지를 선택하면 상세 내용을 확인할 수 있습니다."
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteMessage}
        title="메시지 삭제"
        message="정말로 이 메시지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
