# 추가 품질 점검 및 로컬 격리 검증

2026-10-28, `D:\portfolio-next`, `codex/portfolio-redesign`의 미커밋 작업 트리를 대상으로 확인했다. Dev/Live 접속, 배포, Git fetch/push는 하지 않았다.

## 확인하고 보완한 항목

1. **문의 응답 대기 중 새 초안 소실**
   - 기존 코드는 성공 응답 뒤 폼 전체를 초기화해 대기 중 고친 내용까지 지웠다.
   - 제출 시점의 입력 revision과 비교해 새 입력이 있으면 전체 초안을 보존하고 버튼을 idle로 돌린다. 변경이 없으면 기존 성공 표시와 초기화를 유지한다.
   - 실제 컴포넌트 회귀가 수정 전 입력 소실로 실패하고 수정 후 통과했다. 브라우저에서는 지연 응답 도중 제목/메시지 수정, 기존 payload 유지, 응답 후 초안 보존, 다음 제출 payload 및 초기화를 확인했다.
   - 파일: `src/app/(site)/contact/page.tsx`, `tests/contact-feedback.test.cjs`.
2. **HTML 본문만 있는 블로그 글의 본문 누락**
   - 관리자는 content_text 또는 content를 기준으로 검증하므로 content가 비고 content_html이 있는 저장 상태가 유효하다. 공개 상세는 content만 검사해 본문을 누락했다.
   - 본문 존재 검사 두 곳에 content_html을 포함하고 기존 sanitizeHtml 우선 처리를 유지했다.
   - 신규 네 가지 회귀는 HTML-only, HTML 우선, 공백 HTML의 Markdown fallback, 본문 부재를 검증한다. HTML-only는 수정 전 실패했다.
   - Node 단위 테스트의 DOMPurify 경계는 DOM 부재로 대체했다. 실제 브라우저에서도 로컬 합성 글을 HTML-only로 잠시 바꿔 표시와 script 제거를 확인했고 원본을 복원했다.
   - 파일: `src/app/(site)/blog/[slug]/BlogPostClient.tsx`, `tests/blog-content.test.cjs`.
3. **블로그 검색 비활성 설정 미반영**
   - 관리자 및 fixture 키는 enable_search인데 공개 블로그는 search_enabled만 읽었다.
   - enable_search를 우선하고 없으면 기존 search_enabled를 사용한다. 둘 다 없으면 검색을 표시한다. 이미 존재하는 서버 키의 optional 타입을 선언했으며 새 서버 필드는 요구하지 않는다.
   - 실제 컴포넌트 다섯 가지 조합에서 수정 전 세 가지가 실패했고 수정 후 통과했다. 브라우저에서도 canonical false/true 및 legacy false를 확인했다.
   - 파일: `src/app/(site)/blog/page.tsx`, `src/types/common.ts`, `tests/redesign-content.test.cjs`.
4. **관리자 설정 입력 라벨 연결**
   - boolean/number/json/text 입력의 id와 공통 label htmlFor를 연결했다.
   - 실제 브라우저에서 모든 설정 탭의 입력과 라벨 연결, getByLabel 포커스, boolean 라벨 클릭 토글 및 복원을 확인했다. 설정 저장은 실행하지 않았고 비 GET 설정 요청도 차단했다.
   - 파일: `src/app/admin/settings/page.tsx`.
5. **확대 글꼴에서 가로 넘침**
   - 모바일 390px에서 루트 글꼴을 16→32px로 키우면 헤더 버튼이 오른쪽 445px까지 나갔다. 헤더를 최소 높이/줄바꿈 배치로 바꾸고 로고 폭과 컨트롤 축소를 제어했다. 기본 크기의 기존 줄 배치는 유지한다.
   - 헤더 수정 뒤 문의 화면에서 최소 9rem 버튼이 카드의 폭을 밀어내는 문제도 확인했다. 최소 너비를 사용 가능한 폭 안으로 제한하고 단일 열 grid의 최소 트랙을 0으로 잡았다.
   - 밝은/어두운 테마 × 공개 8개 경로, 총 16개 확대 글꼴 검사에서 문서 가로 넘침이 없음을 확인했다. 원본 실패와 중간 결과는 별도 보존했다.
   - 파일: `src/components/Header.tsx`, `src/app/(site)/contact/page.tsx`, `src/app/(site)/contact/contact-feedback.css`.

## 최종 검증

