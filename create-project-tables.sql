USE portfolio;

-- projects 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '프로젝트 제목',
    description TEXT COMMENT '프로젝트 설명',
    content LONGTEXT COMMENT '프로젝트 상세 내용',
    image_url VARCHAR(500) COMMENT '프로젝트 이미지 URL',
    github_url VARCHAR(500) COMMENT 'GitHub 저장소 URL',
    live_url VARCHAR(500) COMMENT '라이브 데모 URL',
    featured BOOLEAN DEFAULT FALSE COMMENT '추천 프로젝트 여부',
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active' COMMENT '프로젝트 상태',
    start_date DATE COMMENT '시작 날짜',
    end_date DATE COMMENT '종료 날짜',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_featured (featured),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- skills 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '스킬 이름',
    category ENUM('frontend', 'backend', 'database', 'devops', 'mobile', 'design', 'other') DEFAULT 'other' COMMENT '스킬 카테고리',
    level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate' COMMENT '숙련도',
    icon VARCHAR(100) COMMENT '아이콘 클래스 또는 URL',
    color VARCHAR(7) COMMENT '색상 코드 (#000000)',
    description TEXT COMMENT '스킬 설명',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_skills 중간 테이블 생성 (프로젝트-스킬 매핑)
CREATE TABLE IF NOT EXISTS project_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL COMMENT '프로젝트 ID',
    skill_id INT NOT NULL COMMENT '스킬 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_skill (project_id, skill_id),
    INDEX idx_project_id (project_id),
    INDEX idx_skill_id (skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_tags 중간 테이블 생성 (프로젝트-태그 매핑)
CREATE TABLE IF NOT EXISTS project_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL COMMENT '프로젝트 ID',
    tag_id INT NOT NULL COMMENT '태그 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_tag (project_id, tag_id),
    INDEX idx_project_id (project_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_images 테이블 생성 (프로젝트 이미지)
CREATE TABLE IF NOT EXISTS project_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL COMMENT '프로젝트 ID',
    image_url VARCHAR(500) NOT NULL COMMENT '이미지 URL',
    alt_text VARCHAR(255) COMMENT '이미지 대체 텍스트',
    caption VARCHAR(500) COMMENT '이미지 캡션',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    display_order INT DEFAULT 0 COMMENT '표시 순서 (호환성용)',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '대표 이미지 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_sort_order (sort_order),
    INDEX idx_display_order (display_order),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- tags 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '태그 이름',
    color VARCHAR(7) DEFAULT '#3B82F6' COMMENT '태그 색상',
    description TEXT COMMENT '태그 설명',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 스킬 데이터 삽입
INSERT IGNORE INTO skills (name, category, level, icon, color, description, sort_order) VALUES
-- Frontend
('React', 'frontend', 'expert', 'fab fa-react', '#61DAFB', 'React 라이브러리', 1),
('Next.js', 'frontend', 'expert', 'fab fa-react', '#000000', 'Next.js 프레임워크', 2),
('TypeScript', 'frontend', 'advanced', 'fab fa-js-square', '#3178C6', 'TypeScript 언어', 3),
('JavaScript', 'frontend', 'expert', 'fab fa-js-square', '#F7DF1E', 'JavaScript 언어', 4),
('HTML5', 'frontend', 'expert', 'fab fa-html5', '#E34F26', 'HTML5 마크업', 5),
('CSS3', 'frontend', 'expert', 'fab fa-css3-alt', '#1572B6', 'CSS3 스타일링', 6),
('Tailwind CSS', 'frontend', 'advanced', 'fab fa-css3-alt', '#06B6D4', 'Tailwind CSS 프레임워크', 7),
('Sass', 'frontend', 'intermediate', 'fab fa-sass', '#CC6699', 'Sass 전처리기', 8),

-- Backend
('Node.js', 'backend', 'advanced', 'fab fa-node-js', '#339933', 'Node.js 런타임', 10),
('Express.js', 'backend', 'advanced', 'fab fa-node-js', '#000000', 'Express.js 프레임워크', 11),
('Python', 'backend', 'intermediate', 'fab fa-python', '#3776AB', 'Python 언어', 12),
('Django', 'backend', 'intermediate', 'fab fa-python', '#092E20', 'Django 프레임워크', 13),

-- Database
('MySQL', 'database', 'advanced', 'fas fa-database', '#4479A1', 'MySQL 데이터베이스', 20),
('PostgreSQL', 'database', 'intermediate', 'fas fa-database', '#336791', 'PostgreSQL 데이터베이스', 21),
('MongoDB', 'database', 'intermediate', 'fas fa-database', '#47A248', 'MongoDB 데이터베이스', 22),

-- DevOps
('Docker', 'devops', 'intermediate', 'fab fa-docker', '#2496ED', 'Docker 컨테이너', 30),
('AWS', 'devops', 'beginner', 'fab fa-aws', '#FF9900', 'Amazon Web Services', 31),
('Git', 'devops', 'advanced', 'fab fa-git-alt', '#F05032', 'Git 버전 관리', 32),

-- Mobile
('React Native', 'mobile', 'intermediate', 'fab fa-react', '#61DAFB', 'React Native 모바일', 40),
('Flutter', 'mobile', 'beginner', 'fab fa-google', '#02569B', 'Flutter 모바일', 41),

-- Design
('Figma', 'design', 'intermediate', 'fab fa-figma', '#F24E1E', 'Figma 디자인 도구', 50),
('Adobe XD', 'design', 'beginner', 'fab fa-adobe', '#FF61F6', 'Adobe XD 디자인', 51);

-- 기본 태그 데이터 삽입
INSERT IGNORE INTO tags (name, color, description) VALUES
('웹 개발', '#3B82F6', '웹 애플리케이션 개발'),
('모바일 앱', '#10B981', '모바일 애플리케이션 개발'),
('풀스택', '#8B5CF6', '프론트엔드와 백엔드 모두'),
('API', '#F59E0B', 'API 개발 및 통합'),
('데이터베이스', '#EF4444', '데이터베이스 설계 및 관리'),
('UI/UX', '#EC4899', '사용자 인터페이스 및 경험'),
('반응형', '#06B6D4', '반응형 웹 디자인'),
('PWA', '#84CC16', 'Progressive Web App'),
('SPA', '#F97316', 'Single Page Application'),
('마이크로서비스', '#6366F1', '마이크로서비스 아키텍처');

-- 테이블 구조 확인
DESCRIBE projects;
DESCRIBE skills;
DESCRIBE project_skills;
DESCRIBE tags;
DESCRIBE project_tags;
DESCRIBE project_images;
