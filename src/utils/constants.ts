// 상수 정의

export const API_ENDPOINTS = {
  // 인증
  LOGIN: '/admin/login',
  LOGOUT: '/admin/logout',
  REFRESH: '/admin/refresh',
  ME: '/admin/me',
  
  // 블로그
  BLOG_POSTS: '/blog/posts',
  BLOG_POST: '/blog/posts',
  BLOG_TAGS: '/tags',
  
  // 프로젝트
  PROJECTS: '/projects',
  PROJECT: '/projects',
  
  // 사용자
  USERS: '/admin/users',
  USER: '/admin/users',
  
  // 태그
  TAGS: '/admin/tags',
  TAG: '/admin/tags',
  
  // 연락처
  CONTACTS: '/admin/contacts',
  CONTACT: '/admin/contacts',
  
  // 스킬
  SKILLS: '/skills',
  SKILL_CATEGORIES: '/admin/skills/categories',
  
  // 개인정보
  PERSONAL_INFO: '/personal-info',
  INTERESTS: '/interests',
  
  // 설정
  SETTINGS: '/settings',
  
  // 업로드
  UPLOAD_IMAGE: '/admin/upload/image',
  
  // AI
  AI_SUMMARIZE: '/admin/ai/summarize',
  AI_KEYWORDS: '/admin/ai/keywords',
  
  // 대시보드
  DASHBOARD: '/admin/dashboard',
  STATS: '/admin/dashboard',
  
  // 활동 로그
  LOGS: '/admin/logs',
  
  // 검색
  SEARCH: '/search',
  
  // 헬스 체크
  HEALTH: '/health'
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor'
} as const;

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
} as const;

export const INTEREST_CATEGORIES = {
  TECHNICAL: 'technical',
  PERSONAL: 'personal'
} as const;

export const TAG_TYPES = {
  BLOG: 'blog',
  PROJECT: 'project',
  GENERAL: 'general'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
} as const;

export const VALIDATION = {
  MIN_TITLE_LENGTH: 2,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_CONTENT_LENGTH: 50,
  MAX_CONTENT_LENGTH: 50000,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100
} as const;

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000
} as const;

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;