- 전체 단위 테스트: 115/115 통과. `.verification/additional-audit/unit-tests.log`.
- 전체 ESLint: 종료 0.
- TypeScript 단독 검사 및 최종 격리 production build의 타입 검사: 통과. 최종 빌드는 정적 페이지 30개 생성 후 로컬 start 준비까지 확인했다.
- 추가 브라우저: 38/38 통과. `.verification/additional-audit/report.json`.
- 기본 모션: 5/5 통과. `.verification/isolated-motion/report.json`.
- 연결 모션: 13/13 통과. `.verification/isolated-connected-motion/report.json`.
- 기존 기능 브라우저 회귀: 57/57 통과. `.verification/isolated-smoke/report.json`. 최종 변경 이후 빌드에서 네 브라우저 검증 모음 총 113/113 통과했으며, 모두 외부 요청 시도와 미처리 브라우저 오류는 0이다.
- 추가 브라우저 보고서: 외부 HTTP/WebSocket 시도 0, 미처리 브라우저 오류 0, console 오류 0, 설정 저장 0, HTML-only 합성 글 원본 복원 true.
- 추가 점검 실패 원본: `.verification/additional-audit/baseline-report.json`, 헤더 수정 후 문의 폭 발견 보고서: `header-fixed-report.json`.
- 검증 도구의 최초 fetch Response.ok 함수/속성 판정 오류는 도구 코드만 수정했다. 제품 문제로 분류하지 않았다.

## 후속 개선 후보 (이번에는 미적용)

1. **관리자 모달 및 모바일 메뉴의 키보드 포커스**
   - 실제 모바일 브라우저에서 메뉴를 열어도 포커스가 헤더의 실행 버튼에 남고 Escape 뒤 aria-expanded=true가 유지되는 것을 확인했다.
   - 태그 삭제 ConfirmModal에서 Tab 세 번째부터 배경으로 이탈하고 Escape 닫힘 후 실행 버튼으로 복귀하지 않는 것을 확인했다. 삭제는 실행하지 않았다. 사용자/태그/스킬 입력 모달에도 같은 포커스 관리 누락이 소스에 있다.
   - 다음 개선은 모바일 메뉴의 초기 포커스/배경 탐색 제한/Escape/복귀와 공통 모달의 포커스 순환/복귀다. 우선순위 P2.
   - 근거: 추가 보고서 findings 및 `AdminSidebar.tsx`, `src/app/admin/layout.tsx`, `ConfirmModal.tsx`, 관리자 입력 모달.
2. **상세 SSR의 일시적 API 오류와 실제 문서 부재 구분**
   - 소스에서 프로젝트/블로그 상세의 getProject/getPost는 모든 예외를 null로 바꾸고 페이지는 notFound()를 호출한다. timeout/503도 404로 처리될 수 있다.
   - 다음 개선은 상태 정보를 유지하고 실제 404만 문서 부재로 처리하며 나머지는 복구 가능한 오류 화면으로 전달하는 것이다. 기존 server-fetch fallback/캐시 정책과 함께 검토해야 한다. 우선순위 P2.
   - 근거는 로컬 소스 흐름이다. 실제 서버 장애를 재현하거나 접속한 결과가 아니다.
3. **프로젝트 공유 미리보기 이미지 URL 정규화**
   - 화면 이미지 컴포넌트는 GitHub blob URL을 raw 이미지 주소로 바꾸지만 상세 SEO/JSON-LD는 원문을 사용한다.
   - blob 주소를 등록할 때 공유 메타데이터에도 같은 정규화를 적용하는 후속 개선이 가능하다. 우선순위 P3.
   - 근거는 로컬 소스다. 외부 GitHub나 공유 크롤러에는 접속하지 않았다.

## 검증 범위

앱 `127.0.0.1:4318`, 합성 API `127.0.0.1:4319`만 사용했다. 서버 TCP/DNS/fetch 및 브라우저 HTTP/WebSocket과 프록시를 통해 외부 통신을 차단했다. Chrome은 임시 프로필이며 모바일은 브라우저 에뮬레이션이다. 확대 검사는 CSS 루트 글꼴을 32px로 설정한 텍스트 확대 검사이며 실제 기기나 브라우저의 모든 확대 방식을 검증한 결과는 아니다.

기존 API endpoint/payload, 저장·권한 로직, 프로젝트/글 조회수, 검색/필터/정렬/페이지 이동 및 모션 동작은 유지했다. 백엔드 API·DB·migration 변경은 없다. 실제 메일·저장·업로드·운영 데이터는 검증하지 않았다. `.next`는 fixture 환경변수로 만든 로컬 검증 전용이다. 변경은 현재 브랜치에 미커밋 상태로 유지했다.
검증 종료 후 이번 작업에서 실행한 격리 launcher를 Ctrl+C로 종료했고, 4318/4319 리스너가 0개임을 확인했다.

후속 적용: 위 미적용 후보 세 가지는 같은 날짜에 모두 적용하고 검증했다. 최종 구현과 152개 단위/171개 브라우저 및 HTTP 검증 결과는 2026-10-28-remaining-improvements.md를 참조한다.
