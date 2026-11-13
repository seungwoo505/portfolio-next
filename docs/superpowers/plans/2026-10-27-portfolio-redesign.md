# 포트폴리오 전체 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 기존 기능을 유지하면서 Spotlight/Catalyst 기반의 일관된 포트폴리오를 새 브랜치에 구현한다.

**Architecture:** 현재 API, 인증, 서버 메타데이터 및 콘텐츠 렌더러를 유지하고 표현 컴포넌트를 교체한다. 공통 디자인 토큰과 공개/관리자 셸을 먼저 정의하며, 파일 소유권이 겹치지 않는 화면 그룹을 병행한다. 검증은 전용 loopback fixture API와 외부 네트워크 차단 하에서 수행한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Spotlight/Catalyst의 선택한 TypeScript 소스, node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-portfolio-redesign-design.md`

## Global Constraints

- 새 브랜치 `codex/portfolio-redesign`에서 작업한다. 커밋, 푸시, 배포는 이번 요청 범위에 포함하지 않는다.
- Dev 및 Live 서버에는 절대로 직접 접속하지 않는다. 모든 런타임 검증은 loopback에 바인딩된 앱과 로컬 fixture API로 수행한다.
- 기존 검색, 다중 필터, 정렬, 페이지 이동, 상세 slug, 메타데이터, 조회수, 폼, 인증, 관리자 CRUD와 콘텐츠 편집 기능을 유지한다.
- 실제 성과, 경력, 프로젝트 데이터는 만들지 않는다. fixture는 검증 데이터임을 명확히 표시한다.
- 스타일 변경을 위한 구현 복제 테스트는 만들지 않는다. 동작 변경에는 회귀 테스트를 먼저 작성한다.

## Review Focus

1. 서버 fallback이나 클라이언트 절대 API URL이 격리 모드를 빠져나가지 않아야 한다.
2. 검색/복수 필터/페이지 이동과 상세 링크가 기존 데이터 및 slug 규칙을 유지해야 한다.
3. 테마 전환과 공개/관리자 이동에서 색상 및 포커스가 유지되어야 한다.
4. 비어 있거나 긴 한글 콘텐츠, 없는 이미지, 로딩/실패에서도 읽기와 조작이 가능해야 한다.
5. 관리자 인증/저장/취소/업로드 동작과 문의 폼의 입력/비활성/제출 상태가 유지되어야 한다.

---

### Task 1: 공통 디자인 및 홈

**Files:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/site/*`, `src/components/ui/*`, `src/app/components/ClientHome.tsx`, `src/app/components/home/*`, `src/app/(site)/layout.tsx`, `src/components/Pagination.tsx`, `src/components/ProjectCoverImage.tsx`, `package.json`, `package-lock.json`.

**Interfaces:** 공통 `site-shell`, `site-container`, `site-section`, `section-label`, `page-heading`, `page-intro`, `surface-card`, `action-primary`, `action-secondary`, `field-input`, `tag`, `filter-chip`, `prose-content`, `admin-shell` CSS 클래스를 제공한다. 자식 페이지는 고유 UI와 기존 동작을 유지하며 이 클래스를 사용할 수 있다.

- [x] Spotlight Container/레이아웃 규칙과 Catalyst의 선택한 실제 컴포넌트를 통합한다.
- [x] 전역 강제 dark 덮어쓰기를 디자인 토큰과 class dark 변형으로 대체한다. 네트워크 폰트 의존을 제거한다.
- [x] 공개 헤더/푸터, 프로젝트가 먼저 보이는 홈, 기술 분류, 로딩/오류/빈 상태를 구현한다.
- [x] 기존 회귀 테스트 및 TypeScript/빌드에서 기존 인터페이스를 검증한다.

### Task 2: 프로젝트와 블로그

**Files:** `src/app/(site)/projects/page.tsx`, `src/app/(site)/projects/[slug]/ProjectDetailClient.tsx`, `src/app/(site)/blog/page.tsx`, `src/app/(site)/blog/[slug]/BlogPostClient.tsx`.

**Interfaces:** Task 1 CSS를 소비한다. API, 상세 서버 래퍼, 메타데이터, sanitize 로직과 조회수 로직은 유지한다.

- [x] 이미지 중심 프로젝트 목록과 읽기 좋은 상세를 구현한다.
- [x] 제목 중심 블로그 목록과 prose 상세를 구현한다.
- [x] 검색/복수 태그/정렬/페이지 이동/외부 링크/빈 상태를 보존하고 검사한다.

### Task 3: 소개·연락·설정 및 관리자

**Files:** `src/app/(site)/about/page.tsx`, `src/app/(site)/contact/page.tsx`, `src/app/(site)/settings/page.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/components/AdminHeader.tsx`, `src/app/admin/components/AdminSidebar.tsx`, `src/app/admin-login/page.tsx` 및 관리자 화면의 표현 클래스.

**Interfaces:** Task 1 CSS와 `src/components/ui`의 선택한 Catalyst 부품을 소비한다. 기존 CRUD 폼 제어 및 인증 가드를 유지한다.

- [x] 소개의 경험/기술과 연락 폼 상태, 설정 설명 목록을 새 규칙으로 정리한다.
- [x] 관리자와 로그인 셸을 일관된 중립색 UI로 정리한다.
- [x] 관리자 내부 폼/표/상태를 같은 디자인으로 맞추고 기존 회귀 테스트를 실행한다.

### Task 4: 격리 검증과 통합

**Files:** `src/lib/api-config.ts`, `scripts/isolated-*`, `tests/isolation.test.cjs`, `tests/*`의 필요한 행동 회귀, `.env.example`.

**Interfaces:** `NEXT_PUBLIC_ISOLATED_PREVIEW=1`과 loopback URL 세 개를 사용하는 명시적 opt-in 검증 모드. 기본 배포 설정의 동작은 바꾸지 않는다.

- [x] 외부 URL/상대 fallback 차단에 대한 실패 테스트를 먼저 작성하고 확인한다.
- [x] 격리 모드에서 클라이언트/서버/fallback URL을 loopback으로만 제한한다.
- [x] 실제 API 계약에 맞는 로컬 fixture API와 loopback 앱 실행 스크립트를 만든다.
- [x] 기존 테스트, ESLint, TypeScript, production build를 확인한다.
- [x] 외부 요청 차단 브라우저로 공개/관리자, mobile/desktop, light/dark와 핵심 조작을 검증한다.
- [x] 전체 변경을 독립 리뷰하고 필요한 수정 후 검증 근거와 남은 한계를 보고한다.
