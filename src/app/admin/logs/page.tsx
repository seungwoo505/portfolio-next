"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  Activity,
  Search,
  Calendar,
  User,
  FileText,
  FolderOpen,
  UserPlus,
  Trash2,
  Edit3,
  Plus,
  Eye,
  Settings,
  Tag,
  Mail,
  Download
} from 'lucide-react';
import { authApi } from '@/lib/api';

interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function ActivityLogs() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const router = useRouter();

  // 인증 확인
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 활동 로그 가져오기
  useEffect(() => {
    const fetchLogs = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await authApi.get<ActivityLog[]>('/admin/logs');
        
        if (response.success && response.data) {
          setLogs(response.data);
        } else {
          // console.error 제거됨
          setLogs([]);
        }
      } catch {
        // console.error 제거됨
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isAuthenticated]);

  // 액션 정보 가져오기
  const getActionInfo = (action: string) => {
    switch (action) {
      case 'login':
        return { label: '로그인', icon: User, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900' };
      case 'logout':
        return { label: '로그아웃', icon: User, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700' };
      case 'create':
        return { label: '생성', icon: Plus, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900' };
      case 'update':
        return { label: '수정', icon: Edit3, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900' };
      case 'delete':
        return { label: '삭제', icon: Trash2, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900' };
      case 'view':
        return { label: '조회', icon: Eye, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900' };
      default:
        return { label: action, icon: Activity, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700' };
    }
  };

  // 리소스 타입 정보 가져오기
  const getResourceInfo = (resourceType: string) => {
    switch (resourceType) {
      case 'auth':
        return { label: '인증', icon: User, color: 'text-blue-600 dark:text-blue-400' };
      case 'blog':
        return { label: '블로그', icon: FileText, color: 'text-green-600 dark:text-green-400' };
      case 'project':
        return { label: '프로젝트', icon: FolderOpen, color: 'text-purple-600 dark:text-purple-400' };
      case 'tag':
        return { label: '태그', icon: Tag, color: 'text-orange-600 dark:text-orange-400' };
      case 'user':
        return { label: '사용자', icon: UserPlus, color: 'text-indigo-600 dark:text-indigo-400' };
      case 'contact':
        return { label: '연락처', icon: Mail, color: 'text-pink-600 dark:text-pink-400' };
      case 'settings':
        return { label: '설정', icon: Settings, color: 'text-gray-600 dark:text-gray-400' };
      default:
        return { label: resourceType, icon: Activity, color: 'text-slate-600 dark:text-slate-400' };
    }
  };

  // JSON details를 사용자 친화적인 텍스트로 변환
  const formatDetails = (details: string) => {
    if (!details) return '-';
    
    // 백엔드에서 이미 깔끔한 텍스트로 저장되므로 그대로 반환
    return details;
  };

  // IP 주소를 깔끔하게 표시 (::ffff: 접두사 제거)
  const formatIpAddress = (ip: string) => {
    if (!ip) return '-';
    // IPv6-mapped IPv4 주소에서 IPv4 부분만 추출
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7); // "::ffff:" 제거
    }
    return ip;
  };

  // User Agent를 OS와 브라우저만 간략하게 표시
  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return '-';
    
    try {
      // OS 정보 추출
      let os = 'Unknown';
      if (userAgent.includes('Windows')) {
        if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
        else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
        else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
        else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
        else os = 'Windows';
      } else if (userAgent.includes('Macintosh')) {
        if (userAgent.includes('Mac OS X 10_15')) os = 'macOS 10.15';
        else if (userAgent.includes('Mac OS X 11_')) os = 'macOS 11';
        else if (userAgent.includes('Mac OS X 12_')) os = 'macOS 12';
        else if (userAgent.includes('Mac OS X 13_')) os = 'macOS 13';
        else if (userAgent.includes('Mac OS X 14_')) os = 'macOS 14';
        else os = 'macOS';
      } else if (userAgent.includes('Linux')) {
        if (userAgent.includes('Android')) {
          const androidVersion = userAgent.match(/Android (\d+)/);
          os = androidVersion ? `Android ${androidVersion[1]}` : 'Android';
        } else {
          os = 'Linux';
        }
      } else if (userAgent.includes('iPhone')) {
        const iosVersion = userAgent.match(/OS (\d+)_/);
        os = iosVersion ? `iOS ${iosVersion[1]}` : 'iOS';
      } else if (userAgent.includes('iPad')) {
        const iosVersion = userAgent.match(/OS (\d+)_/);
        os = iosVersion ? `iPadOS ${iosVersion[1]}` : 'iPadOS';
      }
      
      // 브라우저 정보 추출
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) {
        const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
        browser = chromeVersion ? `Chrome ${chromeVersion[1]}` : 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        const firefoxVersion = userAgent.match(/Firefox\/(\d+)/);
        browser = firefoxVersion ? `Firefox ${firefoxVersion[1]}` : 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        const safariVersion = userAgent.match(/Version\/(\d+)/);
        browser = safariVersion ? `Safari ${safariVersion[1]}` : 'Safari';
      } else if (userAgent.includes('Edge')) {
        const edgeVersion = userAgent.match(/Edge\/(\d+)/);
        browser = edgeVersion ? `Edge ${edgeVersion[1]}` : 'Edge';
      } else if (userAgent.includes('Opera')) {
        const operaVersion = userAgent.match(/Opera\/(\d+)/);
        browser = operaVersion ? `Opera ${operaVersion[1]}` : 'Opera';
      }
      
      return `${os} | ${browser}`;
      
    } catch {
      // 파싱 실패 시 원본에서 간단한 정보만 추출
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      if (userAgent.includes('Opera')) return 'Opera';
      
      // 너무 길면 축약
      if (userAgent.length > 30) {
        return userAgent.substring(0, 30) + '...';
      }
      return userAgent;
    }
  };

  // 필터링된 로그
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.username && log.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.resource_type && log.resource_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.resource_name && log.resource_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesUser = userFilter === 'all' || log.username === userFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = logDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = logDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          matchesDate = logDate >= weekAgo;
          break;
        case 'month':
          matchesDate = logDate >= new Date(today.getFullYear(), today.getMonth(), 1);
          break;
      }
    }
    
    return matchesSearch && matchesUser && matchesAction && matchesResource && matchesDate;
  });

  // 고유한 사용자 목록
  const uniqueUsers = Array.from(new Set(logs.map(log => log.username)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource_type)));

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
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">활동 로그</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                관리자들의 모든 활동을 추적하고 모니터링합니다
              </p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>로그 내보내기</span>
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">전체 활동</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{logs.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">오늘 활동</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {logs.filter(log => {
                    const logDate = new Date(log.created_at);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">활성 사용자</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{uniqueUsers.length}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">리소스 타입</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{uniqueResources.length}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FolderOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="사용자명, 액션, 리소스 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              />
            </div>

            {/* 사용자 필터 */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
            >
              <option value="all">모든 사용자</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>

            {/* 액션 필터 */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
            >
              <option value="all">모든 액션</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{getActionInfo(action).label}</option>
              ))}
            </select>

            {/* 리소스 타입 필터 */}
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
            >
              <option value="all">모든 리소스</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>{getResourceInfo(resource).label}</option>
              ))}
            </select>

            {/* 날짜 필터 */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="yesterday">어제</option>
              <option value="week">최근 7일</option>
              <option value="month">이번 달</option>
            </select>
          </div>
        </div>

        {/* 활동 로그 목록 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      액션
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      리소스
                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  상세 정보
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  IP 주소
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  OS + 브라우저
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  시간
                                </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredLogs.map((log, index) => {
                    const actionInfo = getActionInfo(log.action);
                    const resourceInfo = getResourceInfo(log.resource_type);
                    const ActionIcon = actionInfo.icon;
                    const ResourceIcon = resourceInfo.icon;

                    return (
                      <tr key={log.id || `log-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {log.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${actionInfo.bgColor} ${actionInfo.color}`}>
                            <ActionIcon className="w-3 h-3" />
                            <span>{actionInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <ResourceIcon className={`w-4 h-4 ${resourceInfo.color}`} />
                            <span className="text-sm text-slate-900 dark:text-white">
                              {resourceInfo.label}
                            </span>
                            {log.resource_name && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({log.resource_name})
                              </span>
                            )}
                          </div>
                        </td>
                                                            <td className="px-6 py-4">
                                      <span className="text-sm text-slate-900 dark:text-white">
                                        {formatDetails(log.details || '')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {formatIpAddress(log.ip_address || '')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {formatUserAgent(log.user_agent || '')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(log.created_at).toLocaleString('ko-KR')}
                                      </span>
                                    </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {searchQuery || userFilter !== 'all' || actionFilter !== 'all' || resourceFilter !== 'all' || dateFilter !== 'all' 
                  ? '조건에 맞는 활동 로그가 없습니다' 
                  : '활동 로그가 없습니다'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery || userFilter !== 'all' || actionFilter !== 'all' || resourceFilter !== 'all' || dateFilter !== 'all'
                  ? '다른 검색어나 필터를 시도해보세요.'
                  : '아직 기록된 활동이 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
