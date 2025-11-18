USE portfolio;

-- 현재 admin_users 테이블 구조 확인
DESCRIBE admin_users;

-- admin_users 테이블에 필요한 모든 컬럼들 추가
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) NULL COMMENT '마지막 로그인 IP',
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0 COMMENT '실패한 로그인 시도 횟수',
ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL COMMENT '계정 잠금 해제 시간',
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL COMMENT '비밀번호 재설정 토큰',
ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME NULL COMMENT '비밀번호 재설정 토큰 만료 시간',
ADD COLUMN IF NOT EXISTS email_verified_at DATETIME NULL COMMENT '이메일 인증 시간',
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL COMMENT '2단계 인증 시크릿',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE COMMENT '2단계 인증 활성화 여부',
ADD COLUMN IF NOT EXISTS last_activity_at DATETIME NULL COMMENT '마지막 활동 시간',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL COMMENT '생성한 사용자 ID',
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL COMMENT '수정한 사용자 ID';

-- 수정된 테이블 구조 확인
DESCRIBE admin_users;

