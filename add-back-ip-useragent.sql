-- 활동 로그 테이블에 IP 주소와 User Agent 컬럼 다시 추가
-- 보안을 고려하여 마스킹된 정보만 저장

ALTER TABLE portfolio.activity_logs 
ADD COLUMN ip_address VARCHAR(45) NULL COMMENT '마스킹된 IP 주소',
ADD COLUMN user_agent TEXT NULL COMMENT '정리된 User Agent 정보';

-- 테이블 구조 확인
DESCRIBE portfolio.activity_logs;
