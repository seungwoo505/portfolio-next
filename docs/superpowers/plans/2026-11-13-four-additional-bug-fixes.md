# 추가 확인된 4건의 버그 수정 계획

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 추가 감사에서 재현한 입력 유실·성과 삭제 누락·관리자 slug 인코딩·빈 본문 무한 로딩을 수정한다.

**Architecture:** 기존 컴포넌트와 API 경계를 유지한다. 개인정보 저장은 입력 revision을 비교해 새 초안을 보존하고, 성과는 항상 배열로 전송한다. 관리자 경로·쿼리는 원본 slug를 각 위치에 맞게 인코딩한다. 상세 본문은 변환 중 상태와 완료된 빈 문자열을 구분하고 정화 후 빈 HTML은 Markdown으로 대체한다.

**Tech Stack:** 현행 Next/React/TypeScript/ESLint 구성 유지. 기존 Node React harness와 외부 통신 차단 Playwright Chrome·loopback 합성 API 사용.

**Spec:** `.verification/extended-audit-20261113/audit-report.json`의 EXTRA-01~04와 사용자 수정 요청.

## 제약과 검토 초점

- 모든 대화는 한국어. Dev/Live 접속 금지. 기존 7건 수정과 테스트를 보존하며 현재 브랜치에서 진행한다.
- 의존성·도구 병행 구성은 유지한다. 새 커밋·푸시는 이번 요청에 포함하지 않는다.
- 개인정보는 저장 중 같은 필드/다른 필드의 수정, 정상 저장과 실패 후 재시도를 검증한다.
- 빈 성과 배열과 일부 남긴 성과를 모두 검증한다. 실백엔드의 누락 필드 의미는 가정하지 않는다.
- 일반·한글·`%`·리터럴 `%20`·`#`·`?`·`&` slug를 확인한다. API 경로, 편집 쿼리 링크, 삭제·공개·추천 동작이 같은 원본을 가리켜야 한다.
- HTML 정화는 유지한다. 정상 HTML은 우선하고, 정화로 빈 HTML은 Markdown을 쓰며, 내용이 모두 없으면 완료된 빈 본문으로 처리한다.
- 기존 공개 페이지의 조회수·발행일·모션·편집 기능을 회귀 검증한다.

## 작업

- [x] Task 1: `tests/admin-draft-save.test.cjs`에서 개인정보 지연 응답과 성과 삭제 회귀를 먼저 실패시킨 뒤, `src/app/admin/personal-info/page.tsx`, `src/app/admin/experiences/page.tsx`를 수정한다.
- [x] Task 2: `tests/admin-slug-routing.test.cjs`에서 실제 API·편집·목록 핸들러를 실행해 경로·쿼리를 검증하고, `src/lib/admin-api.ts`와 관리자 blog/projects 목록·편집 페이지의 slug 사용 위치를 수정한다.
- [x] Task 3: `tests/detail-empty-content.test.cjs`에서 두 상세 컴포넌트의 정화/Markdown/빈 상태를 실패시킨 뒤, 해당 컴포넌트에서 빈 결과를 완료 상태로 처리한다.
- [x] Task 4: 전체 단위·린트·타입 검사 및 격리 production build를 실행한다. 원래 추가 감사의 20사례와 관리자 저장·삭제·상태 변경을 실제 브라우저에서 확인한다. 기존 smoke·읽기·모션·편집도 검증한다.
- [x] Task 5: 독립 코드 검토를 반영하고 소유 프로세스를 종료한다. 증거를 `.verification/four-additional-fixes-20261113`에 별도 보존하고 결과를 기록한다.

## 결과

신규 29개 회귀 중 정상 대조 6개가 통과하고 결함 검증 23개가 실패하는 것을 확인한 후 구현했다. 수정 후 29/29를 통과했고, 기존 테스트를 포함한 최종 단위 테스트는 301/301이다. ESLint 오류·경고 0, 네이티브 TypeScript 검사와 격리 production build도 통과했다. 기존 본문 부재 안내 문구는 보존했다.

실제 Chrome에서는 원래 추가 감사 20사례와 특수문자 slug의 목록 링크·편집 저장·공개/추천 토글·삭제 2사례가 모두 통과했다. 개인정보는 저장 중 추가 입력이 남고 다시 저장하면 합성 API에도 반영되는 것을 확인했다. 성과 전체 삭제는 실제 요청 JSON `[]`, 저장 데이터와 재편집 입력란 모두 비어 있는 것을 확인했다. 본문 정화는 실제 DOMPurify로 검증했다.

기존 회귀는 smoke 57, 읽기 267, 진입 모션 5, 연결 모션 13, 편집·재열기·이미지·정화 17, 원래 7건의 재현 16, 인증 복구·발행일·기술 필터 3개를 확인했다. 추가 검사 22개를 합쳐 브라우저 총 400개가 통과했다.

독립 검토에서도 중요 문제와 요구 누락이 없었고 신규 테스트 29/29를 별도로 통과했다. 모든 검증은 외부 통신이 차단된 loopback 앱·합성 메모리 API에서 수행했으며, 각 실행의 소유 프로세스 종료와 포트 미응답을 확인했다. 실제 백엔드·Dev·Live에는 접속하지 않았다. 의존성과 도구 구성은 유지했고, 이전 7건을 포함한 변경은 미커밋 상태다.

최종 보고서: `.verification/four-additional-fixes-20261113/summary.json`. 수정 전 감사 기록은 별도로 보존했다.

## 후속 커밋 요청

검증 완료 후 사용자가 커밋을 요청했다. 앞선 7건과 추가 4건의 수정, 회귀 테스트 7개 파일 및 두 계획 문서를 현재 브랜치에 함께 커밋한다. 커밋 전 전체 테스트를 다시 실행하고 검증 보고서의 소스 해시와 일치하는지 확인한다. 작성·커밋 시각은 부모 커밋 이후로 설정하고 원격 푸시는 수행하지 않는다.
