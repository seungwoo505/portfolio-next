-- 활동 로그 테이블 마이그레이션
-- IP 주소와 User Agent 컬럼 추가

USE portfolio;

-- 컬럼이 이미 존재하는지 확인
SET @sql = '';

-- IP 주소 컬럼 추가 (없는 경우에만)
SELECT COUNT(*) INTO @count FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'portfolio' AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'ip_address';

IF @count = 0 THEN
    SET @sql = CONCAT(@sql, 'ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45) NULL COMMENT ''마스킹된 IP 주소'';');
END IF;

-- User Agent 컬럼 추가 (없는 경우에만)
SELECT COUNT(*) INTO @count FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'portfolio' AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'user_agent';

IF @count = 0 THEN
    SET @sql = CONCAT(@sql, 'ALTER TABLE activity_logs ADD COLUMN user_agent TEXT NULL COMMENT ''OS + 브라우저 정보'';');
END IF;

-- SQL 실행
IF @sql != '' THEN
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT '마이그레이션 완료' as result;
ELSE
    SELECT '이미 모든 컬럼이 존재합니다' as result;
END IF;

-- 테이블 구조 확인
DESCRIBE activity_logs;
