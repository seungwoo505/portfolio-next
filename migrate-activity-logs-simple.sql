-- 활동 로그 테이블 마이그레이션 (MariaDB 호환)
-- IP 주소와 User Agent 컬럼 추가

USE portfolio;

-- 컬럼 추가 (에러가 발생하면 이미 존재하는 것)
ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45) NULL COMMENT '마스킹된 IP 주소';

-- User Agent 컬럼 추가 (에러가 발생하면 이미 존재하는 것)
ALTER TABLE activity_logs ADD COLUMN user_agent TEXT NULL COMMENT 'OS + 브라우저 정보';

-- 테이블 구조 확인
DESCRIBE activity_logs;
