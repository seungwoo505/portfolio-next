export const API_ENDPOINTS = {
  LOGIN: '/admin/login',
  LOGOUT: '/admin/logout',
  REFRESH: '/admin/refresh',
  ME: '/admin/me',
  BLOG_POSTS: '/public/posts',
  BLOG_POST: '/public/posts',
  BLOG_TAGS: '/public/tags',
  PROJECTS: '/public/projects',
  PROJECT: '/public/projects',
  USERS: '/admin/users',
  USER: '/admin/users',
  TAGS: '/admin/tags',
  TAG: '/admin/tags',
  CONTACTS: '/admin/contacts',
  CONTACT: '/admin/contacts',
  SKILLS: '/public/skills',
  SKILL_CATEGORIES: '/admin/skills/categories',
  PERSONAL_INFO: '/public/profile',
  INTERESTS: '/public/interests',
  SETTINGS: '/public/settings',
  UPLOAD_IMAGE: '/admin/upload/image',
  AI_SUMMARIZE: '/admin/ai/summarize',
  AI_KEYWORDS: '/admin/ai/keywords',
  DASHBOARD: '/admin/dashboard',
  STATS: '/admin/dashboard',
  LOGS: '/admin/logs',
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
  MAX_SIZE: 5 * 1024 * 1024, 
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
