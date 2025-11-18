USE portfolio;

-- 현재 admin_user_permissions 테이블 구조 확인
DESCRIBE admin_user_permissions;

-- admin_user_permissions 테이블에 admin_id 컬럼 추가 (서버 코드 호환성을 위해)
ALTER TABLE admin_user_permissions 
ADD COLUMN IF NOT EXISTS admin_id INT NULL COMMENT '사용자 ID (user_id와 동일, 호환성용)';

-- admin_id 컬럼에 user_id 값 복사
UPDATE admin_user_permissions SET admin_id = user_id WHERE admin_id IS NULL;

-- admin_id 컬럼을 NOT NULL로 변경
ALTER TABLE admin_user_permissions 
MODIFY COLUMN admin_id INT NOT NULL COMMENT '사용자 ID (user_id와 동일, 호환성용)';

-- 인덱스 추가
ALTER TABLE admin_user_permissions 
ADD INDEX IF NOT EXISTS idx_admin_id (admin_id);

-- 수정된 테이블 구조 확인
DESCRIBE admin_user_permissions;

