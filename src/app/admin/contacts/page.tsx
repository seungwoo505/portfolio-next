"use client";

import { useState, useEffect } from 'react';
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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export default function ContactsManagement() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; messageId: string | null }>({
    isOpen: false,
    messageId: null
  });
  const router = useRouter();

  // 인증 확인
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 메시지 목록 가져오기
  useEffect(() => {
    const fetchMessages = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await authApi.get('/admin/contacts');
        if (response.success && response.data) {
          const messagesData = response.data as ContactMessage[];
          setMessages(messagesData);
        }
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [isAuthenticated]);

  // 메시지 읽음 처리
  const markAsRead = async (messageId: string) => {
    try {
      await authApi.put(`/admin/contacts/${messageId}/read`);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ));
      toast.success('메시지가 읽음 상태로 변경되었습니다.');
    } catch {
      toast.error('메시지 상태 변경에 실패했습니다.');
    }
  };

  // 메시지 읽지 않음 처리 - 주석 처리
  // const _markAsUnread = async (messageId: string) => {
  //   try {
  //     await authApi.put(`/admin/contacts/${messageId}/unread`);
  //     setMessages(prev => prev.map(msg => 
  //       msg.id === messageId ? { ...msg, status: 'unread' } : msg
  //     ));
  //   } catch {
  //     // 에러 처리
  //   }
  // };

  // 메시지 삭제 모달 열기
  const openDeleteModal = (messageId: string) => {
    setDeleteModal({ isOpen: true, messageId });
  };

  // 메시지 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, messageId: null });
  };

  // 메시지 삭제 실행
  const deleteMessage = async () => {
    if (!deleteModal.messageId) return;
    
    try {
      await authApi.delete(`/admin/contacts/${deleteModal.messageId}`);
      setMessages(prev => prev.filter(msg => msg.id !== deleteModal.messageId));
      if (selectedMessage?.id === deleteModal.messageId) {
        setSelectedMessage(null);
      }
      toast.success('메시지가 삭제되었습니다.');
    } catch {
      toast.error('메시지 삭제에 실패했습니다.');
    }
  };

  // 메시지 선택
  const selectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      await markAsRead(message.id);
    }
  };

  // 필터링된 메시지
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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-400">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메시지 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              {/* 필터 및 검색 */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    메시지 목록
                  </h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredMessages.length}개
                  </span>
                </div>
                
                {/* 검색 */}
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

                {/* 필터 */}
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

              {/* 메시지 목록 */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-3 p-3">
                          <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <div className="p-8 text-center">
                    <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {searchQuery || filter !== 'all' ? '조건에 맞는 메시지가 없습니다.' : '메시지가 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메시지 상세 */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {/* 메시지 헤더 */}
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
                    
                    {/* 액션 버튼 */}
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

                {/* 메시지 내용 */}
                <div className="p-6">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>

                  {/* 메타 정보 */}
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
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center h-96">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    메시지를 선택하세요
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    왼쪽 목록에서 메시지를 클릭하여 내용을 확인하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
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
