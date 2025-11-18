-- 활동 로그 테이블에서 불필요한 컬럼 제거
-- IP 주소와 User Agent 정보는 보안상 민감할 수 있으므로 제거

ALTER TABLE portfolio.activity_logs 
DROP COLUMN ip_address,
DROP COLUMN user_agent;

-- 테이블 구조 확인
DESCRIBE portfolio.activity_logs;
