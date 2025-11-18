USE portfolio;

-- admin_permissions 테이블 생성
CREATE TABLE IF NOT EXISTS admin_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '권한 이름',
    resource VARCHAR(50) NOT NULL COMMENT '리소스 (users, posts, projects 등)',
    action VARCHAR(50) NOT NULL COMMENT '액션 (create, read, update, delete)',
    description TEXT COMMENT '권한 설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- admin_role_permissions 테이블 생성 (역할-권한 매핑)
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50) NOT NULL COMMENT '역할 (super_admin, admin, editor)',
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role, permission_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 권한들 삽입 (중복 방지)
INSERT IGNORE INTO admin_permissions (name, resource, action, description) VALUES
-- 사용자 관리 권한
('users.create', 'users', 'create', '사용자 생성'),
('users.read', 'users', 'read', '사용자 조회'),
('users.update', 'users', 'update', '사용자 수정'),
('users.delete', 'users', 'delete', '사용자 삭제'),

-- 블로그 관리 권한
('posts.create', 'posts', 'create', '블로그 포스트 생성'),
('posts.read', 'posts', 'read', '블로그 포스트 조회'),
('posts.update', 'posts', 'update', '블로그 포스트 수정'),
('posts.delete', 'posts', 'delete', '블로그 포스트 삭제'),

-- 프로젝트 관리 권한
('projects.create', 'projects', 'create', '프로젝트 생성'),
('projects.read', 'projects', 'read', '프로젝트 조회'),
('projects.update', 'projects', 'update', '프로젝트 수정'),
('projects.delete', 'projects', 'delete', '프로젝트 삭제'),

-- 스킬 관리 권한
('skills.create', 'skills', 'create', '스킬 생성'),
('skills.read', 'skills', 'read', '스킬 조회'),
('skills.update', 'skills', 'update', '스킬 수정'),
('skills.delete', 'skills', 'delete', '스킬 삭제'),

-- 개인정보 관리 권한
('personal.create', 'personal', 'create', '개인정보 생성'),
('personal.read', 'personal', 'read', '개인정보 조회'),
('personal.update', 'personal', 'update', '개인정보 수정'),
('personal.delete', 'personal', 'delete', '개인정보 삭제'),

-- 시스템 관리 권한
('system.logs', 'system', 'logs', '시스템 로그 조회'),
('system.settings', 'system', 'settings', '시스템 설정 관리'),
('system.backup', 'system', 'backup', '시스템 백업');

-- 역할별 권한 매핑 (중복 방지)
-- Super Admin: 모든 권한
INSERT IGNORE INTO admin_role_permissions (role, permission_id)
SELECT 'super_admin', id FROM admin_permissions;

-- Admin: 대부분의 권한 (시스템 관리 제외)
INSERT IGNORE INTO admin_role_permissions (role, permission_id)
SELECT 'admin', id FROM admin_permissions 
WHERE resource != 'system';

-- Editor: 기본적인 CRUD 권한만
INSERT IGNORE INTO admin_role_permissions (role, permission_id)
SELECT 'editor', id FROM admin_permissions 
WHERE resource IN ('posts', 'projects', 'skills', 'personal') 
AND action IN ('create', 'read', 'update');

-- admin_user_permissions 테이블 생성 (개별 사용자별 권한)
CREATE TABLE IF NOT EXISTS admin_user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '사용자 ID',
    permission_id INT NOT NULL COMMENT '권한 ID',
    granted_by INT NULL COMMENT '권한을 부여한 사용자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES admin_users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_id),
    INDEX idx_user_id (user_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 테이블 구조 확인
DESCRIBE admin_permissions;
DESCRIBE admin_role_permissions;
DESCRIBE admin_user_permissions;

-- 생성된 권한과 역할 확인
SELECT 
    rp.role,
    p.name as permission,
    p.resource,
    p.action,
    p.description
FROM admin_role_permissions rp
JOIN admin_permissions p ON rp.permission_id = p.id
ORDER BY rp.role, p.resource, p.action;
